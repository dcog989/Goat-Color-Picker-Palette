// Lazy-loaded color name list to improve initial bundle size
// Uses the 'short' subset (~3k entries, ~112KB) instead of the full ~32k entry list

import type { ColorName } from 'color-name-list/short';

let cachedList: ColorName[] | null = null;
let loadPromise: Promise<ColorName[]> | null = null;

/**
 * Load color names dynamically
 * @returns Promise that resolves to the color name list
 */
export async function loadColorNames(): Promise<ColorName[]> {
    if (cachedList !== null) {
        return cachedList;
    }

    if (loadPromise !== null) {
        return loadPromise;
    }

    loadPromise = (async () => {
        try {
            const { colornames } = (await import('color-name-list/short')) as unknown as {
                colornames: ColorName[];
            };
            cachedList = colornames;
            return colornames;
        } catch (error) {
            console.error('Failed to load color-name-list:', error);
            loadPromise = null;
            throw error;
        }
    })();

    return loadPromise;
}
