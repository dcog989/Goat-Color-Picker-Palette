import { formatCss, modeOklch, useMode, type Oklch } from 'culori/fn';

// Ensure Oklch is available for formatCss
useMode(modeOklch);

/**
 * Color harmony types based on color theory
 */
export type HarmonyType =
    | 'complementary'
    | 'split-complementary'
    | 'analogous'
    | 'triadic'
    | 'tetradic'
    | 'square';

/**
 * Palette generation axis types
 */
export type PaletteAxis = 'l' | 'c' | 'h' | 'a';

/**
 * Combined generation mode (harmony or palette axis)
 */
export type GenerationMode = HarmonyType | PaletteAxis;

/**
 * Harmony definition with angles and description
 */
interface HarmonyDefinition {
    name: string;
    angles: number[];
    description: string;
}

/**
 * All supported color harmonies with their angle definitions
 */
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

/**
 * Check if a generation mode is a harmony type
 */
export function isHarmonyMode(mode: GenerationMode): mode is HarmonyType {
    return mode in HARMONY_DEFINITIONS;
}

/**
 * Rotate a color's hue by a specified angle
 */
export function rotateHue(color: Oklch, angle: number): string {
    const currentHue = color.h ?? 0;
    const newHue = (currentHue + angle + 360) % 360;

    // Construct object carefully to avoid 'undefined' assignment to optional properties
    const result: Oklch = {
        mode: 'oklch',
        l: color.l,
        c: color.c,
        h: newHue,
    };

    if (color.alpha !== undefined) {
        result.alpha = color.alpha;
    }

    return formatCss(result);
}

/**
 * Generate harmony colors based on a base color and harmony type
 */
export function generateHarmony(baseColor: Oklch, harmonyType: HarmonyType): string[] {
    const definition = HARMONY_DEFINITIONS[harmonyType];
    return definition.angles.map((angle) => rotateHue(baseColor, angle));
}

/**
 * Generate a palette by interpolating along a specific axis
 */
export function generatePalette(baseColor: Oklch, axis: PaletteAxis, steps: number): string[] {
    if (steps < 2) steps = 2;
    if (steps > 20) steps = 20;

    return Array.from({ length: steps }, (_, i) => {
        const fraction = i / (steps - 1);

        // Calculate lightness
        const l = axis === 'l' ? 0.08 + fraction * 0.89 : baseColor.l;

        // Calculate chroma
        const c = axis === 'c' ? 0.04 + fraction * Math.min(0.2, baseColor.c * 1.5) : baseColor.c;

        // Calculate hue
        const h = axis === 'h' ? i * (360 / steps) : (baseColor.h ?? 0);

        // Base structure
        const color: Oklch = {
            mode: 'oklch',
            l,
            c,
            h,
        };

        // Handle Alpha
        if (axis === 'a') {
            color.alpha = fraction;
        } else if (baseColor.alpha !== undefined) {
            color.alpha = baseColor.alpha;
        }

        return formatCss(color);
    });
}

/**
 * Generate colors based on mode (either harmony or palette)
 */
export function generateColors(
    baseColor: Oklch,
    mode: GenerationMode,
    steps: number = 8,
): string[] {
    if (isHarmonyMode(mode)) {
        return generateHarmony(baseColor, mode);
    }

    return generatePalette(baseColor, mode, steps);
}

/**
 * Get all harmony colors for a base color
 */
export function getAllHarmonies(baseColor: Oklch): Record<HarmonyType, string[]> {
    return {
        complementary: generateHarmony(baseColor, 'complementary'),
        'split-complementary': generateHarmony(baseColor, 'split-complementary'),
        analogous: generateHarmony(baseColor, 'analogous'),
        triadic: generateHarmony(baseColor, 'triadic'),
        tetradic: generateHarmony(baseColor, 'tetradic'),
        square: generateHarmony(baseColor, 'square'),
    };
}
