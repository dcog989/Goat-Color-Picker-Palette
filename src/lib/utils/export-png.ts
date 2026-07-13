import { EXPORT } from '../constants';
import type { RootStore } from '../stores/root.svelte';
import { safeColor } from './formatters';
import { downloadFile, generateFilename, getColorSource } from './strategies';

export function exportPng(root: RootStore): void {
  const source = getColorSource(root);
  const colors = source.colors;
  const isSingle = source.isSingle;

  const canvas = document.createElement('canvas');
  canvas.width = EXPORT.PNG_WIDTH;
  canvas.height = EXPORT.PNG_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

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

  canvas.toBlob((blob) => {
    if (blob) downloadFile(blob, generateFilename(root, 'png'));
  }, 'image/png');
}
