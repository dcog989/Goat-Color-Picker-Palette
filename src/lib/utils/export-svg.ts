import { EXPORT } from '../constants';
import type { RootStore } from '../stores/root.svelte';
import { safeColor } from './formatters';
import { downloadFile, generateFilename, getColorSource } from './strategies';

export function exportSvg(root: RootStore): void {
  const source = getColorSource(root);
  const colors = source.colors;
  const isSingle = source.isSingle;

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

  downloadFile(svg.trim(), generateFilename(root, 'svg'), 'image/svg+xml');
}
