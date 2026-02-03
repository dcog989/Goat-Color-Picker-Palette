import { converter, formatHex, formatHsl, formatRgb, parse, type Oklch } from 'culori/fn';
import { jsPDF } from 'jspdf';
import { EXPORT } from '../constants';
import type { RootStore } from '../stores/root.svelte';
import { formatOklch } from './format';

export type ExportFormat = 'hex' | 'rgb' | 'hsl' | 'oklch';

const toOklch = converter<Oklch>('oklch');

// ============================================================================
// Color Formatting
// ============================================================================

export function formatColor(color: string, format: ExportFormat): string {
    const parsed = parse(color);
    if (!parsed) return color;

    switch (format) {
        case 'hex':
            return formatHex(parsed) ?? color;
        case 'rgb':
            return formatRgb(parsed) ?? color;
        case 'hsl':
            return formatHsl(parsed) ?? color;
        case 'oklch': {
            const oklch = toOklch(parsed);
            return oklch ? formatOklch(oklch.l, oklch.c, oklch.h || 0, oklch.alpha) : color;
        }
        default:
            return color;
    }
}

// ============================================================================
// Strategy Logic
// ============================================================================

interface ColorSource {
    colors: Array<{ css: string }>;
    isSingle: boolean;
    name: string;
}

function getColorSource(root: RootStore): ColorSource {
    const hasColors = root.paintbox.items.length > 0;
    // When multiple colors, use sort order from paintbox
    return {
        colors: hasColors ? root.paintbox.items : [{ css: root.color.hex }],
        isSingle: !hasColors,
        name: root.engine.closestName,
    };
}

function generateColorName(index: number, source: ColorSource): string {
    if (source.isSingle) {
        return source.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }
    return `color-${index + 1}`;
}

interface ExportStrategy {
    name: string;
    format(source: ColorSource, exportFormat: ExportFormat): string;
}

class CssExportStrategy implements ExportStrategy {
    name = 'CSS Variables';
    format(source: ColorSource, exportFormat: ExportFormat): string {
        const lines: string[] = [':root {'];
        source.colors.forEach((item, i) => {
            const name = source.isSingle ? 'color-primary' : `color-${i + 1}`;
            lines.push(`  --${name}: ${formatColor(item.css, exportFormat)};`);
        });
        lines.push('}');
        return lines.join('\n');
    }
}

class TailwindExportStrategy implements ExportStrategy {
    name = 'Tailwind Config';
    format(source: ColorSource, exportFormat: ExportFormat): string {
        const lines = ['theme: {', '  extend: {', '    colors: {'];
        source.colors.forEach((item, i) => {
            const name = generateColorName(i, source);
            lines.push(`      '${name}': '${formatColor(item.css, exportFormat)}',`);
        });
        lines.push('    }', '  }', '}');
        return lines.join('\n');
    }
}

class AndroidXmlExportStrategy implements ExportStrategy {
    name = 'Android XML';
    format(source: ColorSource, exportFormat: ExportFormat): string {
        const lines = ['<?xml version="1.0" encoding="utf-8"?>', '<resources>'];
        source.colors.forEach((item, i) => {
            const name = generateColorName(i, source).replace(/-/g, '_');
            const useFormat = exportFormat === 'rgb' ? 'hex' : exportFormat;
            lines.push(
                `  <color name="${name}">${formatColor(item.css, useFormat).toUpperCase()}</color>`,
            );
        });
        lines.push('</resources>');
        return lines.join('\n');
    }
}

class JsonExportStrategy implements ExportStrategy {
    name = 'JSON';
    format(source: ColorSource, exportFormat: ExportFormat): string {
        const obj: Record<string, string> = {};
        source.colors.forEach((item, i) => {
            obj[generateColorName(i, source)] = formatColor(item.css, exportFormat);
        });
        return JSON.stringify(obj, null, 2);
    }
}

class ScssExportStrategy implements ExportStrategy {
    name = 'SCSS Variables';
    format(source: ColorSource, exportFormat: ExportFormat): string {
        const lines = ['// Color Variables'];
        source.colors.forEach((item, i) => {
            lines.push(`$${generateColorName(i, source)}: ${formatColor(item.css, exportFormat)};`);
        });
        return lines.join('\n');
    }
}

export const strategies: Record<string, ExportStrategy> = {
    css: new CssExportStrategy(),
    tailwind: new TailwindExportStrategy(),
    xml: new AndroidXmlExportStrategy(),
    json: new JsonExportStrategy(),
    scss: new ScssExportStrategy(),
};

export function exportCode(
    root: RootStore,
    strategyName: string,
    format: ExportFormat = 'oklch',
): string {
    const strategy = strategies[strategyName];
    if (!strategy) throw new Error(`Unknown export strategy: ${strategyName}`);
    return strategy.format(getColorSource(root), format);
}

// ============================================================================
// Image Export Helpers
// ============================================================================

function generateFilename(root: RootStore, extension: string): string {
    const safeName = root.engine.closestName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    return `GoatColor-${safeName}.${extension}`;
}

