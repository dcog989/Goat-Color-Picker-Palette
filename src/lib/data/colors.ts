// Lazy-loaded color name list to improve initial bundle size
// The color-name-list package contains ~30k color entries (~500KB)
// This module provides both synchronous (cached) and asynchronous (dynamic import) access

import type { ColorName } from 'color-name-list';

let cachedList: ColorName[] | null = null;
let loadPromise: Promise<ColorName[]> | null = null;

/**
 * Type guard to check if value is an array of ColorName objects
 */
function isColorNameArray(value: unknown): value is ColorName[] {
    return Array.isArray(value) && 
           value.length > 0 && 
           typeof value[0] === 'object' &&
           'name' in value[0] && 
           'hex' in value[0];
}

/**
 * Extract color name array from dynamic import with proper type checking
 */
function extractColorList(source: unknown): ColorName[] {
    // Direct array export
    if (isColorNameArray(source)) {
        return source;
    }
    
    // Default export (CJS/ESM interop)
    if (source && typeof source === 'object' && 'default' in source) {
        const defaultExport = (source as { default: unknown }).default;
        if (isColorNameArray(defaultExport)) {
            return defaultExport;
        }
    }
    
    // Module object with array values
    if (source && typeof source === 'object') {
        const values = Object.values(source);
        const candidate = values.find(v => isColorNameArray(v) && v.length > 1000);
        if (candidate && isColorNameArray(candidate)) {
            return candidate;
        }
    }
    
    // Fallback to empty array if no valid data found
    console.warn('Could not extract color name list from source');
    return [];
}

/**
 * Load color names dynamically
 * @returns Promise that resolves to the color name list
 */
export async function loadColorNames(): Promise<ColorName[]> {
    // Return cached list if already loaded
    if (cachedList !== null) {
        return cachedList;
    }
    
    // Return existing promise if already loading
    if (loadPromise !== null) {
        return loadPromise;
    }
    
    // Start loading
    loadPromise = (async () => {
        try {
            const source = await import('color-name-list');
            const list = extractColorList(source);
            
            if (list.length === 0) {
                throw new Error('No color data found in imported module');
            }
            
            cachedList = list;
            return list;
        } catch (error) {
            console.error('Failed to load color-name-list:', error);
            loadPromise = null; // Reset so it can be retried
            throw error;
        }
    })();
    
    return loadPromise;
}

/**
 * Get the cached color name list (synchronous)
 * Returns empty array if not yet loaded
 * Use loadColorNames() to load asynchronously first
 */
export const colorNameList: ColorName[] = [];

/**
 * Check if color names are loaded
 */
export function isColorNamesLoaded(): boolean {
    return cachedList !== null;
}

/**
 * Get the current cached list (may be null if not loaded)
 */
export function getCachedColorNames(): ColorName[] | null {
    return cachedList;
}
