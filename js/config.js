window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    GPG.APP_VERSION = "1.2.1";
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

    GPG.DIAG_MATRICES = {
        OKLAB_LAB_TO_LMS_P_MATRIX: [
            [1.0, 0.3963377773761749, 0.2158037573099136],
            [1.0, -0.1055613458156586, -0.0638541728258133],
            [1.0, -0.0894841775298119, -1.2914855480194092],
        ],
        OKLAB_LMS_CUBED_TO_XYZ_MATRIX: [
            [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
            [-0.0405757452148008, 1.1122868032803170, -0.0717110580655164],
            [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
        ],
        XYZ_TO_SRGB_MATRIX: [
            [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
            [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
            [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
        ]
    };

}(window.GPG));