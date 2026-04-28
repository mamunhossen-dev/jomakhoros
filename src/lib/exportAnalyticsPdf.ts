import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const FONT = 'helvetica';

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

const BN_MONTHS: Record<string, string> = {
  'জানু': 'Jan', 'ফেব': 'Feb', 'মার্চ': 'Mar', 'এপ্রি': 'Apr', 'মে': 'May', 'জুন': 'Jun',
  'জুলা': 'Jul', 'আগ': 'Aug', 'সেপ': 'Sep', 'অক্টো': 'Oct', 'নভে': 'Nov', 'ডিসে': 'Dec',
};

function toEnglishPeriod(label: string) {
  return Object.entries(BN_MONTHS).reduce((text, [bn, en]) => text.replace(bn, en), label);
}

function toEnglishCategory(name: string) {
  if (!/[\u0980-\u09FF]/.test(name)) return name || 'Uncategorized';
  const normalized = name.toLowerCase();
  if (/বাসা|বাড়ি|বাড়ি|হাউজিং|ভাড়া|ভাড়া/.test(normalized)) return 'Housing';
  if (/খাবার|ফুড|রেস্টুরেন্ট/.test(normalized)) return 'Food';
  if (/যাতায়াত|যাতায়াত|পরিবহন|ট্রান্সপোর্ট/.test(normalized)) return 'Transport';
  if (/স্বাস্থ্য|মেডিকেল|ঔষধ/.test(normalized)) return 'Health';
  if (/শিক্ষা|স্কুল|কলেজ/.test(normalized)) return 'Education';
  if (/বিনোদন/.test(normalized)) return 'Entertainment';
  if (/শপিং|কেনাকাটা/.test(normalized)) return 'Shopping';
  if (/বিল|ইউটিলিটি|বিদ্যুৎ|গ্যাস/.test(normalized)) return 'Bills';
  if (/অশ্রেণী|অশ্রেনী/.test(normalized)) return 'Uncategorized';
  return 'Category';
}

export async function buildAnalyticsPdf(
  data: AnalyticsExportData,
  userName: string,
  userEmail: string,
  filters?: { dateFrom?: string; dateTo?: string }
) {
  const doc = new jsPDF();
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
      toEnglishPeriod(r.month),
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
      toEnglishCategory(c.name),
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
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const topCategory = data.categories[0];
    const totalExpense = data.kpi.expense || 1;
    const englishInsights = [
      topCategory
        ? `- Highest spending category: ${toEnglishCategory(topCategory.name)} — TK ${topCategory.value.toFixed(2)} (${((topCategory.value / totalExpense) * 100).toFixed(1)}% of total expense)`
        : '',
      data.kpi.savingsRate >= 20
        ? `- Great job! You saved ${data.kpi.savingsRate.toFixed(1)}% of your income.`
        : data.kpi.savingsRate < 0
          ? '- Warning: expenses are higher than income in this period.'
          : `- Savings rate is ${data.kpi.savingsRate.toFixed(1)}%. Try to improve it over time.`,
    ].filter(Boolean);
    englishInsights.forEach((insight) => {
      const lines = doc.splitTextToSize(insight, pageWidth - 28);
      doc.text(lines, 14, cursorY);
      cursorY += lines.length * 5 + 1;
    });
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

  return doc;
}

