import type { Colordx } from '@colordx/core';
import { colordx, inGamutSrgb } from '@colordx/core';
import { resolveNamedColor } from '$lib/utils/named-colors';

function getDisplayColor(color: Colordx): Colordx {
  if (inGamutSrgb(color.toOklch())) {
    return color;
  }
  return color.clampSrgb();
}

export class ColorStore {
  #current = $state<Colordx>(colordx(ColorStore.#getRandomColor()));
  #lastMeaningfulHue = 0;
  mode = $state<'oklch' | 'rgb' | 'hsl'>('oklch');
  #precisionMode: () => 'precise' | 'practical';

  constructor(precisionGetter: () => 'precise' | 'practical' = () => 'practical') {
    this.#precisionMode = precisionGetter;
    // Capture initial hue if meaningful
    const init = this.#current.toOklch();
    if (init.c > 0.001) this.#lastMeaningfulHue = init.h;
  }

  static #getRandomColor(): string {
    const h = Math.random() * 360;
    const s = 0.4 + Math.random() * 0.5;
    const l = 0.4 + Math.random() * 0.3;
    return `hsl(${h}, ${s * 100}%, ${l * 100}%)`;
  }

  #setCurrent(color: Colordx) {
    const oklch = color.toOklch();
    if (oklch.c > 0.001) {
      this.#lastMeaningfulHue = oklch.h;
    }
    this.#current = color;
  }

  set(value: string): boolean {
    try {
      const hex = resolveNamedColor(value);
      const parsed = colordx(hex ?? value);
      if (!parsed.isValid()) return false;
      this.#setCurrent(parsed);
      return true;
    } catch {
      return false;
    }
  }

  get l() {
    return this.#current.toOklch().l;
  }
  set l(v: number) {
    const { c, alpha } = this.#current.toOklch();
    this.#setCurrent(colordx({ l: v, c, h: this.h, alpha }));
  }

  get c() {
    return this.#current.toOklch().c;
  }
  set c(v: number) {
    const { l, alpha } = this.#current.toOklch();
    this.#setCurrent(colordx({ l, c: v, h: this.h, alpha }));
  }

  get h() {
    const { c, h } = this.#current.toOklch();
    return c > 0.001 ? h : this.#lastMeaningfulHue;
  }
  set h(v: number) {
    const { l, c, alpha } = this.#current.toOklch();
    this.#setCurrent(colordx({ l, c, h: Math.min(v, 359.999), alpha }));
  }

  get alpha() {
    return this.#current.alpha();
  }
  set alpha(v: number) {
    this.#setCurrent(this.#current.alpha(v));
  }

  #isOutOfGamut = $derived.by(() => {
    const oklch = this.#current.toOklch();
    return !inGamutSrgb({ l: oklch.l, c: oklch.c, h: oklch.h });
  });

  get isOutOfGamut() {
    return this.#isOutOfGamut;
  }

  #displayColor = $derived.by(() => getDisplayColor(this.#current));

  get rgbComp() {
    return this.#displayColor.toRgb();
  }

  mapToSrgb() {
    this.#setCurrent(this.#current.mapSrgb());
  }

  setRgb(channel: 'r' | 'g' | 'b', value: number) {
    const sr = this.#current.toRgb();
    const newR = channel === 'r' ? value : sr.r;
    const newG = channel === 'g' ? value : sr.g;
    const newB = channel === 'b' ? value : sr.b;
    this.#setCurrent(colordx({ r: newR, g: newG, b: newB, alpha: this.alpha }));
  }

  setRgbValues(r: number, g: number, b: number) {
    this.#setCurrent(colordx({ r, g, b, alpha: this.alpha }));
  }

  setHslValues(h: number, s: number, l: number) {
    this.#setCurrent(
      colordx({
        h: Math.min(h, 359.999),
        s: Math.max(0, Math.min(s, 100)),
        l: Math.max(0, Math.min(l, 100)),
        alpha: this.alpha,
      }),
    );
  }

  get hslComp() {
    return this.#displayColor.toHsl();
  }

  setHsl(channel: 'h' | 's' | 'l', value: number) {
    const hsl = this.#current.toHsl();
    const newH = channel === 'h' ? Math.min(value, 359.999) : hsl.h;
    const newS = channel === 's' ? Math.max(0, Math.min(value, 100)) : hsl.s;
    const newL = channel === 'l' ? Math.max(0, Math.min(value, 100)) : hsl.l;
    this.#setCurrent(colordx({ h: newH, s: newS, l: newL, alpha: this.alpha }));
  }

  get hslValues() {
    return this.#current.toHsl();
  }

  formatColor(css: string): string {
    let parsed: Colordx;
    try {
      const hex = resolveNamedColor(css);
      parsed = colordx(hex ?? css);
    } catch {
      return css;
    }

    if (!parsed.isValid()) {
      return css;
    }

    const precision = this.#precisionMode() === 'precise' ? 4 : undefined;

    if (this.mode === 'rgb') {
      return parsed.toRgbString();
    } else if (this.mode === 'hsl') {
      return parsed.toHslString(precision);
    } else {
      return parsed.toOklchString(precision);
    }
  }

  display = $derived.by(() => {
    if (this.#precisionMode() === 'precise') {
      return this.#current.toOklchString();
    }
    const { l, c, h, alpha } = this.#current.toOklch();
    const lPct = Math.round(l * 100);
    const cStr = parseFloat(c.toFixed(2));
    const hStr = Math.round(h || 0);
    return alpha < 1
      ? `oklch(${lPct}% ${cStr} ${hStr} / ${parseFloat(alpha.toFixed(1))})`
      : `oklch(${lPct}% ${cStr} ${hStr})`;
  });

  get #precision(): number {
    return this.#precisionMode() === 'precise' ? 4 : 0;
  }

  hex = $derived(this.#displayColor.alpha(1).toHex());

  hexa = $derived(this.#displayColor.toHex());

  rgb = $derived.by(() => {
    const { r, g, b, alpha } = this.#displayColor.toRgb();
    const p = this.#precision;
    if (p) {
      return alpha < 1
        ? `rgb(${parseFloat(r.toFixed(p))} ${parseFloat(g.toFixed(p))} ${parseFloat(b.toFixed(p))} / ${alpha})`
        : `rgb(${parseFloat(r.toFixed(p))} ${parseFloat(g.toFixed(p))} ${parseFloat(b.toFixed(p))})`;
    }
    return this.#displayColor.toRgbString();
  });

  hsl = $derived(this.#displayColor.toHslString(this.#precision));

  lab = $derived(this.#current.toLabString(this.#precision));

  oklab = $derived.by(() => this.#current.toOklabString(this.#precisionMode() === 'precise' ? 4 : 2));

  cmyk = $derived(this.#displayColor.toCmykString(this.#precision));

  cssVar = $derived.by(() => {
    const oklch = this.#current.toOklch();
    const alphaStr = oklch.alpha < 1 ? ` / ${oklch.alpha}` : '';
    return `oklch(${oklch.l * 100}% ${oklch.c} ${oklch.h}${alphaStr})`;
  });

  cssVarOpaque = $derived.by(() => {
    const oklch = this.#current.toOklch();
    return `oklch(${oklch.l * 100}% ${oklch.c} ${oklch.h})`;
  });

  randomize() {
    this.#setCurrent(colordx(ColorStore.#getRandomColor()));
  }
}
