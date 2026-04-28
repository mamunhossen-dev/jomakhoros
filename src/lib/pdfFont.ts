import jsPDF from 'jspdf';
import bengaliFontUrl from '@/assets/fonts/NotoSansBengali-Regular.ttf?url';

let cachedBase64: string | null = null;

async function fetchFontBase64(): Promise<string> {
  if (cachedBase64) return cachedBase64;
  const res = await fetch(bengaliFontUrl);
  const buf = await res.arrayBuffer();
  // Convert ArrayBuffer to base64 in chunks to avoid call-stack issues.
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  cachedBase64 = btoa(binary);
  return cachedBase64;
}

/**
 * Registers Noto Sans Bengali in the given jsPDF document and sets it as default.
 * Call once after creating the doc, before any doc.text().
 */
export async function registerBengaliFont(doc: jsPDF) {
  const base64 = await fetchFontBase64();
  doc.addFileToVFS('NotoSansBengali-Regular.ttf', base64);
  doc.addFont('NotoSansBengali-Regular.ttf', 'NotoBengali', 'normal');
  // Use the same file as bold (font has no separate bold static here);
  // jsPDF will still apply it when 'bold' style is requested.
  doc.addFont('NotoSansBengali-Regular.ttf', 'NotoBengali', 'bold');
  doc.setFont('NotoBengali', 'normal');
}
