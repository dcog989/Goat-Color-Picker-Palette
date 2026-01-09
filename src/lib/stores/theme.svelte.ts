export type ThemeMode = 'light' | 'dark';

export class ThemeStore {
    current = $state<ThemeMode>('light');
    #initialized = false;

    init() {
        if (this.#initialized) return;
        this.#initialized = true;

        const stored = localStorage.getItem('theme') as ThemeMode | null;
        if (stored === 'light' || stored === 'dark') {
            this.current = stored;
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.current = 'dark';
        }

        this.#apply();
    }

    toggle() {
        this.current = this.current === 'light' ? 'dark' : 'light';
        this.#apply();
        localStorage.setItem('theme', this.current);
    }

    #apply() {
        if (typeof document === 'undefined') return;

        // Remove both to prevent conflicts
        document.documentElement.classList.remove('light', 'dark');

        // Explicitly add the current theme class
        // This ensures proper overrides against CSS media queries
        document.documentElement.classList.add(this.current);

        document.documentElement.style.colorScheme = this.current;
    }
}
