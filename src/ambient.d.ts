// Culori type definitions with proper generics
declare module 'culori' {
    // Base color type with mode discriminator
    export interface Color {
        mode: string;
        alpha?: number;
    }

    // OKLCH color space
    export interface Oklch extends Color {
        mode: 'oklch';
        l: number;
        c: number;
        h?: number;
    }

    // RGB color space
    export interface Rgb extends Color {
        mode: 'rgb';
        r: number;
        g: number;
        b: number;
    }

    // Linear RGB color space
    export interface Lrgb extends Color {
        mode: 'lrgb';
        r: number;
        g: number;
        b: number;
    }

    // XYZ (D65) color space
    export interface Xyz65 extends Color {
        mode: 'xyz65';
        x: number;
        y: number;
        z: number;
    }

    // HSL color space
    export interface Hsl extends Color {
        mode: 'hsl';
        h?: number;
        s: number;
        l: number;
    }

    // CMYK color space (device-dependent)
    export interface Cmyk extends Color {
        mode: 'cmyk';
        c: number;
        m: number;
        y: number;
        k: number;
    }

    // Lab color space
    export interface Lab extends Color {
        mode: 'lab';
        l: number;
        a: number;
        b: number;
    }

    // OKLab color space
    export interface Oklab extends Color {
        mode: 'oklab';
        l: number;
        a: number;
        b: number;
    }

    // Union of all supported color types
    export type AnyColor = Oklch | Rgb | Hsl | Cmyk | Lab | Oklab | Lrgb | Xyz65;

    // Parser function - returns null if parsing fails
    export function parse(color: string): AnyColor | undefined;

    // Format functions with proper return types
    export function formatHex(color: AnyColor): string | undefined;
    export function formatRgb(color: AnyColor): string;
    export function formatHsl(color: AnyColor): string;
    export function formatCss(color: AnyColor): string;

    // Converter function with generic type support
    export function converter<T extends Color = AnyColor>(
        mode: string,
    ): (color: AnyColor) => T | undefined;

    // Gamut mapping
    export function toGamut(mode: string, method?: 'clip' | 'css'): (color: AnyColor) => AnyColor;

    // Color difference functions
    export function differenceEuclidean(mode?: string): (a: AnyColor, b: AnyColor) => number;
    export function differenceCie76(): (a: AnyColor, b: AnyColor) => number;
    export function differenceCie94(): (a: AnyColor, b: AnyColor) => number;
    export function differenceCiede2000(): (a: AnyColor, b: AnyColor) => number;
}

// Declarations for the functional API (tree-shakeable)
declare module 'culori/fn' {
    // Re-export types from main module for convenience
    export type { AnyColor, Cmyk, Color, Hsl, Lab, Lrgb, Oklab, Oklch, Rgb, Xyz65 } from 'culori';

    export function useMode(modeDefinition: unknown): void;
    export function parse(color: string): AnyColor | undefined;
    export function formatHex(color: AnyColor): string | undefined;
    export function formatRgb(color: AnyColor): string;
    export function formatHsl(color: AnyColor): string;
    export function formatCss(color: AnyColor): string;
    export function converter<T extends Color = AnyColor>(
        mode: string,
    ): (color: AnyColor) => T | undefined;
    export function differenceEuclidean(mode?: string): (a: AnyColor, b: AnyColor) => number;
    export function toGamut(mode: string, method?: 'clip' | 'css'): (color: AnyColor) => AnyColor;

    // Mode Definitions - External library types
    export const modeOklch: unknown;
    export const modeRgb: unknown;
    export const modeHsl: unknown;
    export const modeCmyk: unknown;
    export const modeLab: unknown;
    export const modeOklab: unknown;

    // Critical for accurate P3/sRGB conversions - External library types
    export const modeLrgb: unknown;
    export const modeXyz65: unknown;
}

// Side-effect import for additional color spaces
declare module 'culori/all' {
    // This module has no exports, only side effects
}

// Color name list module types
declare module 'color-name-list' {
    export interface ColorName {
        name: string;
        hex: string;
    }
    const names: ColorName[];
    export default names;
}
