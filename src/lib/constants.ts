// Design Tokens and Constants for Goat Color

// Image Analysis Constants
export const IMAGE_ANALYSIS = {
    DOWNSAMPLE_SIZE: 256, // Optimized: ~65k pixels matches worker sampling target
    DEFAULT_CLUSTERS: 8,
    MAX_ITERATIONS: 10,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
        'image/gif',
        'image/bmp',
        'image/svg+xml',
    ],
} as const;

// Paintbox Constants
export const PAINTBOX = {
    MAX_COLORS: 24,
    STORAGE_KEY: 'paintbox',
} as const;

// Color Name Matching Constants
export const COLOR_NAMES = {
    SAMPLING_STRIDE: 40, // Check every 40th name for performance
} as const;

// Palette Generator Constants
export const GENERATOR = {
    DEFAULT_STEPS: 9,
    MIN_STEPS: 2,
    MAX_STEPS: 20,
} as const;

// Display Precision
export const PRECISION = {
    OKLCH_L_DISPLAY: 1, // 1 decimal place for lightness percentage (e.g. 77.7%)
    OKLCH_C_DISPLAY: 4, // 4 decimal places for chroma in precise mode (e.g. 0.1181)
    OKLCH_H_DISPLAY: 1, // 1 decimal place for hue in precise mode (e.g. 259.2)
    CONTRAST_DISPLAY: 0, // Whole numbers for contrast ratios
} as const;

// Animation Durations (in ms)
export const ANIMATION = {
    FAST: 150,
    BASE: 300,
    SLOW: 500,
} as const;

// Border Radius Scale
export const RADIUS = {
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    XL: '2rem',
    '2XL': '2.5rem',
    '3XL': '3rem',
    FULL: '9999px',
} as const;

// Spacing Scale
export const SPACE = {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    XL: '2rem',
    '2XL': '3rem',
    '3XL': '4rem',
} as const;

// Typography Scale
export const TEXT = {
    XS: '0.625rem',
    SM: '0.75rem',
    BASE: '1rem',
    LG: '1.25rem',
    XL: '1.5rem',
    '2XL': '2rem',
    '3XL': '3rem',
} as const;

// Export dimensions
export const EXPORT = {
    PNG_WIDTH: 1200,
    PNG_HEIGHT: 630,
    SVG_SIZE: 400,
} as const;
