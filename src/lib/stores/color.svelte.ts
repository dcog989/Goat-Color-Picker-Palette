import {
    converter,
    formatHex,
    modeHsl,
    modeLab,
    modeLrgb,
    modeOklab,
    modeOklch,
    modeRgb,
    modeXyz65,
    parse,
    toGamut,
    useMode,
    type Hsl,
    type Lab,
    type Oklab,
    type Oklch,
    type Rgb,
} from 'culori/fn';
import {
    formatCmyk,
    formatHsl,
    formatLab,
    formatOklab,
    formatOklch,
    formatRgb,
} from '../utils/format';

// Register color spaces in worker scope
useMode(modeRgb);
useMode(modeLrgb);
useMode(modeXyz65);
useMode(modeOklch);
useMode(modeHsl);
useMode(modeOklab);
useMode(modeLab);

const toOklch = converter<Oklch>('oklch');
const toRgb = converter<Rgb>('rgb');
const toHsl = converter<Hsl>('hsl');
const toOklab = converter<Oklab>('oklab');
const toLab = converter<Lab>('lab');
const toRgbGamut = toGamut('rgb');

export class ColorStore {
    #current = $state<Oklch>(ColorStore.#getRandomColor());
    mode = $state<'oklch' | 'rgb' | 'hsl'>('oklch');
    #precisionMode: () => 'precise' | 'practical';

    constructor(precisionGetter: () => 'precise' | 'practical' = () => 'practical') {
        this.#precisionMode = precisionGetter;
    }

    static #getRandomColor(): Oklch {
        // Generate in HSL to ensure sRGB constraint while keeping colors interesting
        const hsl: Hsl = {
            mode: 'hsl',
            h: Math.random() * 360,
            s: 0.4 + Math.random() * 0.5, // 50-90% Saturation
            l: 0.4 + Math.random() * 0.3, // 40-70% Lightness
            alpha: 1,
        };

