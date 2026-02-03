import { describe, expect, it } from 'vitest';
import { formatCmyk, formatHsl, formatLab, formatOklab, formatOklch, formatRgb } from './format';

describe('format utilities', () => {
    describe('formatOklch', () => {
        it('should format OKLCH color string in practical mode', () => {
            expect(formatOklch(0.5, 0.2, 180)).toBe('oklch(50% 0.2 180)');
        });

        it('should format OKLCH color string with full opacity', () => {
            expect(formatOklch(1, 0.4, 360, 1, 'practical')).toBe('oklch(100% 0.4 360)');
        });

        it('should include alpha channel when less than 1', () => {
            expect(formatOklch(0.5, 0.2, 180, 0.5)).toBe('oklch(50% 0.2 180 / 0.5)');
        });
    });

    describe('formatRgb', () => {
        it('should format RGB color string', () => {
            expect(formatRgb(255, 128, 64)).toBe('rgb(255 128 64)');
            expect(formatRgb(0, 0, 0, 0.5)).toBe('rgb(0 0 0 / 0.5)');
        });
    });

    describe('formatHsl', () => {
        it('should format HSL color string', () => {
            expect(formatHsl(180, 0.5, 0.5)).toBe('hsl(180 50% 50%)');
            expect(formatHsl(0, 1, 0.5, 0.8)).toBe('hsl(0 100% 50% / 0.8)');
        });
    });

    describe('formatLab', () => {
        it('should format Lab color string', () => {
            expect(formatLab(50, 20, -30)).toBe('lab(50% 20 -30)');
            expect(formatLab(50, 20, -30, 0.9)).toBe('lab(50% 20 -30 / 0.9)');
        });
    });

    describe('formatOklab', () => {
        it('should format Oklab color string', () => {
            expect(formatOklab(0.5, 0.2, -0.3)).toBe('oklab(0.5 0.2 -0.3)');
            expect(formatOklab(0.5, 0.2, -0.3, 0.9)).toBe('oklab(0.5 0.2 -0.3 / 0.9)');
        });
    });

    describe('formatCmyk', () => {
        it('should format CMYK color string', () => {
            expect(formatCmyk(0, 0.5, 1, 0)).toBe('device-cmyk(0% 50% 100% 0%)');
            expect(formatCmyk(0.2, 0.4, 0.6, 0.8, 0.9)).toBe('device-cmyk(20% 40% 60% 80% / 0.9)');
        });
    });
});
