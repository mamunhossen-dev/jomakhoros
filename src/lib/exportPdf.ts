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
  const doc = await buildTransactionsPdf(transactions, userName, userEmail, filters, wallets);
  const pdfBlob = doc.output('blob');
  const arrayBuffer = await pdfBlob.arrayBuffer();

  const pdfjs: any = await import('pdfjs-dist');
  // @ts-ignore - vite url import
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const scale = 2;

  const canvases: HTMLCanvasElement[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    canvases.push(canvas);
  }

  const width = canvases[0].width;
  const totalHeight = canvases.reduce((s, c) => s + c.height, 0);
  const out = document.createElement('canvas');
  out.width = width;
  out.height = totalHeight;
  const octx = out.getContext('2d')!;
  octx.fillStyle = '#ffffff';
  octx.fillRect(0, 0, width, totalHeight);
  let y = 0;
  for (const c of canvases) {
    octx.drawImage(c, 0, y);
    y += c.height;
  }

  const dataUrl = out.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `JomaKhoros_Statement_${format(new Date(), 'yyyy-MM-dd')}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