function downloadFile(content: string | Blob, filename: string, mimeType?: string): void {
    const blob =
        typeof content === 'string'
            ? new Blob([content], { type: mimeType || 'text/plain' })
            : content;
    const link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
}

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
        // Single color export (existing behavior)
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
        // Multiple colors from paintbox - create a palette grid
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

                // Add color text if space allows
                if (swatchHeight > 80) {
                    const parsed = parse(item.css);
                    if (parsed) {
                        const oklch = toOklch(parsed);
                        const textColor = oklch && oklch.l > 0.5 ? '#000000' : '#ffffff';
                        ctx.fillStyle = textColor;
                        ctx.font = `bold ${Math.min(swatchHeight / 4, 32)}px ui-monospace, monospace`;
                        ctx.textAlign = 'center';
                        ctx.fillText(
                            formatHex(parsed)?.toUpperCase() ?? '',
                            x + swatchWidth / 2,
                            y + swatchHeight / 2 + 8,
                        );
                    }
                }
            }
        });

        // Add title at bottom
        const titleHeight = 60;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, EXPORT.PNG_HEIGHT - titleHeight, EXPORT.PNG_WIDTH, titleHeight);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
            'GOAT COLOR PALETTE',
            EXPORT.PNG_WIDTH / 2,
            EXPORT.PNG_HEIGHT - titleHeight / 2 + 10,
        );
        ctx.textAlign = 'left';
    }

    canvas.toBlob((blob) => {
        if (blob) downloadFile(blob, generateFilename(root, 'png'));
    }, 'image/png');
}

export function exportSvg(root: RootStore): void {
    const source = getColorSource(root);
    const colors = source.colors;
    const isSingle = source.isSingle;

    let svg: string;

    if (isSingle) {
        // Single color export (existing behavior)
        const textFill = root.color.l > 0.5 ? '#000000' : '#ffffff';
        svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${EXPORT.SVG_SIZE}" height="${EXPORT.SVG_SIZE}" viewBox="0 0 ${EXPORT.SVG_SIZE} ${EXPORT.SVG_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${EXPORT.SVG_SIZE}" height="${EXPORT.SVG_SIZE}" fill="${root.color.hex}" />
  <text x="20" y="40" font-family="sans-serif" font-weight="bold" font-size="24" fill="${textFill}">${root.engine.closestName.toUpperCase()}</text>
  <text x="20" y="70" font-family="monospace" font-size="14" fill="${textFill}">${root.color.display}</text>
  ${root.color.alpha < 1 ? `<text x="20" y="90" font-family="monospace" font-size="12" fill="${textFill}">Alpha: ${(root.color.alpha * 100).toFixed(0)}%</text>` : ''}
</svg>`;
    } else {
        // Multiple colors from paintbox - create a palette
        const cols = Math.min(colors.length, 6);
        const rows = Math.ceil(colors.length / cols);
        const swatchWidth = EXPORT.SVG_SIZE / cols;
        const swatchHeight = (EXPORT.SVG_SIZE - 50) / rows; // Reserve 50px for title

        const swatches = colors
            .map((item, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = col * swatchWidth;
                const y = row * swatchHeight;

                const parsed = parse(item.css);
                const hexColor = (parsed ? formatHex(parsed) : item.css) ?? item.css;

                let colorText = '';
                if (swatchHeight > 50) {
                    const oklch = parsed ? toOklch(parsed) : null;
                    const textColor = oklch && oklch.l > 0.5 ? '#000000' : '#ffffff';
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

export function exportPdf(root: RootStore): void {
    const source = getColorSource(root);
    const colors = source.colors;

    // A4 Portrait
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('GOAT COLOR PALETTE', margin, 30);

    // Grid Layout
    const cols = 4;
    const gap = 5;
    const swatchWidth = (contentWidth - (cols - 1) * gap) / cols;
    const swatchHeight = swatchWidth; // Square swatches

    let x = margin;
    let y = 45;

    colors.forEach((item, i) => {
        // New page check
        if (y + swatchHeight + 20 > 280) {
            doc.addPage();
            y = 30;
        }

        const parsed = parse(item.css);
        if (parsed) {
            const hex = formatHex(parsed) || '#000000';
            const oklch = toOklch(parsed);

            // Draw Swatch
            doc.setFillColor(hex);
            doc.rect(x, y, swatchWidth, swatchHeight, 'F');

            // Draw Info
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont('courier', 'bold');
            doc.text(hex.toUpperCase(), x, y + swatchHeight + 5);

            if (oklch) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100);
                doc.text(
                    formatOklch(oklch.l, oklch.c, oklch.h || 0, oklch.alpha),
                    x,
                    y + swatchHeight + 10,
                );
            }
        }

        // Advance Grid
        if ((i + 1) % cols === 0) {
            x = margin;
            y += swatchHeight + 25;
        } else {
            x += swatchWidth + gap;
        }
    });

    doc.save(generateFilename(root, 'pdf'));
}