export async function exportAnalyticsPdf(
  data: AnalyticsExportData,
  userName: string,
  userEmail: string,
  filters?: { dateFrom?: string; dateTo?: string }
) {
  const doc = await buildAnalyticsPdf(data, userName, userEmail, filters);
  doc.save(`JomaKhoros_Analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export async function exportAnalyticsImage(
  data: AnalyticsExportData,
  userName: string,
  userEmail: string,
  filters?: { dateFrom?: string; dateTo?: string }
) {
  // Direct canvas render — mirrors PDF layout, fast, no pdfjs/worker.
  const W = 1240; // ~A4 width @ 150dpi
  const PAD = 40;
  const contentW = W - PAD * 2;

  // Estimate height
  const totalExp = data.categories.reduce((s, c) => s + c.value, 0) || 1;
  const tsRows = data.timeSeries.length;
  const catRows = data.categories.length;
  const insightLines = data.insights.length + (data.kpi.savingsRate ? 1 : 0);
  const H =
    260 + // header + KPIs
    50 + (tsRows + 1) * 36 + 30 + // time series table
    50 + (catRows + 1) * 36 + 30 + // category table
    50 + insightLines * 28 + 60; // insights + footer

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Header bar
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, W, 180);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Helvetica, Arial, sans-serif';
  ctx.fillText('JomaKhoros.com', PAD, 60);
  ctx.font = '16px Helvetica, Arial, sans-serif';
  ctx.fillText('Analytics Report', PAD, 88);
  ctx.font = '14px Helvetica, Arial, sans-serif';
  ctx.fillText(`Name: ${userName || 'N/A'}`, PAD, 118);
  ctx.fillText(`Email: ${userEmail}`, PAD, 138);
  const fromLabel = filters?.dateFrom || 'All';
  const toLabel = filters?.dateTo || 'All';
  ctx.fillText(`Period: ${fromLabel} to ${toLabel}`, PAD, 158);
  ctx.textAlign = 'right';
  ctx.font = '12px Helvetica, Arial, sans-serif';
  ctx.fillText(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, W - PAD, 158);
  ctx.textAlign = 'left';

  // KPI cards
  const cards = [
    { label: 'Total Income', value: `TK ${data.kpi.income.toFixed(2)}`, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Total Expense', value: `TK ${data.kpi.expense.toFixed(2)}`, color: '#dc2626', bg: '#fef2f2' },
    { label: 'Current Balance', value: `TK ${data.kpi.balance.toFixed(2)}`, color: data.kpi.balance >= 0 ? '#16a34a' : '#dc2626', bg: '#eff6ff' },
    { label: 'Savings', value: `TK ${data.kpi.savings.toFixed(2)}`, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Savings Rate', value: `${data.kpi.savingsRate.toFixed(1)}%`, color: '#7c3aed', bg: '#f5f3ff' },
  ];
  const cardGap = 12;
  const cardW = (contentW - cardGap * 4) / 5;
  const cardY = 210;
  cards.forEach((c, i) => {
    const x = PAD + i * (cardW + cardGap);
    ctx.fillStyle = c.bg;
    roundRect(ctx, x, cardY, cardW, 80, 8);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Helvetica, Arial, sans-serif';
    ctx.fillText(c.label, x + 12, cardY + 24);
    ctx.fillStyle = c.color;
    ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
    ctx.fillText(c.value, x + 12, cardY + 56);
  });

  let y = cardY + 110;

  // Income vs Expense table
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
  ctx.fillText('Income vs Expense', PAD, y);
  y += 14;
  y = drawTable(
    ctx,
    PAD,
    y,
    contentW,
    ['Period', 'Income', 'Expense', 'Net'],
    data.timeSeries.map(r => [
      toEnglishPeriod(r.month),
      `TK ${r.income.toFixed(2)}`,
      `TK ${r.expense.toFixed(2)}`,
      `TK ${(r.income - r.expense).toFixed(2)}`,
    ]),
  );

  y += 30;

  // Category breakdown
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
  ctx.fillText('Category-wise Expense', PAD, y);
  y += 14;
  y = drawTable(
    ctx,
    PAD,
    y,
    contentW,
    ['Category', 'Amount', '% of Total'],
    data.categories.map(c => [
      toEnglishCategory(c.name),
      `TK ${c.value.toFixed(2)}`,
      `${((c.value / totalExp) * 100).toFixed(1)}%`,
    ]),
  );

  y += 30;

  // Insights
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
  ctx.fillText('Smart Insights', PAD, y);
  y += 24;
  ctx.fillStyle = '#475569';
  ctx.font = '14px Helvetica, Arial, sans-serif';
  const topCategory = data.categories[0];
  const totalExpense = data.kpi.expense || 1;
  const englishInsights = [
    topCategory
      ? `- Highest spending category: ${toEnglishCategory(topCategory.name)} — TK ${topCategory.value.toFixed(2)} (${((topCategory.value / totalExpense) * 100).toFixed(1)}% of total expense)`
      : '',
    data.kpi.savingsRate >= 20
      ? `- Great job! You saved ${data.kpi.savingsRate.toFixed(1)}% of your income.`
      : data.kpi.savingsRate < 0
        ? '- Warning: expenses are higher than income in this period.'
        : `- Savings rate is ${data.kpi.savingsRate.toFixed(1)}%. Try to improve it over time.`,
  ].filter(Boolean);
  englishInsights.forEach((line) => {
    ctx.fillText(line, PAD, y);
    y += 24;
  });

  // Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Helvetica, Arial, sans-serif';
  ctx.fillText('JomaKhoros.com - Analytics Report', PAD, H - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Generated ${format(new Date(), 'dd MMM yyyy')}`, W - PAD, H - 20);
  ctx.textAlign = 'left';

  // Download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JomaKhoros_Analytics_${format(new Date(), 'yyyy-MM-dd')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTable(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  headers: string[],
  rows: string[][],
): number {
  const rowH = 36;
  const colW = w / headers.length;

  // Header row
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y, w, rowH);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Helvetica, Arial, sans-serif';
  headers.forEach((h, i) => {
    ctx.fillText(h, x + i * colW + 12, y + 24);
  });
  let cy = y + rowH;

  // Body rows
  ctx.font = '13px Helvetica, Arial, sans-serif';
  rows.forEach((row, ri) => {
    if (ri % 2 === 0) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x, cy, w, rowH);
    }
    ctx.fillStyle = '#0f172a';
    row.forEach((cell, ci) => {
      ctx.fillText(String(cell), x + ci * colW + 12, cy + 24);
    });
    cy += rowH;
  });

  // Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, cy - y);
  return cy;
}


