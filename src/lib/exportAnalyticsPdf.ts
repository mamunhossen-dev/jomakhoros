import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { BENGALI_WEB_FONT, registerBengaliFont } from './pdfFont';

const FONT = 'NotoBengali';

export type AnalyticsKpi = {
  income: number;
  expense: number;
  balance: number;
  savings: number;
  savingsRate: number;
  count: number;
};

export type AnalyticsExportData = {
  kpi: AnalyticsKpi;
  timeSeries: { month: string; income: number; expense: number }[];
  categories: { name: string; value: number }[];
  insights: string[];
};

const containsBengali = (value: unknown) => typeof value === 'string' && /[\u0980-\u09FF]/.test(value);

function drawBengaliTextAsImage(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options: { fontSize?: number; color?: string; lineHeight?: number } = {}
) {
  if (!text.trim()) return 0;

  const fontSize = options.fontSize ?? 9;
  const lineHeight = options.lineHeight ?? 1.55;
  const pxPerMm = 3.78;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;

  ctx.font = `${fontSize * pxPerMm}px ${BENGALI_WEB_FONT}, sans-serif`;
  const words = text.split(' ');
  const maxPxWidth = maxWidth * pxPerMm;
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxPxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);

  const linePxHeight = fontSize * pxPerMm * lineHeight;
  canvas.width = Math.ceil(maxPxWidth + 8);
  canvas.height = Math.ceil(lines.length * linePxHeight + 8);
  ctx.font = `${fontSize * pxPerMm}px ${BENGALI_WEB_FONT}, sans-serif`;
  ctx.fillStyle = options.color ?? '#475569';
  ctx.textBaseline = 'top';
  lines.forEach((row, index) => ctx.fillText(row, 0, 4 + index * linePxHeight));

  const imageHeight = canvas.height / pxPerMm;
  doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, maxWidth, imageHeight);
  return imageHeight;
}

function hideBengaliAutoTableText(cellData: any) {
  if (cellData.section === 'body' && containsBengali(cellData.cell.raw)) {
    cellData.cell.text = [''];
  }
}

function drawBengaliAutoTableText(doc: jsPDF, cellData: any) {
  if (cellData.section !== 'body' || !containsBengali(cellData.cell.raw)) return;
  drawBengaliTextAsImage(doc, String(cellData.cell.raw), cellData.cell.x + 2, cellData.cell.y + 3, cellData.cell.width - 4, {
    fontSize: 8,
    color: '#334155',
    lineHeight: 1.25,
  });
}

export async function exportAnalyticsPdf(
  data: AnalyticsExportData,
  userName: string,
  userEmail: string,
  filters?: { dateFrom?: string; dateTo?: string }
) {
  const doc = new jsPDF();
  await registerBengaliFont(doc);
  doc.setFont(FONT, 'normal');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 52, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('JomaKhoros.com', 14, 18);
  doc.setFontSize(9);
  doc.text('Analytics Report', 14, 25);
  doc.setFontSize(10);
  doc.text(`Name: ${userName || 'N/A'}`, 14, 35);
  doc.text(`Email: ${userEmail}`, 14, 41);
  const fromLabel = filters?.dateFrom || 'All';
  const toLabel = filters?.dateTo || 'All';
  doc.text(`Period: ${fromLabel} to ${toLabel}`, 14, 47);
  doc.setFontSize(8);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth - 14, 47, { align: 'right' });

  // KPI cards
  doc.setTextColor(0, 0, 0);
  const y = 60;
  const cards: { label: string; value: string; color: [number, number, number]; bg: [number, number, number] }[] = [
    { label: 'Total Income', value: `TK ${data.kpi.income.toFixed(2)}`, color: [22, 163, 74], bg: [240, 253, 244] },
    { label: 'Total Expense', value: `TK ${data.kpi.expense.toFixed(2)}`, color: [220, 38, 38], bg: [254, 242, 242] },
    { label: 'Current Balance', value: `TK ${data.kpi.balance.toFixed(2)}`, color: data.kpi.balance >= 0 ? [22, 163, 74] : [220, 38, 38], bg: [239, 246, 255] },
    { label: 'Savings', value: `TK ${data.kpi.savings.toFixed(2)}`, color: [37, 99, 235], bg: [239, 246, 255] },
    { label: 'Savings Rate', value: `${data.kpi.savingsRate.toFixed(1)}%`, color: [124, 58, 237], bg: [245, 243, 255] },
  ];
  const cardW = (pageWidth - 28 - 4 * 4) / 5;
  cards.forEach((c, i) => {
    const x = 14 + i * (cardW + 4);
    doc.setFillColor(...c.bg);
    doc.roundedRect(x, y, cardW, 22, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(c.label, x + 3, y + 6);
    doc.setFontSize(10);
    doc.setTextColor(...c.color);
    doc.text(c.value, x + 3, y + 16);
  });

  // Income vs Expense table
  autoTable(doc, {
    startY: y + 30,
    head: [['Period', 'Income', 'Expense', 'Net']],
    body: data.timeSeries.map(r => [
      r.month,
      `TK ${r.income.toFixed(2)}`,
      `TK ${r.expense.toFixed(2)}`,
      `TK ${(r.income - r.expense).toFixed(2)}`,
    ]),
    headStyles: { fillColor: [30, 41, 59], fontSize: 9, font: FONT },
    bodyStyles: { fontSize: 8, font: FONT },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { font: FONT },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('Income vs Expense', 14, y + 28);
    },
  });

  let cursorY = (doc as any).lastAutoTable.finalY + 10;

  // Category breakdown
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Category-wise Expense', 14, cursorY);
  const totalExp = data.categories.reduce((s, c) => s + c.value, 0) || 1;
  autoTable(doc, {
    startY: cursorY + 2,
    head: [['Category', 'Amount', '% of Total']],
    body: data.categories.map(c => [
      c.name,
      `TK ${c.value.toFixed(2)}`,
      `${((c.value / totalExp) * 100).toFixed(1)}%`,
    ]),
    headStyles: { fillColor: [30, 41, 59], fontSize: 9, font: FONT },
    bodyStyles: { fontSize: 8, font: FONT },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { font: FONT },
    margin: { left: 14, right: 14 },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 10;

  // Smart Insights
  if (data.insights.length) {
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Smart Insights', 14, cursorY);
    cursorY += 6;
    for (const ins of data.insights) {
      const renderedHeight = await drawBengaliTextAsImage(doc, `- ${ins}`, 14, cursorY, pageWidth - 28, {
        fontSize: 9,
        color: '#475569',
      });
      cursorY += renderedHeight + 2;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    doc.text('JomaKhoros.com - Analytics Report', 14, doc.internal.pageSize.getHeight() - 8);
  }

  doc.save(`JomaKhoros_Analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
