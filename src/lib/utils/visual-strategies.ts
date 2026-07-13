import { EXPORT } from '../constants';
import type { RootStore } from '../stores/root.svelte';
import { safeColor } from './formatters';
import type { ColorSource, VisualExportStrategy } from './strategies';

class PngExportStrategy implements VisualExportStrategy {
  name = 'PNG';
  extension = 'png';
  mimeType = 'image/png';

  async render(source: ColorSource, root: RootStore): Promise<Blob> {
    const { colors, isSingle } = source;
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT.PNG_WIDTH;
    canvas.height = EXPORT.PNG_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas 2d context');

    ctx.textAlign = 'left';

    if (isSingle) {
      ctx.fillStyle = colors[0]?.css ?? root.color.hex;
      ctx.fillRect(0, 0, EXPORT.PNG_WIDTH, EXPORT.PNG_HEIGHT);

      const textColor = root.color.l > 0.5 ? '#000000' : '#ffffff';
      ctx.fillStyle = textColor;
      ctx.font = 'bold 80px system-ui, -apple-system, sans-serif';
      ctx.fillText(root.engine.closestName.toUpperCase(), 60, 150);
      ctx.font = '40px ui-monospace, monospace';
      ctx.fillText(root.color.display, 60, 230);
      ctx.fillText(`HEX: ${root.color.hex.toUpperCase()}`, 60, 290);
      ctx.fillText(`RGB: ${root.color.rgb}`, 60, 350);
      if (root.color.alpha < 1) {
        ctx.fillText(`Alpha: ${(root.color.alpha * 100).toFixed(0)}%`, 60, 410);
      }
    } else {
      const cols = Math.min(colors.length, 6);
      const rows = Math.ceil(colors.length / cols);
      const swatchWidth = EXPORT.PNG_WIDTH / cols;
      const swatchHeight = EXPORT.PNG_HEIGHT / rows;

      colors.forEach((item, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * swatchWidth;
        const y = row * swatchHeight;
        if (item) {
          ctx.fillStyle = item.css;
          ctx.fillRect(x, y, swatchWidth, swatchHeight);
          if (swatchHeight > 80) {
            const parsed = safeColor(item.css);
            if (parsed) {
              const oklchVal = parsed.toOklch();
              const textColor = oklchVal.l > 0.5 ? '#000000' : '#ffffff';
              ctx.fillStyle = textColor;
              ctx.font = `bold ${Math.min(swatchHeight / 4, 32)}px ui-monospace, monospace`;
              ctx.textAlign = 'center';
              ctx.fillText(parsed.toHex().toUpperCase(), x + swatchWidth / 2, y + swatchHeight / 2 + 8);
            }
          }
        }
      });

      const titleHeight = 60;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, EXPORT.PNG_HEIGHT - titleHeight, EXPORT.PNG_WIDTH, titleHeight);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOAT COLOR PALETTE', EXPORT.PNG_WIDTH / 2, EXPORT.PNG_HEIGHT - titleHeight / 2 + 10);
      ctx.textAlign = 'left';
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create PNG blob'));
      }, 'image/png');
    });
  }
}

class SvgExportStrategy implements VisualExportStrategy {
  name = 'SVG';
  extension = 'svg';
  mimeType = 'image/svg+xml';

  render(source: ColorSource, root: RootStore): Blob {
    const { colors, isSingle } = source;
    let svg: string;

    if (isSingle) {
      const textFill = root.color.l > 0.5 ? '#000000' : '#ffffff';
      svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${EXPORT.SVG_SIZE}" height="${EXPORT.SVG_SIZE}" viewBox="0 0 ${EXPORT.SVG_SIZE} ${EXPORT.SVG_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${EXPORT.SVG_SIZE}" height="${EXPORT.SVG_SIZE}" fill="${root.color.hex}" />
  <text x="20" y="40" font-family="sans-serif" font-weight="bold" font-size="24" fill="${textFill}">${root.engine.closestName.toUpperCase()}</text>
  <text x="20" y="70" font-family="monospace" font-size="14" fill="${textFill}">${root.color.display}</text>
  ${root.color.alpha < 1 ? `<text x="20" y="90" font-family="monospace" font-size="12" fill="${textFill}">Alpha: ${(root.color.alpha * 100).toFixed(0)}%</text>` : ''}
</svg>`;
    } else {
      const cols = Math.min(colors.length, 6);
      const rows = Math.ceil(colors.length / cols);
      const swatchWidth = EXPORT.SVG_SIZE / cols;
      const swatchHeight = (EXPORT.SVG_SIZE - 50) / rows;

      const swatches = colors
        .map((item, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = col * swatchWidth;
          const y = row * swatchHeight;

          const parsed = safeColor(item.css);
          const hexColor = parsed ? parsed.toHex() : item.css;

          let colorText = '';
          if (swatchHeight > 50 && parsed) {
            const oklchVal = parsed.toOklch();
            const textColor = oklchVal.l > 0.5 ? '#000000' : '#ffffff';
            const fontSize = Math.min(swatchHeight / 5, 14);
            colorText = `<text x="${x + swatchWidth / 2}" y="${y + swatchHeight / 2 + fontSize / 3}" font-family="monospace" font-size="${fontSize}" font-weight="bold" fill="${textColor}" text-anchor="middle">${hexColor.toUpperCase()}</text>`;
          }

          return `  <rect x="${x}" y="${y}" width="${swatchWidth}" height="${swatchHeight}" fill="${hexColor}" />
${colorText}`;
        })
        .join('\n');

      const titleY = EXPORT.SVG_SIZE - 50;
      svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${EXPORT.SVG_SIZE}" height="${EXPORT.SVG_SIZE}" viewBox="0 0 ${EXPORT.SVG_SIZE} ${EXPORT.SVG_SIZE}" xmlns="http://www.w3.org/2000/svg">
${swatches}
  <rect x="0" y="${titleY}" width="${EXPORT.SVG_SIZE}" height="50" fill="rgba(0, 0, 0, 0.8)" />
  <text x="${EXPORT.SVG_SIZE / 2}" y="${titleY + 32}" font-family="sans-serif" font-weight="bold" font-size="18" fill="#ffffff" text-anchor="middle">GOAT COLOR PALETTE</text>
</svg>`;
    }

    return new Blob([svg.trim()], { type: this.mimeType });
  }
}

class PdfExportStrategy implements VisualExportStrategy {
  name = 'PDF';
  extension = 'pdf';
  mimeType = 'application/pdf';

  async render(source: ColorSource, _root: RootStore): Promise<Blob> {
    const { colors } = source;
    const { jsPDF } = await import('jspdf');

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

    return doc.output('blob');
  }
}

export const visualStrategies: Record<string, VisualExportStrategy> = {
  png: new PngExportStrategy(),
  svg: new SvgExportStrategy(),
  pdf: new PdfExportStrategy(),
};
