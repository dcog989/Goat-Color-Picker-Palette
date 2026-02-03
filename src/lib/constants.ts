// Design Tokens and Constants for Goat Color

// Image Analysis Constants
export const IMAGE_ANALYSIS = {
    DOWNSAMPLE_SIZE: 256, // Optimized: ~65k pixels matches worker sampling target
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

// Display Precision
export const PRECISION = {
    OKLCH_L_DISPLAY: 1, // 1 decimal place for lightness percentage (e.g. 77.7%)
    OKLCH_C_DISPLAY: 4, // 4 decimal places for chroma in precise mode (e.g. 0.1181)
    OKLCH_H_DISPLAY: 1, // 1 decimal place for hue in precise mode (e.g. 259.2)
    CONTRAST_DISPLAY: 0, // Whole numbers for contrast ratios
} as const;

// Export dimensions
export const EXPORT = {
    PNG_WIDTH: 1200,
    PNG_HEIGHT: 630,
    SVG_SIZE: 400,
} as const;
