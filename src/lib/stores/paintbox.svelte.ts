import { converter, parse, type Oklch } from 'culori/fn';
import { PAINTBOX } from '../constants';

type SavedColor = { id: string; css: string; timestamp: number; oklch: Oklch };
export type PaintboxSortMode = 'recent' | 'hue' | 'lightness' | 'chroma';

const toOklch = converter<Oklch>('oklch');
const DEFAULT_OKLCH: Oklch = { mode: 'oklch', l: 0, c: 0, h: 0 };

export class PaintboxStore {
    #colors = $state<SavedColor[]>([]);
    #initialized = false;
    sortMode = $state<PaintboxSortMode>('recent');

    constructor() {
        // Defer loading to init()
    }

    init() {
        if (this.#initialized) return;
        this.#initialized = true;
        this.#loadFromStorage();

        $effect(() => {
            if (this.#initialized) {
                this.#saveToStorage();
            }
        });
    }

    #loadFromStorage() {
        try {
            const stored = localStorage.getItem(PAINTBOX.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    this.#colors = parsed
                        .filter(
                            (item) =>
                                item &&
                                typeof item === 'object' &&
                                typeof item.id === 'string' &&
                                typeof item.css === 'string' &&
                                typeof item.timestamp === 'number',
                        )
                        .map((item) => this.#ensureOklch(item));
                } else {
                    this.#colors = [];
                }
            }
        } catch (e) {
            console.error('Failed to load paintbox data:', e);
            this.#colors = [];
            try {
                localStorage.removeItem(PAINTBOX.STORAGE_KEY);
            } catch {
                /* Storage removal failed, continue */
            }
        }
    }

    #saveToStorage() {
        try {
            localStorage.setItem(PAINTBOX.STORAGE_KEY, JSON.stringify(this.#colors));
        } catch (e) {
            console.error('Failed to save paintbox data:', e);
            if (e instanceof Error && e.name === 'QuotaExceededError' && this.#colors.length > 0) {
                this.#colors = this.#colors.slice(0, Math.floor(this.#colors.length / 2));
                try {
                    localStorage.setItem(PAINTBOX.STORAGE_KEY, JSON.stringify(this.#colors));
                } catch {
                    /* Storage write failed, already logged */
                }
            }
        }
    }

    #ensureOklch(item: Partial<SavedColor>): SavedColor {
        if (item.oklch) {
            return item as SavedColor;
        }
        const parsed = parse(item.css!);
        const oklch = (parsed ? toOklch(parsed) : undefined) || DEFAULT_OKLCH;
        return { ...item, oklch } as SavedColor;
    }

    get items() {
        const list = [...this.#colors];

        switch (this.sortMode) {
            case 'hue':
                return list.sort((a, b) => (a.oklch.h || 0) - (b.oklch.h || 0));
            case 'lightness':
                return list.sort((a, b) => b.oklch.l - a.oklch.l);
            case 'chroma':
                return list.sort((a, b) => b.oklch.c - a.oklch.c);
            case 'recent':
            default:
                return list.sort((a, b) => b.timestamp - a.timestamp);
        }
    }

    add(css: string) {
        if (!this.#initialized) this.init();

        const existingIndex = this.#colors.findIndex((c) => c.css === css);
        if (existingIndex !== -1) {
            this.#colors.splice(existingIndex, 1);
        }

        const parsed = parse(css);
        const oklch = (parsed ? toOklch(parsed) : undefined) || DEFAULT_OKLCH;

        this.#colors.push({
            id: crypto.randomUUID(),
            css,
            timestamp: Date.now(),
            oklch,
        });

        if (this.#colors.length > PAINTBOX.MAX_COLORS) {
            this.#colors = this.#colors.slice(-PAINTBOX.MAX_COLORS);
        }
    }

    remove(id: string) {
        if (!this.#initialized) this.init();
        this.#colors = this.#colors.filter((c) => c.id !== id);
    }

    clear() {
        if (!this.#initialized) this.init();
        this.#colors = [];
    }
}
