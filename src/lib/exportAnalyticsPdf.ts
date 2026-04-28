import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

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

export function exportAnalyticsPdf(
  data: AnalyticsExportData,
  userName: string,
  userEmail: string,
  filters?: { dateFrom?: string; dateTo?: string }
) {
  const doc = new jsPDF();
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
    headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
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
    headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
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
    doc.setTextColor(60);
    data.insights.forEach((ins) => {
      const lines = doc.splitTextToSize(`- ${ins}`, pageWidth - 28);
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

  doc.save(`JomaKhoros_Analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
