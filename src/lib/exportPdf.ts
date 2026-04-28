import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction } from '@/hooks/useTransactions';
import { format } from 'date-fns';

export function exportTransactionsPdf(
  transactions: Transaction[],
  userName: string,
  userEmail: string,
  filters?: { dateFrom?: string; dateTo?: string }
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(30, 41, 59); // sidebar dark color
  doc.rect(0, 0, pageWidth, 52, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('JomaKhoros.com', 14, 18);
  doc.setFontSize(9);
  doc.text('Transaction Statement', 14, 25);

  // User info
  doc.setFontSize(10);
  doc.text(`Name: ${userName || 'N/A'}`, 14, 35);
  doc.text(`Email: ${userEmail}`, 14, 41);

  // Date range
  const fromLabel = filters?.dateFrom || 'All';
  const toLabel = filters?.dateTo || 'All';
  doc.text(`Period: ${fromLabel} to ${toLabel}`, 14, 47);

  // Generated date
  doc.setFontSize(8);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth - 14, 47, { align: 'right' });

  // Summary (transfers excluded from income/expense totals)
  let totalIncome = 0, totalExpense = 0;
  transactions.forEach(tx => {
    if (tx.type === 'income') totalIncome += Number(tx.amount);
    else if (tx.type === 'expense') totalExpense += Number(tx.amount);
  });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const summaryY = 60;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, summaryY, 55, 18, 2, 2, 'F');
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(75, summaryY, 55, 18, 2, 2, 'F');
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(136, summaryY, 60, 18, 2, 2, 'F');

  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text('Total Income', 18, summaryY + 6);
  doc.text('Total Expense', 79, summaryY + 6);
  doc.text('Balance', 140, summaryY + 6);

  doc.setFontSize(11);
  doc.setTextColor(22, 163, 74);
  doc.text(`TK ${totalIncome.toFixed(2)}`, 18, summaryY + 14);
  doc.setTextColor(220, 38, 38);
  doc.text(`TK ${totalExpense.toFixed(2)}`, 79, summaryY + 14);
  const balance = totalIncome - totalExpense;
  doc.setTextColor(balance >= 0 ? 22 : 220, balance >= 0 ? 163 : 38, balance >= 0 ? 74 : 38);
  doc.text(`TK ${balance.toFixed(2)}`, 140, summaryY + 14);

  // Table
  const tableData = transactions.map(tx => {
    const typeLabel = tx.type === 'income' ? 'Income' : tx.type === 'expense' ? 'Expense' : 'Transfer';
    const amount = tx.type === 'income'
      ? `+ TK ${Number(tx.amount).toFixed(2)}`
      : tx.type === 'expense'
        ? `- TK ${Number(tx.amount).toFixed(2)}`
        : `TK ${Number(tx.amount).toFixed(2)}`;
    const category = tx.type === 'transfer'
      ? `${tx.wallet?.name || '?'} -> ${tx.to_wallet?.name || '?'}`
      : (tx.category?.name || 'Uncategorized');
    return [
      format(new Date(tx.date), 'dd MMM yyyy'),
      tx.description || '-',
      category,
      typeLabel,
      amount,
    ];
  });

  autoTable(doc, {
    startY: summaryY + 24,
    head: [['Date', 'Description', 'Category / Wallets', 'Type', 'Amount']],
    body: tableData,
    headStyles: { fillColor: [30, 41, 59], fontSize: 8, halign: 'left' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 28 },
      4: { halign: 'right', cellWidth: 38, overflow: 'visible' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 4) {
        const text = String(data.cell.raw);
        if (text.startsWith('+')) data.cell.styles.textColor = [22, 163, 74];
        else if (text.startsWith('-')) data.cell.styles.textColor = [220, 38, 38];
        else if (Array.isArray(data.row.raw) && data.row.raw[3] === 'Transfer') data.cell.styles.textColor = [37, 99, 235];
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    doc.text('JomaKhoros.com - Your Personal Finance Manager', 14, doc.internal.pageSize.getHeight() - 8);
  }

  doc.save(`JomaKhoros_Statement_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
