import { converter, parse, type Oklch } from 'culori/fn';
import { PAINTBOX } from '../constants';

type SavedColor = { id: string; css: string; timestamp: number };
export type PaintboxSortMode = 'recent' | 'hue' | 'lightness' | 'chroma';

const toOklch = converter<Oklch>('oklch');

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
                    this.#colors = parsed.filter(
                        (item) =>
                            item &&
                            typeof item === 'object' &&
                            typeof item.id === 'string' &&
                            typeof item.css === 'string' &&
                            typeof item.timestamp === 'number',
                    );
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

    // Convert a CSS color string to Oklch for sorting
    #getOklch(css: string): Oklch {
        const parsed = parse(css);
        return (parsed ? toOklch(parsed) : undefined) || { mode: 'oklch', l: 0, c: 0, h: 0 };
    }

    get items() {
        const list = [...this.#colors];

        switch (this.sortMode) {
            case 'hue':
                return list.sort(
                    (a, b) => (this.#getOklch(a.css).h || 0) - (this.#getOklch(b.css).h || 0),
                );
            case 'lightness':
                return list.sort((a, b) => this.#getOklch(b.css).l - this.#getOklch(a.css).l); // Brightest first
            case 'chroma':
                return list.sort((a, b) => this.#getOklch(b.css).c - this.#getOklch(a.css).c); // Most colorful first
            case 'recent':
            default:
                // Newest first
                return list.sort((a, b) => b.timestamp - a.timestamp);
        }
    }

    add(css: string) {
        if (!this.#initialized) this.init();

        // Remove if exists (to bump to top/update)
        const existingIndex = this.#colors.findIndex((c) => c.css === css);
        if (existingIndex !== -1) {
            this.#colors.splice(existingIndex, 1);
        }

        this.#colors.push({
            id: crypto.randomUUID(),
            css,
            timestamp: Date.now(),
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
