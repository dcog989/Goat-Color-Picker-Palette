import { colordx } from '@colordx/core';

export type PaletteAxis = 'l' | 'c' | 'h' | 'a';

export type HarmonyType = 'complementary' | 'split-complementary' | 'analogous' | 'triadic' | 'tetradic' | 'rectangle';

export type GenerationMode = HarmonyType | PaletteAxis;

const HARMONY_TYPES: Record<string, true> = {
  complementary: true,
  'split-complementary': true,
  analogous: true,
  triadic: true,
  tetradic: true,
  rectangle: true,
};

export function isHarmonyMode(mode: GenerationMode): mode is HarmonyType {
  return mode in HARMONY_TYPES;
}

export function generatePalette(
  baseColor: { l: number; c: number; h: number; alpha?: number },
  axis: PaletteAxis,
  steps: number,
): string[] {
  if (steps < 2) steps = 2;
  if (steps > 20) steps = 20;

  return Array.from({ length: steps }, (_, i) => {
    const fraction = i / (steps - 1);

    const l = axis === 'l' ? 0.08 + fraction * 0.89 : baseColor.l;
    const c = axis === 'c' ? 0.04 + fraction * Math.min(0.2, baseColor.c * 1.5) : baseColor.c;
    const h = axis === 'h' ? i * (360 / steps) : (baseColor.h ?? 0);
    const alpha = axis === 'a' ? fraction : (baseColor.alpha ?? 1);

    return colordx({ l, c, h, alpha }).toHex();
  });
}
