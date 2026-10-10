import type { Colordx } from "@colordx/core";
import { colordx, inGamutSrgb } from "@colordx/core";

const RANDOM_HUE_MAX = 360;
const RANDOM_LIGHTNESS = 0.45;
const RANDOM_CHROMA = 0.08;
const CHROMA_SEARCH_UPPER_BOUND = 0.5;
const CHROMA_SEARCH_ITERATIONS = 18;
const MIN_CHROMA_MAX = 0.001;
const HUE_MAX = 359.999;

const clampHue = (h: number): number => Math.max(0, Math.min(h, HUE_MAX));

function getMaxSrgbChroma(l: number, h: number): number {
  let low = 0;
  let high = CHROMA_SEARCH_UPPER_BOUND;
  for (let i = 0; i < CHROMA_SEARCH_ITERATIONS; i++) {
    const mid = (low + high) / 2;
    if (inGamutSrgb({ l, c: mid, h })) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return low;
}

export class ColorStore {
  #current = $state<Colordx>(ColorStore.#getRandomColor());
  #oklch = $derived(this.#current.toOklch());
  #lastMeaningfulHue = 0;
  mode = $state<"okhsl" | "oklch" | "rgb">("okhsl");
  #precisionMode: () => "precise" | "practical";

  constructor(precisionGetter: () => "precise" | "practical" = () => "practical") {
    this.#precisionMode = precisionGetter;
    // Capture initial hue if meaningful
    const init = this.#oklch;
    if (init.c > 0.001) this.#lastMeaningfulHue = init.h;
  }

  static #getRandomColor(): Colordx {
    const h = Math.random() * RANDOM_HUE_MAX;
    return colordx({ l: RANDOM_LIGHTNESS, c: RANDOM_CHROMA, h }).mapSrgb();
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
      const parsed = colordx(value);
      if (!parsed.isValid()) return false;
      this.#setCurrent(parsed);
      return true;
    } catch {
      return false;
    }
  }

  get l() {
    return this.#oklch.l;
  }
  set l(v: number) {
    this.#setOklchField("l", v);
  }

  get c() {
    return this.#oklch.c;
  }
  set c(v: number) {
    this.#setOklchField("c", v);
  }

  get h() {
    const { c, h } = this.#oklch;
    return c > 0.001 ? h : this.#lastMeaningfulHue;
  }
  set h(v: number) {
    this.#setOklchField("h", clampHue(v));
  }

  #setOklchField(field: "l" | "c" | "h", value: number) {
    const { l, c, h, alpha } = this.#oklch;
    this.#setCurrent(colordx({ l, c, h, alpha, [field]: value }));
  }

  get alpha() {
    return this.#current.alpha();
  }
  set alpha(v: number) {
    this.#setCurrent(this.#current.alpha(v));
  }

  #isOutOfGamut = $derived.by(() => !inGamutSrgb(this.#oklch));

  get isOutOfGamut() {
    return this.#isOutOfGamut;
  }

  #maxChroma = $derived.by(() => getMaxSrgbChroma(this.l, this.h));

  get maxChroma() {
    return this.#maxChroma;
  }

  #chromaMax = $derived.by(() => Math.max(this.#maxChroma, this.c, MIN_CHROMA_MAX));

  get chromaMax() {
    return this.#chromaMax;
  }

  #displayColor = $derived.by(() => (inGamutSrgb(this.#oklch) ? this.#current : this.#current.clampSrgb()));

  get rgbComp() {
    return this.#displayColor.toRgb();
  }

  mapToSrgb() {
    this.#setCurrent(this.#current.mapSrgb());
  }

  setRgb(channel: "r" | "g" | "b", value: number) {
    const sr = this.#current.toRgb();
    const newR = channel === "r" ? value : sr.r;
    const newG = channel === "g" ? value : sr.g;
    const newB = channel === "b" ? value : sr.b;
    this.#setCurrent(colordx({ r: newR, g: newG, b: newB, alpha: this.alpha }));
  }

  setRgbValues(r: number, g: number, b: number) {
    this.#setCurrent(colordx({ r, g, b, alpha: this.alpha }));
  }

  setOkhslValues(h: number, s: number, l: number) {
    this.#setCurrent(
      colordx({
        h: clampHue(h),
        s: Math.max(0, Math.min(s, 100)),
        l: Math.max(0, Math.min(l, 100)),
        alpha: this.alpha,
        colorSpace: "okhsl",
      }),
    );
  }

  get okhslComp() {
    return this.#displayColor.toOkhsl();
  }

  formatColor(css: string): string {
    let parsed: Colordx;
    try {
      parsed = colordx(css);
    } catch {
      return css;
    }

    if (!parsed.isValid()) {
      return css;
    }

    const precision = this.#precisionMode() === "precise" ? 4 : undefined;

    if (this.mode === "rgb") {
      return parsed.toRgbString();
    } else if (this.mode === "okhsl") {
      return parsed.toOkhslString(precision);
    } else {
      return parsed.toOklchString(precision);
    }
  }

  display = $derived.by(() => {
    if (this.#precisionMode() === "precise") {
      return this.#current.toOklchString();
    }
    const { l, c, h, alpha } = this.#oklch;
    const lPct = Math.round(l * 100);
    const cStr = parseFloat(c.toFixed(2));
    const hStr = Math.round(h || 0);
    return alpha < 1
      ? `oklch(${lPct}% ${cStr} ${hStr} / ${parseFloat(alpha.toFixed(1))})`
      : `oklch(${lPct}% ${cStr} ${hStr})`;
  });

  get #precision(): number {
    return this.#precisionMode() === "precise" ? 4 : 0;
  }

  hex = $derived(this.#displayColor.alpha(1).toHex());

  hexa = $derived(this.#displayColor.toHex());

  rgb = $derived.by(() => {
    const p = this.#precision;
    if (!p) {
      return this.#displayColor.toRgbString();
    }
    const { r, g, b, alpha } = this.#displayColor.toRgb(p);
    return alpha < 1 ? `rgb(${r} ${g} ${b} / ${alpha})` : `rgb(${r} ${g} ${b})`;
  });

  hsl = $derived(this.#displayColor.toHslString(this.#precision));

  hwb = $derived(this.#displayColor.toHwbString(this.#precision));

  okhsl = $derived(this.#displayColor.toOkhslString(this.#precision));

  lab = $derived(this.#current.toLabString(this.#precision));

  oklab = $derived.by(() => this.#current.toOklabString(this.#precisionMode() === "precise" ? 4 : 2));

  cmyk = $derived(this.#displayColor.toCmykString(this.#precision));

  cssVar = $derived.by(() => {
    const oklch = this.#oklch;
    const alphaStr = oklch.alpha < 1 ? ` / ${oklch.alpha}` : "";
    return `oklch(${oklch.l * 100}% ${oklch.c} ${oklch.h}${alphaStr})`;
  });

  cssVarOpaque = $derived.by(() => {
    const oklch = this.#oklch;
    return `oklch(${oklch.l * 100}% ${oklch.c} ${oklch.h})`;
  });

  randomize() {
    this.#setCurrent(ColorStore.#getRandomColor());
  }
}
