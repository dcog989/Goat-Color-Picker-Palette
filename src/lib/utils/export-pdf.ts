import type { RootStore } from '../stores/root.svelte';
import { safeColor } from './formatters';
import { generateFilename, getColorSource } from './strategies';

// biome-ignore lint/suspicious/noExplicitAny: jsPDF type is dynamic
let jsPDFModule: any = null;
async function getJsPDF() {
  if (!jsPDFModule) {
    jsPDFModule = await import('jspdf');
  }
  return jsPDFModule.jsPDF;
}

export async function exportPdf(root: RootStore): Promise<void> {
  const source = getColorSource(root);
  const colors = source.colors;

  const jsPDF = await getJsPDF();

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('GOAT COLOR PALETTE', margin, 30);

  const cols = 4;
  const gap = 5;
  const swatchWidth = (contentWidth - (cols - 1) * gap) / cols;
  const swatchHeight = swatchWidth;

  let x = margin;
  let y = 45;

  colors.forEach((item, i) => {
    if (y + swatchHeight + 20 > 280) {
      doc.addPage();
      y = 30;
    }

    const parsed = safeColor(item.css);
    if (parsed) {
      const hex = parsed.toHex();

      doc.setFillColor(hex);
      doc.rect(x, y, swatchWidth, swatchHeight, 'F');

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont('courier', 'bold');
      doc.text(hex.toUpperCase(), x, y + swatchHeight + 5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(parsed.toOklchString(), x, y + swatchHeight + 10);
    }

    if ((i + 1) % cols === 0) {
      x = margin;
      y += swatchHeight + 25;
    } else {
      x += swatchWidth + gap;
    }
  });

  doc.save(generateFilename(root, 'pdf'));
}
