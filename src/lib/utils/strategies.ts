import type { RootStore } from "../stores/root.svelte";
import { type ExportFormat, formatColor, safeColor } from "./formatters";

export interface ColorSource {
  colors: Array<{ css: string }>;
  isSingle: boolean;
  name: string;
}

const PENDING_COLOR_NAME = "Searching...";

const resolveClosestName = (closestName: string, hex: string): string => {
  const trimmed = closestName.trim();
  return trimmed && trimmed !== PENDING_COLOR_NAME ? trimmed : hex;
};

export function getColorSource(root: RootStore): ColorSource {
  const hasColors = root.paintbox.items.length > 0;
  return {
    colors: hasColors ? root.paintbox.items : [{ css: root.color.hexa }],
    isSingle: !hasColors,
    name: resolveClosestName(root.engine.closestName, root.color.hex),
  };
}

export function generateColorName(index: number, source: ColorSource): string {
  const fallback = `color-${index + 1}`;
  if (!source.isSingle) return fallback;
  const slug = source.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return slug || fallback;
}

export function generateFilename(root: RootStore, extension: string): string {
  const name = resolveClosestName(root.engine.closestName, root.color.hex);
  const safeName = name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
  return `Color-Picker-Palette-${safeName}.${extension}`;
}

export function downloadFile(content: string | Blob, filename: string, mimeType?: string): void {
  const blob = typeof content === "string" ? new Blob([content], { type: mimeType || "text/plain" }) : content;
  const link = document.createElement("a");
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 100);
}

interface ExportStrategy {
  name: string;
  extension?: string;
  mimeType?: string;
  format(source: ColorSource, exportFormat: ExportFormat): string;
}

export interface VisualExportStrategy {
  name: string;
  extension: string;
  mimeType: string;
  render(source: ColorSource, root: RootStore): Blob | Promise<Blob>;
}

class CssExportStrategy implements ExportStrategy {
  name = "CSS Variables";
  format(source: ColorSource, exportFormat: ExportFormat): string {
    const lines: string[] = [":root {"];
    source.colors.forEach((item, i) => {
      const name = generateColorName(i, source);
      lines.push(`  --${name}: ${formatColor(item.css, exportFormat)};`);
    });
    lines.push("}");
    return lines.join("\n");
  }
}

class TailwindExportStrategy implements ExportStrategy {
  name = "Tailwind Config";
  format(source: ColorSource, exportFormat: ExportFormat): string {
    const lines = ["theme: {", "  extend: {", "    colors: {"];
    source.colors.forEach((item, i) => {
      const name = generateColorName(i, source);
      lines.push(`      '${name}': '${formatColor(item.css, exportFormat)}',`);
    });
    lines.push("    }", "  }", "}");
    return lines.join("\n");
  }
}

class AndroidXmlExportStrategy implements ExportStrategy {
  name = "Android XML";
  format(source: ColorSource, _exportFormat: ExportFormat): string {
    const lines = ['<?xml version="1.0" encoding="utf-8"?>', "<resources>"];
    source.colors.forEach((item, i) => {
      const name = generateColorName(i, source).replace(/-/g, "_");
      const parsed = safeColor(item.css);
      const hex = (parsed ? parsed.toHex() : "#000000").toUpperCase();
      const androidHex = hex.length === 9 ? `#${hex.slice(7, 9)}${hex.slice(1, 7)}` : hex;
      lines.push(`  <color name="${name}">${androidHex}</color>`);
    });
    lines.push("</resources>");
    return lines.join("\n");
  }
}

class JsonExportStrategy implements ExportStrategy {
  name = "JSON";
  format(source: ColorSource, exportFormat: ExportFormat): string {
    const obj: Record<string, string> = {};
    source.colors.forEach((item, i) => {
      obj[generateColorName(i, source)] = formatColor(item.css, exportFormat);
    });
    return JSON.stringify(obj, null, 2);
  }
}

class ScssExportStrategy implements ExportStrategy {
  name = "SCSS Variables";
  format(source: ColorSource, exportFormat: ExportFormat): string {
    const lines = ["// Color Variables"];
    source.colors.forEach((item, i) => {
      lines.push(`$${generateColorName(i, source)}: ${formatColor(item.css, exportFormat)};`);
    });
    return lines.join("\n");
  }
}

