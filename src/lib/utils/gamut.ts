import { inGamutSrgb } from '@colordx/core';

const cache = new Map<number, number>();

export function maxChromaForLH(l: number, h: number): number {
  const key = Math.round(l * 1000) * 360 + Math.round(h);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  let lo = 0;
  let hi = 0.4;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (inGamutSrgb({ l, c: mid, h })) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  cache.set(key, lo);
  return lo;
}