        const converted = toOklch(hsl);
        return converted || { mode: 'oklch', l: 0.6, c: 0.15, h: 0, alpha: 1 };
    }

    set(value: string): boolean {
        const parsed = parse(value);
        if (parsed) {
            const converted = toOklch(parsed);
            if (converted) {
                this.#current = converted;
                return true;
            }
        }
        return false;
    }

    // OKLCH Getters/Setters
    get l() {
        return this.#current.l;
    }
    set l(v: number) {
        this.#current.l = v;
    }

    get c() {
        return this.#current.c;
    }
    set c(v: number) {
        this.#current.c = v;
    }

    get h() {
        return this.#current.h ?? 0;
    }
    set h(v: number) {
        this.#current.h = v;
    }

    get alpha() {
        return this.#current.alpha ?? 1;
    }
    set alpha(v: number) {
        this.#current.alpha = v;
    }

    // Check if current color is out of sRGB gamut
    // Defined as a getter for robust Type checking
    #isOutOfGamut = $derived.by(() => {
        const rgb = toRgb(this.#current);
        if (!rgb) return false;
        return (
            rgb.r < -0.0001 ||
            rgb.r > 1.0001 ||
            rgb.g < -0.0001 ||
            rgb.g > 1.0001 ||
            rgb.b < -0.0001 ||
            rgb.b > 1.0001
        );
    });

    get isOutOfGamut() {
        return this.#isOutOfGamut;
    }

    // Get a gamut-mapped sRGB version for display (Hex, RGB, HSL)
    #mappedRgb = $derived.by((): Rgb => {
        const rgb = toRgb(this.#current);
        if (!rgb) return { mode: 'rgb', r: 0, g: 0, b: 0 };

        const EPSILON = 0.005;
        const inBounds =
            rgb.r >= -EPSILON &&
            rgb.r <= 1 + EPSILON &&
            rgb.g >= -EPSILON &&
            rgb.g <= 1 + EPSILON &&
            rgb.b >= -EPSILON &&
            rgb.b <= 1 + EPSILON;

        if (inBounds) {
            const result: Rgb = {
                mode: 'rgb',
                r: Math.max(0, Math.min(1, rgb.r)),
                g: Math.max(0, Math.min(1, rgb.g)),
                b: Math.max(0, Math.min(1, rgb.b)),
            };
            if (rgb.alpha !== undefined) result.alpha = rgb.alpha;
            return result;
        }

        return toRgbGamut(this.#current) as Rgb;
    });

    // RGB Helpers
    get rgbComp() {
        const rgb = this.#mappedRgb;
        return {
            r: Math.round(rgb.r * 255),
            g: Math.round(rgb.g * 255),
            b: Math.round(rgb.b * 255),
        };
    }

    setRgb(channel: 'r' | 'g' | 'b', value: number) {
        const rgb = this.#mappedRgb;
        const newRgb: Rgb = {
            mode: 'rgb',
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            alpha: this.alpha,
        };
        newRgb[channel] = value / 255;
        const converted = toOklch(newRgb);
        if (converted) this.#current = converted;
    }

    // HSL Helpers
    get hslComp() {
        const hsl = toHsl(this.#mappedRgb) ?? { mode: 'hsl', h: 0, s: 0, l: 0 };
        return {
            h: hsl.h ?? 0,
            s: (hsl.s ?? 0) * 100,
            l: (hsl.l ?? 0) * 100,
        };
    }

    setHsl(channel: 'h' | 's' | 'l', value: number) {
        const hsl = toHsl(this.#mappedRgb) ?? { mode: 'hsl', h: 0, s: 0, l: 0, alpha: this.alpha };

        // Create new object to modify, handling optional properties strictly
        const newHsl: Hsl = {
            mode: 'hsl',
            s: hsl.s,
            l: hsl.l,
        };

        if (hsl.h !== undefined) {
            newHsl.h = hsl.h;
        }

        // Assign alpha only if it was present or we want to preserve current alpha
        // this.alpha getter returns number (defaults to 1), so it's safe to assign if we want explicit alpha
        if (this.alpha !== undefined) {
            newHsl.alpha = this.alpha;
        }

        if (channel === 'h') newHsl.h = value;
        else if (channel === 's') newHsl.s = value / 100;
        else if (channel === 'l') newHsl.l = value / 100;

        const converted = toOklch(newHsl);
        if (converted) this.#current = converted;
    }

    get hslValues() {
        const hsl = toHsl(this.#mappedRgb) ?? { h: 0, s: 0, l: 0 };
        return {
            h: hsl.h ?? 0,
            s: hsl.s ?? 0,
            l: hsl.l ?? 0,
        };
    }

    // Formatting Utility
    formatColor(css: string): string {
        const c = parse(css);
        if (!c) return css;

        const alpha = c.alpha ?? 1;
        const mode = this.#precisionMode();

        if (this.mode === 'rgb') {
            const rgb = toRgb(c);
            if (rgb) {
                return formatRgb(rgb.r * 255, rgb.g * 255, rgb.b * 255, alpha, mode);
            }
        } else if (this.mode === 'hsl') {
            const hsl = toHsl(c);
            if (hsl) {
                return formatHsl(hsl.h || 0, hsl.s || 0, hsl.l || 0, alpha, mode);
            }
        } else {
            const oklch = toOklch(c);
            if (oklch) {
                return formatOklch(oklch.l, oklch.c, oklch.h || 0, alpha, mode);
            }
        }
        return css;
    }

    // Derived Display Formats
    display = $derived.by(() => {
        return formatOklch(this.l, this.c, this.h, this.alpha, this.#precisionMode());
    });

    // Hex uses mapped color
    hex = $derived(formatHex(this.#mappedRgb) ?? '#000000');

    hexa = $derived.by(() => {
        const base = formatHex(this.#mappedRgb) ?? '#000000';
        if (this.alpha < 1) {
            const alphaHex = Math.round(this.alpha * 255)
                .toString(16)
                .padStart(2, '0');
            return base + alphaHex;
        }
        return base;
    });

    // RGB uses mapped color
    rgb = $derived.by(() => {
        const rgb = this.#mappedRgb;
        return formatRgb(rgb.r * 255, rgb.g * 255, rgb.b * 255, this.alpha, this.#precisionMode());
    });

    // HSL uses mapped color
    hsl = $derived.by(() => {
        const hsl = toHsl(this.#mappedRgb) ?? { h: 0, s: 0, l: 0 };
        return formatHsl(hsl.h || 0, hsl.s || 0, hsl.l || 0, this.alpha, this.#precisionMode());
    });

    lab = $derived.by(() => {
        const labColor = toLab(this.#current);
        if (!labColor) return 'lab(0% 0 0)';
        return formatLab(
            labColor.l ?? 0,
            labColor.a ?? 0,
            labColor.b ?? 0,
            this.alpha,
            this.#precisionMode(),
        );
    });

    oklab = $derived.by(() => {
        const oklabColor = toOklab(this.#current);
        if (!oklabColor) return 'oklab(0 0 0)';
        return formatOklab(
            oklabColor.l ?? 0,
            oklabColor.a ?? 0,
            oklabColor.b ?? 0,
            this.alpha,
            this.#precisionMode(),
        );
    });

    cmyk = $derived.by(() => {
        const rgb = this.#mappedRgb;
        const r = rgb.r,
            g = rgb.g,
            b = rgb.b;
        const k = 1 - Math.max(r, g, b);
        let c = 0,
            m = 0,
            y = 0;
        if (k < 1) {
            c = (1 - r - k) / (1 - k);
            m = (1 - g - k) / (1 - k);
            y = (1 - b - k) / (1 - k);
        }
        return formatCmyk(c, m, y, k, this.alpha, this.#precisionMode());
    });

    cssVar = $derived.by(() => {
        const alphaStr = this.alpha < 1 ? ` / ${this.alpha}` : '';
        return `oklch(${this.l} ${this.c} ${this.h}${alphaStr})`;
    });

    cssVarOpaque = $derived(`oklch(${this.l} ${this.c} ${this.h})`);

    randomize() {
        this.#current = ColorStore.#getRandomColor();
    }
}