interface DtcgColorValue {
  colorSpace: "srgb" | "hsl" | "oklch";
  components: number[];
  hex: string;
  alpha?: number;
}

const round = (value: number, decimals: number): number => Number(value.toFixed(decimals));

const toDtcgValue = (css: string, exportFormat: ExportFormat): DtcgColorValue => {
  const parsed = safeColor(css);
  if (!parsed) return { colorSpace: "srgb", components: [0, 0, 0], hex: "#000000" };

  const alpha = round(parsed.alpha(), 3);
  const hex = parsed.toHex().slice(0, 7);

  if (exportFormat === "hsl") {
    const { h, s, l } = parsed.toHsl();
    return { colorSpace: "hsl", components: [round(h, 2), round(s, 2), round(l, 2)], hex, alpha };
  }
  if (exportFormat === "oklch") {
    const { l, c, h } = parsed.toOklch();
    return { colorSpace: "oklch", components: [round(l, 4), round(c, 4), round(h, 2)], hex, alpha };
  }
  const { r, g, b } = parsed.toRgb();
  return {
    colorSpace: "srgb",
    components: [round(r / 255, 4), round(g / 255, 4), round(b / 255, 4)],
    hex,
    alpha,
  };
};

class DtcgExportStrategy implements ExportStrategy {
  name = "DTCG Design Tokens";
  extension = "json";
  mimeType = "application/json";
  format(source: ColorSource, exportFormat: ExportFormat): string {
    const color: Record<string, { $type: "color"; $value: DtcgColorValue }> = {};
    source.colors.forEach((item, i) => {
      color[generateColorName(i, source)] = { $type: "color", $value: toDtcgValue(item.css, exportFormat) };
    });
    return JSON.stringify({ color }, null, 2);
  }
}

class GplExportStrategy implements ExportStrategy {
  name = "GIMP Palette";
  extension = "gpl";
  mimeType = "text/plain";
  format(source: ColorSource): string {
    const lines = ["GIMP Palette", "Name: Color Picker Palette", "Columns: 0", "#"];
    source.colors.forEach((item, i) => {
      const parsed = safeColor(item.css);
      const { r, g, b } = parsed ? parsed.toRgb() : { r: 0, g: 0, b: 0 };
      const name = generateColorName(i, source);
      lines.push(`${String(r).padStart(3, " ")} ${String(g).padStart(3, " ")} ${String(b).padStart(3, " ")}\t${name}`);
    });
    return lines.join("\n");
  }
}

export type ExportStrategyName = "css" | "tailwind" | "xml" | "json" | "scss" | "dtcg" | "gpl";

export const strategies: Record<ExportStrategyName, ExportStrategy> = {
  css: new CssExportStrategy(),
  tailwind: new TailwindExportStrategy(),
  xml: new AndroidXmlExportStrategy(),
  json: new JsonExportStrategy(),
  scss: new ScssExportStrategy(),
  dtcg: new DtcgExportStrategy(),
  gpl: new GplExportStrategy(),
};

export function exportCode(root: RootStore, strategyName: string, format: ExportFormat = "oklch"): string {
  const strategy = strategies[strategyName as ExportStrategyName];
  if (!strategy) throw new Error(`Unknown export strategy: ${strategyName}`);
  return strategy.format(getColorSource(root), format);
}

export function exportCodeFile(root: RootStore, strategyName: string, format: ExportFormat = "oklch"): void {
  const strategy = strategies[strategyName as ExportStrategyName];
  if (!strategy) throw new Error(`Unknown export strategy: ${strategyName}`);
  if (!strategy.extension) throw new Error(`Export strategy has no file format: ${strategyName}`);
  downloadFile(
    strategy.format(getColorSource(root), format),
    generateFilename(root, strategy.extension),
    strategy.mimeType,
  );
}

export async function exportVisual(root: RootStore, strategyName: string): Promise<void> {
  const { visualStrategies } = await import("./visual-strategies");
  const strategy = visualStrategies[strategyName];
  if (!strategy) throw new Error(`Unknown visual export strategy: ${strategyName}`);
  const source = getColorSource(root);
  const blob = await strategy.render(source, root);
  downloadFile(blob, generateFilename(root, strategy.extension), strategy.mimeType);
}
