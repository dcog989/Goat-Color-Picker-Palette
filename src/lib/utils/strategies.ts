import type { RootStore } from '../stores/root.svelte';
import { type ExportFormat, formatColor, safeColor } from './formatters';

export interface ColorSource {
  colors: Array<{ css: string }>;
  isSingle: boolean;
  name: string;
}

export function getColorSource(root: RootStore): ColorSource {
  const hasColors = root.paintbox.items.length > 0;
  return {
    colors: hasColors ? root.paintbox.items : [{ css: root.color.hex }],
    isSingle: !hasColors,
    name: root.engine.closestName,
  };
}

export function generateColorName(index: number, source: ColorSource): string {
  if (source.isSingle) {
    return source.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  return `color-${index + 1}`;
}

export function generateFilename(root: RootStore, extension: string): string {
  const safeName = root.engine.closestName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  return `GoatColor-${safeName}.${extension}`;
}

export function downloadFile(content: string | Blob, filename: string, mimeType?: string): void {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType || 'text/plain' }) : content;
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 100);
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
      const name = generateColorName(i, source);
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
  format(source: ColorSource, _exportFormat: ExportFormat): string {
    const lines = ['<?xml version="1.0" encoding="utf-8"?>', '<resources>'];
    source.colors.forEach((item, i) => {
      const name = generateColorName(i, source).replace(/-/g, '_');
      const parsed = safeColor(item.css);
      const hex = (parsed ? parsed.toHex() : '#000000').toUpperCase();
      const androidHex = hex.length === 9 ? `#${hex.slice(7, 9)}${hex.slice(1, 7)}` : hex;
      lines.push(`  <color name="${name}">${androidHex}</color>`);
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

export function exportCode(root: RootStore, strategyName: string, format: ExportFormat = 'oklch'): string {
  const strategy = strategies[strategyName];
  if (!strategy) throw new Error(`Unknown export strategy: ${strategyName}`);
  return strategy.format(getColorSource(root), format);
}
