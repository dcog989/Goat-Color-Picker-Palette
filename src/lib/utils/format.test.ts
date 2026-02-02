import { describe, it, expect } from 'vitest';
import {
    formatFloat,
    formatPercent,
    formatOklch,
    formatRgb,
    formatHsl,
    formatLab,
    formatOklab,
    formatCmyk,
} from './format';

describe('format utilities', () => {
    describe('formatFloat', () => {
        it('should format number to specified precision', () => {
            expect(formatFloat(3.14159, 2)).toBe(3.14);
            expect(formatFloat(3.14159, 0)).toBe(3);
            expect(formatFloat(3.14159, 4)).toBe(3.1416);
        });
    });

    describe('formatPercent', () => {
        it('should format number as percentage string', () => {
            expect(formatPercent(50, 0)).toBe('50%');
            expect(formatPercent(50.5, 1)).toBe('50.5%');
            expect(formatPercent(99.999, 2)).toBe('100%');
        });
    });

    describe('formatOklch', () => {
        it('should format OKLCH color string in sensible mode', () => {
            expect(formatOklch(0.5, 0.2, 180)).toBe('oklch(50% 0.2 180)');
        });

        it('should format OKLCH color string with full opacity', () => {
            expect(formatOklch(1, 0.4, 360, 1, 'sensible')).toBe('oklch(100% 0.4 360)');
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
