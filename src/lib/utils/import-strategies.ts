import { type AnyColor, colordx, extend } from "@colordx/core";
import a98rgb from "@colordx/core/plugins/a98rgb";
import hwb from "@colordx/core/plugins/hwb";
import lab from "@colordx/core/plugins/lab";
import lch from "@colordx/core/plugins/lch";
import p3 from "@colordx/core/plugins/p3";
import prophoto from "@colordx/core/plugins/prophoto";
import rec2020 from "@colordx/core/plugins/rec2020";
import srgbLinear from "@colordx/core/plugins/srgb-linear";

extend([hwb, lab, lch, p3, a98rgb, prophoto, rec2020, srgbLinear]);

export interface ImportStrategy {
  name: string;
  extensions: string[];
  parse(text: string): string[];
}

type DtcgComponent = number | "none";

type DtcgColorValue = {
  colorSpace: string;
  components: unknown[];
  alpha?: number;
  hex?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toCss = (css: string): string | null => {
  const parsed = colordx(css);
  if (!parsed.isValid()) return null;
  return parsed.alpha() < 1 ? parsed.toHex8() : parsed.toHex();
};

const component = (value: DtcgComponent): number => (typeof value === "number" ? value : 0);

const dtcgToInput = (colorSpace: string, components: DtcgComponent[], alpha: number): AnyColor | null => {
  const [c0 = 0, c1 = 0, c2 = 0] = components.map(component);

  switch (colorSpace) {
    case "srgb":
      return { r: c0 * 255, g: c1 * 255, b: c2 * 255, alpha };
    case "srgb-linear":
      return { r: c0, g: c1, b: c2, alpha, colorSpace: "srgb-linear" };
    case "hsl":
      return { h: c0, s: c1, l: c2, alpha };
    case "hwb":
      return { h: c0, w: c1, b: c2, alpha };
    case "lab":
      return { l: c0, a: c1, b: c2, alpha, colorSpace: "lab" };
    case "lch":
      return { l: c0, c: c1, h: c2, alpha, colorSpace: "lch" };
    case "oklab":
      return { l: c0, a: c1, b: c2, alpha };
    case "oklch":
      return { l: c0, c: c1, h: c2, alpha };
    case "display-p3":
      return { r: c0, g: c1, b: c2, alpha, colorSpace: "display-p3" };
    case "a98-rgb":
      return { r: c0, g: c1, b: c2, alpha, colorSpace: "a98-rgb" };
    case "prophoto-rgb":
      return { r: c0, g: c1, b: c2, alpha, colorSpace: "prophoto-rgb" };
    case "rec2020":
      return { r: c0, g: c1, b: c2, alpha, colorSpace: "rec2020" };
    default:
      return null;
  }
};

const isDtcgColorValue = (value: unknown): value is DtcgColorValue => {
  if (!isRecord(value)) return false;
  const candidate = value as { colorSpace?: unknown; components?: unknown };
  return typeof candidate.colorSpace === "string" && Array.isArray(candidate.components);
};

const dtcgValueToCss = (value: unknown): string | null => {
  if (typeof value === "string") {
    return toCss(value);
  }
  if (!isDtcgColorValue(value)) {
    return null;
  }

  const components: DtcgComponent[] = value.components.map((channel) =>
    typeof channel === "number" || channel === "none" ? channel : 0,
  );
  const alpha = typeof value.alpha === "number" ? value.alpha : 1;
  const input = dtcgToInput(value.colorSpace, components, alpha);
  if (input) {
    const parsed = colordx(input);
    if (parsed.isValid()) return parsed.alpha() < 1 ? parsed.toHex8() : parsed.toHex();
  }
  if (typeof value.hex === "string") {
    return toCss(value.hex);
  }
  return null;
};

const collectDtcgColors = (root: unknown, out: string[]): void => {
  const stack: unknown[] = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!isRecord(node)) continue;

    if ("$value" in node) {
      const token = node as { $value?: unknown };
      const css = dtcgValueToCss(token.$value);
      if (css) out.push(css);
      continue;
    }

    const keys = Object.keys(node);
    for (let i = keys.length - 1; i >= 0; i--) {
      const key = keys[i] as string;
      if (key.startsWith("$")) continue;
      stack.push(node[key]);
    }
  }
};

const parseDtcg = (text: string): string[] => {
  const data = JSON.parse(text);
  const colors: string[] = [];
  collectDtcgColors(data, colors);
  return colors;
};

const GPL_ROW = /^\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})(?:\s+.*)?$/;

const parseGpl = (text: string): string[] => {
  const colors: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const match = GPL_ROW.exec(line);
    if (!match) continue;
    const [r = 0, g = 0, b = 0] = match.slice(1, 4).map((channel) => Math.min(255, Number(channel)));
    const parsed = colordx({ r, g, b });
    if (parsed.isValid()) colors.push(parsed.toHex());
  }
  return colors;
};

export const importStrategies = {
  dtcg: { name: "DTCG Design Tokens", extensions: [".json"], parse: parseDtcg },
  gpl: { name: "GIMP Palette", extensions: [".gpl"], parse: parseGpl },
} satisfies Record<string, ImportStrategy>;

export function resolveImportStrategy(filename: string, text: string): ImportStrategy | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".gpl")) return importStrategies.gpl;
  if (lower.endsWith(".json")) return importStrategies.dtcg;
  if (/^\s*GIMP Palette/i.test(text)) return importStrategies.gpl;
  if (/^\s*[{[]/.test(text)) return importStrategies.dtcg;
  return null;
}

export function parsePaletteFile(filename: string, text: string): string[] {
  const strategy = resolveImportStrategy(filename, text);
  if (!strategy) {
    throw new Error("Unsupported palette file. Use a DTCG .json or GIMP .gpl file.");
  }

  let colors: string[];
  try {
    colors = strategy.parse(text);
  } catch {
    throw new Error(`Could not parse ${filename} as ${strategy.name}.`);
  }

  if (colors.length === 0) {
    throw new Error(`No colors found in ${filename}.`);
  }
  return colors;
}
