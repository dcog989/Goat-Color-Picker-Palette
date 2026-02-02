import type { Oklch } from 'culori';
import { formatCss, modeOklch, useMode } from 'culori/fn';

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
 * Check if a generation mode is a palette axis
 */
export function isPaletteMode(mode: GenerationMode): mode is PaletteAxis {
    return ['l', 'c', 'h', 'a'].includes(mode);
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

        // Base structure
        const color: Oklch = {
            mode: 'oklch',
            l: axis === 'l' ? fraction : baseColor.l,
            c: axis === 'c' ? fraction * 0.37 : baseColor.c,
        };

        // Handle Hue
        if (axis === 'h') {
            color.h = fraction * 360;
        } else if (baseColor.h !== undefined) {
            color.h = baseColor.h;
        }

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

    if (isPaletteMode(mode)) {
        return generatePalette(baseColor, mode, steps);
    }

    // Fallback
    return [formatCss(baseColor)];
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

/**
 * Configuration for palette generation
 */
export interface PaletteConfig {
    mode: GenerationMode;
    steps: number;
    baseColor: Oklch;
}

/**
 * Palette generator class for more complex use cases
 */
export class PaletteGenerator {
    private config: PaletteConfig;

    constructor(config: PaletteConfig) {
        this.config = config;
    }

    /**
     * Update the base color
     */
    setBaseColor(color: Oklch): void {
        this.config.baseColor = color;
    }

    /**
     * Update the generation mode
     */
    setMode(mode: GenerationMode): void {
        this.config.mode = mode;
    }

    /**
     * Update the number of steps (only for palette modes)
     */
    setSteps(steps: number): void {
        this.config.steps = Math.max(2, Math.min(20, steps));
    }

    /**
     * Generate the color palette
     */
    generate(): string[] {
        return generateColors(this.config.baseColor, this.config.mode, this.config.steps);
    }

    /**
     * Get the current configuration
     */
    getConfig(): Readonly<PaletteConfig> {
        return { ...this.config };
    }

    /**
     * Check if current mode is a harmony
     */
    isHarmony(): boolean {
        return isHarmonyMode(this.config.mode);
    }

    /**
     * Check if current mode is a palette
     */
    isPalette(): boolean {
        return isPaletteMode(this.config.mode);
    }
}

/**
 * Helper to create human-readable labels for generation modes
 */
export function getModeLabel(mode: GenerationMode): string {
    if (isHarmonyMode(mode)) {
        return HARMONY_DEFINITIONS[mode].name;
    }

    const labels: Record<PaletteAxis, string> = {
        l: 'Lightness',
        c: 'Chroma',
        h: 'Hue',
        a: 'Alpha',
    };

    return labels[mode as PaletteAxis] || mode;
}

/**
 * Get description for a generation mode
 */
export function getModeDescription(mode: GenerationMode): string {
    if (isHarmonyMode(mode)) {
        return HARMONY_DEFINITIONS[mode].description;
    }

    const descriptions: Record<PaletteAxis, string> = {
        l: 'Vary the lightness from dark to light',
        c: 'Vary the chroma from gray to vivid',
        h: 'Vary the hue across the color wheel',
        a: 'Vary the alpha from transparent to opaque',
    };

    return descriptions[mode as PaletteAxis] || '';
}
