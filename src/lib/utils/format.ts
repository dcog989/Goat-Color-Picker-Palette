import { PRECISION } from '../constants';

function formatFloat(value: number, precision: number): number {
    return parseFloat(value.toFixed(precision));
}

function formatPercent(value: number, precision: number): string {
    return `${formatFloat(value, precision)}%`;
}

function formatAlpha(a: number, mode: 'precise' | 'practical' = 'practical'): string {
    const alphaPrecision = mode === 'precise' ? 2 : 1;
    return a < 1 ? ` / ${formatFloat(a, alphaPrecision)}` : '';
}

export function formatOklch(
    l: number,
    c: number,
    h: number,
    alpha: number = 1,
    mode: 'precise' | 'practical' = 'practical',
): string {
    // l: 0-1, c: 0-0.4+, h: 0-360
    const lPrec = mode === 'precise' ? PRECISION.OKLCH_L_DISPLAY : 0;
    const cPrec = mode === 'precise' ? PRECISION.OKLCH_C_DISPLAY : 2;
    const hPrec = mode === 'precise' ? PRECISION.OKLCH_H_DISPLAY : 0;
    return `oklch(${formatPercent(l * 100, lPrec)} ${formatFloat(c, cPrec)} ${formatFloat(h || 0, hPrec)}${formatAlpha(alpha, mode)})`;
}

export function formatRgb(
    r: number,
    g: number,
    b: number,
    alpha: number = 1,
    mode: 'precise' | 'practical' = 'practical',
): string {
    // r,g,b: 0-255
    return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)}${formatAlpha(alpha, mode)})`;
}

export function formatHsl(
    h: number,
    s: number,
    l: number,
    alpha: number = 1,
    mode: 'precise' | 'practical' = 'practical',
): string {
    // h: 0-360, s: 0-1, l: 0-1
    const hPrec = mode === 'precise' ? 1 : 0;
    const slPrec = mode === 'precise' ? 1 : 0;
    return `hsl(${formatFloat(h || 0, hPrec)} ${formatPercent(s * 100, slPrec)} ${formatPercent(l * 100, slPrec)}${formatAlpha(alpha, mode)})`;
}

export function formatLab(
    l: number,
    a: number,
    b: number,
    alpha: number = 1,
    mode: 'precise' | 'practical' = 'practical',
): string {
    // l: 0-100 (usually, depending on lib, but culori uses 0-100 for Lab L)
    const precision = mode === 'precise' ? 1 : 0;
    return `lab(${formatPercent(l, precision)} ${formatFloat(a, precision)} ${formatFloat(b, precision)}${formatAlpha(alpha, mode)})`;
}

export function formatOklab(
    l: number,
    a: number,
    b: number,
    alpha: number = 1,
    mode: 'precise' | 'practical' = 'practical',
): string {
    // l: 0-1
    const precision = mode === 'precise' ? 3 : 2;
    return `oklab(${formatFloat(l, precision)} ${formatFloat(a, precision)} ${formatFloat(b, precision)}${formatAlpha(alpha, mode)})`;
}

export function formatCmyk(
    c: number,
    m: number,
    y: number,
    k: number,
    alpha: number = 1,
    mode: 'precise' | 'practical' = 'practical',
): string {
    // c,m,y,k: 0-1
    return `device-cmyk(${formatPercent(c * 100, 0)} ${formatPercent(m * 100, 0)} ${formatPercent(y * 100, 0)} ${formatPercent(k * 100, 0)}${formatAlpha(alpha, mode)})`;
}
