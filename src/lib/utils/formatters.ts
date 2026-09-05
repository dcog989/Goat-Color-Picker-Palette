import { colordx, getFormat } from "@colordx/core";

export type ExportFormat = "hex" | "rgb" | "hsl" | "oklch";

export function safeColor(str: string) {
  if (getFormat(str) !== undefined) {
    try {
      return colordx(str);
    } catch {
      return null;
    }
  }
  return null;
}

export function formatColor(color: string, format: ExportFormat): string {
  const parsed = safeColor(color);
  if (!parsed) return color;

  switch (format) {
    case "hex":
      return parsed.toHex();
    case "rgb":
      return parsed.toRgbString();
    case "hsl":
      return parsed.toHslString();
    case "oklch":
      return parsed.toOklchString();
    default:
      return color;
  }
}
