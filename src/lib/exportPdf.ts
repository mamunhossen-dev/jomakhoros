import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction } from '@/hooks/useTransactions';
import type { Wallet } from '@/hooks/useWallets';
import { format } from 'date-fns';
import { registerBengaliFont } from './pdfFont';

const BN_FONT = 'NotoBengali';
const EN_FONT = 'helvetica';
const BN_REGEX = /[\u0980-\u09FF]/;

export async function buildTransactionsPdf(
  transactions: Transaction[],
  userName: string,
  userEmail: string,
  filters?: { dateFrom?: string; dateTo?: string },
  wallets?: Wallet[]
): Promise<jsPDF> {
  const doc = new jsPDF();
  // Register Bengali font (used only for description cells that contain Bengali)
  await registerBengaliFont(doc);
  doc.setFont(EN_FONT, 'normal');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(30, 41, 59);
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

  const fromLabel = filters?.dateFrom || 'All';
  const toLabel = filters?.dateTo || 'All';
  doc.text(`Period: ${fromLabel} to ${toLabel}`, 14, 47);

  doc.setFontSize(8);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth - 14, 47, { align: 'right' });

  // Summary
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

  // Wallet balances section
  let tableStartY = summaryY + 24;
  if (wallets && wallets.length > 0) {
    const walletsTop = summaryY + 22;
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Wallet Balances', 14, walletsTop + 4);

    const walletRows = wallets.map(w => [
      w.name,
      (w.wallet_type || '').toUpperCase(),
      `TK ${Number(w.balance).toFixed(2)}`,
    ]);
    const totalWallet = wallets.reduce((s, w) => s + Number(w.balance), 0);
    walletRows.push(['Total', '', `TK ${totalWallet.toFixed(2)}`]);

    autoTable(doc, {
      startY: walletsTop + 7,
      head: [['Wallet', 'Type', 'Balance']],
      body: walletRows,
      headStyles: { fillColor: [30, 41, 59], fontSize: 8, halign: 'left' },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        2: { halign: 'right', cellWidth: 40 },
      },
      didParseCell(data) {
        // Apply Bengali font only for cells containing Bengali characters (e.g., wallet names)
        const raw = String(data.cell.raw ?? '');
        if (BN_REGEX.test(raw)) {
          data.cell.styles.font = BN_FONT;
        }
        if (data.section === 'body' && data.row.index === walletRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 253, 244];
          data.cell.styles.textColor = [22, 101, 52];
        }
        if (data.section === 'body' && data.column.index === 2 && data.row.index < walletRows.length - 1) {
          const val = Number(wallets[data.row.index].balance);
          data.cell.styles.textColor = val >= 0 ? [22, 163, 74] : [220, 38, 38];
        }
      },
      margin: { left: 14, right: 14 },
    });
    tableStartY = (doc as any).lastAutoTable.finalY + 8;
  }

  autoTable(doc, {
    startY: tableStartY,
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
      // Bengali font only for description / category cells with Bengali text
      if (data.section === 'body' && (data.column.index === 1 || data.column.index === 2)) {
        const raw = String(data.cell.raw ?? '');
        if (BN_REGEX.test(raw)) {
          data.cell.styles.font = BN_FONT;
        }
      }
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
    doc.setFont(EN_FONT, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    doc.text('JomaKhoros.com - Your Personal Finance Manager', 14, doc.internal.pageSize.getHeight() - 8);
  }

  return doc;
}

export async function exportTransactionsPdf(
  transactions: Transaction[],
  userName: string,
  userEmail: string,
  filters?: { dateFrom?: string; dateTo?: string },
  wallets?: Wallet[]
) {
  const doc = await buildTransactionsPdf(transactions, userName, userEmail, filters, wallets);
  doc.save(`JomaKhoros_Statement_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export async function exportTransactionsImage(
  transactions: Transaction[],
  userName: string,
  userEmail: string,
  filters?: { dateFrom?: string; dateTo?: string },
  wallets?: Wallet[]
) {
  // Direct canvas render — fast, no pdfjs/worker. Bengali rendered natively by browser fonts.
  const W = 1240;
  const PAD = 40;
  const contentW = W - PAD * 2;
  const ROW_H = 34;

  let totalIncome = 0, totalExpense = 0;
  transactions.forEach(tx => {
    if (tx.type === 'income') totalIncome += Number(tx.amount);
    else if (tx.type === 'expense') totalExpense += Number(tx.amount);
  });
  const balance = totalIncome - totalExpense;

  const walletCount = wallets?.length || 0;
  const walletBlock = walletCount ? 50 + (walletCount + 1 + 1) * ROW_H + 20 : 0;
  const txBlock = 50 + (transactions.length + 1) * ROW_H + 20;
  const H = 200 + 110 + walletBlock + txBlock + 50;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, W, 180);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Helvetica, Arial, sans-serif';
  ctx.fillText('JomaKhoros.com', PAD, 60);
  ctx.font = '16px Helvetica, Arial, sans-serif';
  ctx.fillText('Transaction Statement', PAD, 88);
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

  // Summary cards
  const cards = [
    { label: 'Total Income', value: `TK ${totalIncome.toFixed(2)}`, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Total Expense', value: `TK ${totalExpense.toFixed(2)}`, color: '#dc2626', bg: '#fef2f2' },
    { label: 'Balance', value: `TK ${balance.toFixed(2)}`, color: balance >= 0 ? '#16a34a' : '#dc2626', bg: '#eff6ff' },
  ];
  const cardGap = 16;
  const cardW = (contentW - cardGap * 2) / 3;
  const cardY = 210;
  cards.forEach((c, i) => {
    const x = PAD + i * (cardW + cardGap);
    ctx.fillStyle = c.bg;
    roundRect(ctx, x, cardY, cardW, 80, 8);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.font = '13px Helvetica, Arial, sans-serif';
    ctx.fillText(c.label, x + 14, cardY + 26);
    ctx.fillStyle = c.color;
    ctx.font = 'bold 22px Helvetica, Arial, sans-serif';
    ctx.fillText(c.value, x + 14, cardY + 60);
  });

  let y = cardY + 110;

  // Wallet balances
  if (wallets && wallets.length) {
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
    ctx.fillText('Wallet Balances', PAD, y);
    y += 14;
    const totalWallet = wallets.reduce((s, w) => s + Number(w.balance), 0);
    const rows: string[][] = wallets.map(w => [
      w.name,
      (w.wallet_type || '').toUpperCase(),
      `TK ${Number(w.balance).toFixed(2)}`,
    ]);
    rows.push(['Total', '', `TK ${totalWallet.toFixed(2)}`]);
    y = drawTable(ctx, PAD, y, contentW, ['Wallet', 'Type', 'Balance'], rows, [0.5, 0.25, 0.25]);
    y += 30;
  }

  // Transactions table
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
  ctx.fillText('Transactions', PAD, y);
  y += 14;
  const txRows = transactions.map(tx => {
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
  drawTable(ctx, PAD, y, contentW, ['Date', 'Description', 'Category / Wallets', 'Type', 'Amount'], txRows, [0.14, 0.32, 0.26, 0.12, 0.16]);

  // Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Helvetica, Arial, sans-serif';
  ctx.fillText('JomaKhoros.com - Your Personal Finance Manager', PAD, H - 20);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JomaKhoros_Statement_${format(new Date(), 'yyyy-MM-dd')}.png`;
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
  widths?: number[],
): number {
  const rowH = 34;
  const cols = headers.length;
  const colW = widths ? widths.map(p => p * w) : Array(cols).fill(w / cols);
  const colX: number[] = [];
  let acc = x;
  for (let i = 0; i < cols; i++) { colX.push(acc); acc += colW[i]; }

  // Header
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y, w, rowH);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Helvetica, Arial, sans-serif';
  headers.forEach((h, i) => {
    ctx.fillText(h, colX[i] + 10, y + 22);
  });
  let cy = y + rowH;

  ctx.font = '12px "Noto Sans Bengali", Helvetica, Arial, sans-serif';
  rows.forEach((row, ri) => {
    if (ri % 2 === 0) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x, cy, w, rowH);
    }
    ctx.fillStyle = '#0f172a';
    row.forEach((cell, ci) => {
      const text = clipText(ctx, String(cell), colW[ci] - 16);
      ctx.fillText(text, colX[ci] + 10, cy + 22);
    });
    cy += rowH;
  });

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, cy - y);
  return cy;
}

function clipText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(text.slice(0, mid) + '…').width <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + '…';
}

