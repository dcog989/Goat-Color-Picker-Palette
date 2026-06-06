import { colordx, getFormat } from '@colordx/core';
import { describe, expect, it } from 'vitest';

describe('colordx formatting', () => {
  describe('toOklchString', () => {
    it('should format OKLCH color string', () => {
      const c = colordx({ l: 0.5, c: 0.2, h: 270 });
      expect(c.toOklchString()).toMatch(/^oklch\(0\.5 0\.2 27\d+\.?\d*\)$/);
    });

    it('should include alpha channel when less than 1', () => {
      const c = colordx({ l: 0.5, c: 0.2, h: 270, alpha: 0.5 });
      expect(c.toOklchString()).toMatch(/oklch\(0\.5 0\.2 27\d+\.?\d* \/ 0\.5\)/);
    });
  });

  describe('toRgbString', () => {
    it('should format RGB color string', () => {
      expect(colordx('#ff8040').toRgbString()).toBe('rgb(255 128 64)');
    });
  });

  describe('toHslString', () => {
    it('should format HSL color string', () => {
      const hsl = colordx({ h: 180, s: 50, l: 50 }).toHslString();
      expect(hsl).toMatch(/hsl\(180 50% 50%\)/);
    });
  });

  describe('getFormat', () => {
    it('should detect valid color formats', () => {
      expect(getFormat('#ff0000')).toBe('hex');
      expect(getFormat('rgb(255 0 0)')).toBe('rgb');
      expect(getFormat('hsl(0 100% 50%)')).toBe('hsl');
      expect(getFormat('not-a-color')).toBeUndefined();
    });
  });
});
