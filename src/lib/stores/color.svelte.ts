import Color from 'colorjs.io';
import {
    formatCmyk,
    formatHsl,
    formatLab,
    formatOklab,
    formatOklch,
    formatRgb,
    nn,
} from '../utils/format';

function toHexStr(color: Color): string {
    const srgb = color.to('srgb');
    const sr = srgb.srgb;
    const toHex = (n: number) =>
        Math.max(0, Math.min(255, Math.round(n * 255)))
            .toString(16)
            .padStart(2, '0');
    return `#${toHex(nn(sr[0]))}${toHex(nn(sr[1]))}${toHex(nn(sr[2]))}`;
}

function getDisplayColor(color: Color): Color {
    const srgb = color.to('srgb');
    if (srgb.inGamut()) {
        return srgb;
    }
    return srgb.toGamut({ method: 'css' });
}

export class ColorStore {
    #current = $state<Color>(ColorStore.#getRandomColor());
    mode = $state<'oklch' | 'rgb' | 'hsl'>('oklch');
    #precisionMode: () => 'precise' | 'practical';

    constructor(precisionGetter: () => 'precise' | 'practical' = () => 'practical') {
        this.#precisionMode = precisionGetter;
    }

    static #getRandomColor(): Color {
        const h = Math.random() * 360;
        const s = 0.4 + Math.random() * 0.5;
        const l = 0.4 + Math.random() * 0.3;
        return new Color('hsl', [h, s * 100, l * 100]).to('oklch');
    }

    set(value: string): boolean {
        try {
            this.#current = new Color(value).to('oklch');
            return true;
        } catch {
            return false;
        }
    }

    get l() {
        return nn(this.#current.oklch[0]);
    }
    set l(v: number) {
        const c = nn(this.#current.oklch[1]);
        const h = nn(this.#current.oklch[2]);
        this.#current = new Color('oklch', [v, c, h], this.#current.alpha);
    }

    get c() {
        return nn(this.#current.oklch[1]);
    }
    set c(v: number) {
        const l = nn(this.#current.oklch[0]);
        const h = nn(this.#current.oklch[2]);
        this.#current = new Color('oklch', [l, v, h], this.#current.alpha);
    }

    get h() {
        return nn(this.#current.oklch[2]);
    }
    set h(v: number) {
        const l = nn(this.#current.oklch[0]);
        const c = nn(this.#current.oklch[1]);
        this.#current = new Color('oklch', [l, c, v], this.#current.alpha);
    }

    get alpha() {
        return this.#current.alpha ?? 1;
    }
    set alpha(v: number) {
        this.#current = new Color('oklch', [this.l, this.c, this.h], v);
    }

    #isOutOfGamut = $derived(!this.#current.inGamut('srgb'));

    get isOutOfGamut() {
        return this.#isOutOfGamut;
    }

    #displayColor = $derived.by(() => getDisplayColor(this.#current));

    get rgbComp() {
        const sr = this.#displayColor.srgb;
        return {
            r: Math.round(nn(sr[0]) * 255),
            g: Math.round(nn(sr[1]) * 255),
            b: Math.round(nn(sr[2]) * 255),
        };
    }

    setRgb(channel: 'r' | 'g' | 'b', value: number) {
        const sr = this.#current.to('srgb').srgb;
        const newR = channel === 'r' ? value / 255 : nn(sr[0]);
        const newG = channel === 'g' ? value / 255 : nn(sr[1]);
        const newB = channel === 'b' ? value / 255 : nn(sr[2]);
        this.#current = new Color('srgb', [newR, newG, newB], this.alpha).to('oklch');
    }

    setRgbValues(r: number, g: number, b: number) {
        this.#current = new Color('srgb', [r / 255, g / 255, b / 255], this.alpha).to('oklch');
    }

    setHslValues(h: number, s: number, l: number) {
        this.#current = new Color('hsl', [h, s, l], this.alpha).to('oklch');
    }

    get hslComp() {
        const hsl = this.#displayColor.to('hsl');
        const [h, s, l] = hsl.hsl;
        return {
            h: nn(h),
            s: nn(s),
            l: nn(l),
        };
    }

    setHsl(channel: 'h' | 's' | 'l', value: number) {
        const [h, s, l] = this.#current.to('hsl').hsl;
        const newH = channel === 'h' ? value : nn(h);
        const newS = channel === 's' ? value : nn(s);
        const newL = channel === 'l' ? value : nn(l);
        this.#current = new Color('hsl', [newH, newS, newL], this.alpha).to('oklch');
    }

    get hslValues() {
        const [h, s, l] = this.#current.to('hsl').hsl;
        return {
            h: nn(h),
            s: nn(s),
            l: nn(l),
        };
    }

    formatColor(css: string): string {
        let parsed: Color;
        try {
            parsed = new Color(css);
        } catch {
            return css;
        }

        const alpha = parsed.alpha ?? 1;
        const mode = this.#precisionMode();

        if (this.mode === 'rgb') {
            const sr = parsed.to('srgb').srgb;
            return formatRgb(nn(sr[0]) * 255, nn(sr[1]) * 255, nn(sr[2]) * 255, alpha, mode);
        } else if (this.mode === 'hsl') {
            const [h, s, l] = parsed.to('hsl').hsl;
            return formatHsl(nn(h), nn(s) / 100, nn(l) / 100, alpha, mode);
        } else {
            const [l, c, h] = parsed.oklch;
            return formatOklch(nn(l), nn(c), nn(h), alpha, mode);
        }
    }

    display = $derived.by(() => {
        return formatOklch(this.l, this.c, this.h, this.alpha, this.#precisionMode());
    });

    hex = $derived(toHexStr(this.#displayColor));

    hexa = $derived.by(() => {
        const base = toHexStr(this.#displayColor);
        if (this.alpha < 1) {
            const alphaHex = Math.round(this.alpha * 255)
                .toString(16)
                .padStart(2, '0');
            return base + alphaHex;
        }
        return base;
    });

    rgb = $derived.by(() => {
        const sr = this.#displayColor.srgb;
        return formatRgb(
            nn(sr[0]) * 255,
            nn(sr[1]) * 255,
            nn(sr[2]) * 255,
            this.alpha,
            this.#precisionMode(),
        );
    });

    hsl = $derived.by(() => {
        const [h, s, l] = this.#displayColor.to('hsl').hsl;
        return formatHsl(nn(h), nn(s) / 100, nn(l) / 100, this.alpha, this.#precisionMode());
    });

    lab = $derived.by(() => {
        const [labL, labA, labB] = this.#current.to('lab').lab;
        return formatLab(nn(labL), nn(labA), nn(labB), this.alpha, this.#precisionMode());
    });

    oklab = $derived.by(() => {
        const [okl, oka, okb] = this.#current.to('oklab').oklab;
        return formatOklab(nn(okl), nn(oka), nn(okb), this.alpha, this.#precisionMode());
    });

    cmyk = $derived.by(() => {
        const sr = this.#displayColor.srgb;
        const r = nn(sr[0]),
            g = nn(sr[1]),
            b = nn(sr[2]);
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
        return `oklch(${this.l * 100}% ${this.c} ${this.h}${alphaStr})`;
    });

    cssVarOpaque = $derived(`oklch(${this.l * 100}% ${this.c} ${this.h})`);

    randomize() {
        this.#current = ColorStore.#getRandomColor();
    }
}
