window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    GPG.APP_VERSION = "1.2.0";
    GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE = 0.4;
    GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD = 0.005;
    GPG.SVG_COPY_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
</svg>`;
    GPG.SVG_COPIED_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
</svg>`;
    GPG.PAINTBOX_ROWS = 3;
    GPG.PAINTBOX_COLS = 5;
    GPG.MONOCHROMATIC_PALETTE_SIZE = 5;
    GPG.PAINTBOX_MAX_SWATCHES = 44;

    GPG.PALETTE_VARY_PARAMS = {
        hsl: [
            { value: 'hue', text: 'Hue', equivalent: 'oklch_h', isHue: true },
            { value: 'saturation', text: 'Saturation', equivalent: 'oklch_c' },
            { value: 'lightness', text: 'Lightness', equivalent: 'oklch_l' },
            { value: 'opacity', text: 'Alpha', equivalent: 'opacity' }
        ],
        oklch: [
            { value: 'oklch_l', text: 'Lightness', equivalent: 'lightness' },
            { value: 'oklch_c', text: 'Chroma', equivalent: 'saturation' },
            { value: 'oklch_h', text: 'Hue', equivalent: 'hue', isHue: true },
            { value: 'opacity', text: 'Alpha', equivalent: 'opacity' }
        ]
    };

    GPG.PALETTE_GENERATOR_RANGES = {
        lightness: { min: 10, range: 80 }, // Generates lightness from 10% to 90%
        chroma: { min: 5, range: 95 }      // Generates chroma % from 5% to 100%
    };

}(window.GPG));