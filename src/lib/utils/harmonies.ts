import Color from 'colorjs.io';

export type HarmonyType =
    | 'complementary'
    | 'split-complementary'
    | 'analogous'
    | 'triadic'
    | 'tetradic'
    | 'square';

export type PaletteAxis = 'l' | 'c' | 'h' | 'a';

export type GenerationMode = HarmonyType | PaletteAxis;

interface HarmonyDefinition {
    name: string;
    angles: number[];
    description: string;
}

export const HARMONY_DEFINITIONS: Record<HarmonyType, HarmonyDefinition> = {
    complementary: {
        name: 'Complementary',
        angles: [180],
        description: 'Colors opposite on the color wheel',
    },
    'split-complementary': {
        name: 'Split Complementary',
        angles: [150, 210],
        description: 'Base color plus two colors adjacent to its complement',
    },
    analogous: {
        name: 'Analogous',
        angles: [-30, 30],
        description: 'Colors adjacent to each other on the color wheel',
    },
    triadic: {
        name: 'Triadic',
        angles: [120, 240],
        description: 'Three colors equally spaced around the color wheel',
    },
    tetradic: {
        name: 'Tetradic',
        angles: [60, 180, 240],
        description: 'Rectangular pattern with two complementary pairs',
    },
    square: {
        name: 'Square',
        angles: [90, 180, 270],
        description: 'Four colors equally spaced around the color wheel',
    },
} as const;

export function isHarmonyMode(mode: GenerationMode): mode is HarmonyType {
    return mode in HARMONY_DEFINITIONS;
}

export function rotateHue(
    color: { l: number; c: number; h: number; alpha?: number },
    angle: number,
): string {
    const currentHue = color.h ?? 0;
    const newHue = (currentHue + angle + 360) % 360;
    const c = new Color('oklch', [color.l, color.c, newHue], color.alpha ?? 1);
    return c.toString();
}

export function generateHarmony(
    baseColor: { l: number; c: number; h: number; alpha?: number },
    harmonyType: HarmonyType,
): string[] {
    const definition = HARMONY_DEFINITIONS[harmonyType];
    return definition.angles.map((angle) => rotateHue(baseColor, angle));
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

        const result = new Color('oklch', [l, c, h], alpha);
        return result.toString();
    });
}

export function generateColors(
    baseColor: { l: number; c: number; h: number; alpha?: number },
    mode: GenerationMode,
    steps: number = 8,
): string[] {
    if (isHarmonyMode(mode)) {
        return generateHarmony(baseColor, mode);
    }

    return generatePalette(baseColor, mode, steps);
}

export function getAllHarmonies(baseColor: {
    l: number;
    c: number;
    h: number;
    alpha?: number;
}): Record<HarmonyType, string[]> {
    return {
        complementary: generateHarmony(baseColor, 'complementary'),
        'split-complementary': generateHarmony(baseColor, 'split-complementary'),
        analogous: generateHarmony(baseColor, 'analogous'),
        triadic: generateHarmony(baseColor, 'triadic'),
        tetradic: generateHarmony(baseColor, 'tetradic'),
        square: generateHarmony(baseColor, 'square'),
    };
}
