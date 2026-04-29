import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { registerBengaliFont } from './pdfFont';

const BN_FONT = 'NotoBengali';
const EN_FONT = 'helvetica';

export type ReceiptData = {
  receiptNumber: string;       // e.g. RCP-241015-A1B2
  paidOn: string;              // ISO date
  customerName: string;
  customerEmail: string;
  plan: string;                // e.g. ১ মাস / ৬ মাস / ১ বছর
  paymentMethod: string;       // bKash / Nagad / etc (label)
  transactionId: string;
  amount: number;
  brandName?: string;
  brandTagline?: string;
};

const drawBnText = (doc: jsPDF, text: string, x: number, y: number, opts?: { align?: 'left' | 'center' | 'right' }) => {
  doc.setFont(BN_FONT, 'normal');
  // jsPDF's built-in align option doesn't shape complex Bengali scripts correctly with custom TTF.
  // Compute width manually and shift x so the text renders without broken glyphs.
  const align = opts?.align ?? 'left';
  let drawX = x;
  if (align !== 'left') {
    const w = doc.getTextWidth(text);
    drawX = align === 'right' ? x - w : x - w / 2;
  }
  doc.text(text, drawX, y);
};

const drawEnText = (doc: jsPDF, text: string, x: number, y: number, opts?: { align?: 'left' | 'center' | 'right' }) => {
  doc.setFont(EN_FONT, 'normal');
  doc.text(text, x, y, opts);
};

export async function buildReceiptPdf(data: ReceiptData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await registerBengaliFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const brand = data.brandName || 'JomaKhoros';
  const tagline = data.brandTagline || 'ব্যক্তিগত আর্থিক ব্যবস্থাপনা';

  // Header bar
  doc.setFillColor(13, 150, 104); // primary teal
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  drawEnText(doc, brand, 14, 18);
  doc.setFontSize(10);
  drawBnText(doc, tagline, 14, 26);

  doc.setFontSize(14);
  drawEnText(doc, 'PAYMENT RECEIPT', pageWidth - 14, 18, { align: 'right' });
  doc.setFontSize(9);
  drawBnText(doc, 'পেমেন্ট রসিদ', pageWidth - 14, 26, { align: 'right' });

  // Receipt meta box
  doc.setTextColor(30, 41, 59);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, 48, pageWidth - 28, 26, 2, 2, 'F');

  doc.setFontSize(9);
  drawEnText(doc, 'Receipt No:', 20, 57);
  doc.setFontSize(11);
  drawEnText(doc, data.receiptNumber, 20, 64);

  doc.setFontSize(9);
  drawEnText(doc, 'Date:', pageWidth - 20, 57, { align: 'right' });
  doc.setFontSize(11);
  drawEnText(doc, format(new Date(data.paidOn), 'dd MMM yyyy, hh:mm a'), pageWidth - 20, 64, { align: 'right' });

  // Customer section
  let y = 88;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  drawEnText(doc, 'BILL TO', 14, y);
  y += 6;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  drawBnText(doc, data.customerName || 'N/A', 14, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  drawEnText(doc, data.customerEmail, 14, y);

  // Items table-like block
  y += 14;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(14, y, pageWidth - 14, y);

  y += 8;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  drawEnText(doc, 'DESCRIPTION', 14, y);
  drawEnText(doc, 'AMOUNT', pageWidth - 14, y, { align: 'right' });

  y += 8;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  drawBnText(doc, `${brand} প্রো প্ল্যান — ${data.plan}`, 14, y);
  drawEnText(doc, `BDT ${data.amount.toFixed(2)}`, pageWidth - 14, y, { align: 'right' });

  y += 4;
  doc.line(14, y, pageWidth - 14, y);

  // Total
  y += 10;
  doc.setFillColor(13, 150, 104);
  doc.roundedRect(pageWidth - 84, y - 6, 70, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  drawEnText(doc, 'TOTAL PAID', pageWidth - 80, y);
  doc.setFontSize(14);
  drawEnText(doc, `BDT ${data.amount.toFixed(2)}`, pageWidth - 18, y + 1, { align: 'right' });

  // Payment details
  y += 22;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  drawEnText(doc, 'PAYMENT DETAILS', 14, y);

  y += 7;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  drawEnText(doc, 'Method:', 14, y);
  drawBnText(doc, data.paymentMethod, 50, y);

  y += 6;
  drawEnText(doc, 'Transaction ID:', 14, y);
  drawBnText(doc, data.transactionId, 50, y);

  y += 6;
  drawEnText(doc, 'Status:', 14, y);
  doc.setTextColor(13, 150, 104);
  drawEnText(doc, 'APPROVED', 50, y);

  // Footer
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  drawBnText(
    doc,
    'এই রসিদটি স্বয়ংক্রিয়ভাবে তৈরি হয়েছে। কোনো প্রশ্ন থাকলে সাপোর্টে যোগাযোগ করুন।',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 14,
    { align: 'center' }
  );
  drawEnText(doc, `Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });

  return doc;
}

export async function downloadReceiptPdf(data: ReceiptData) {
  const doc = await buildReceiptPdf(data);
  doc.save(`receipt-${data.receiptNumber}.pdf`);
}

export const buildReceiptNumber = (paymentId: string, createdAt: string) => {
  const datePart = format(new Date(createdAt), 'yyMMdd');
  const shortId = paymentId.replace(/-/g, '').slice(0, 4).toUpperCase();
  return `RCP-${datePart}-${shortId}`;
};
