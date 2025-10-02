window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    GPG.color = {
        /**
         * Creates a GoatColor instance from picker values, handling mode-specific logic.
         * @param {string} mode - 'hsl' or 'oklch'.
         * @param {number} p1 - Hue (HSL/OKLCH).
         * @param {number} p2 - Saturation (HSL) or Chroma % (OKLCH).
         * @param {number} p3 - Lightness (HSL/OKLCH).
         * @param {number} opacityPercent - Opacity from 0 to 100.
         * @param {object} [options={}] - Additional options.
         * @param {string} [options.param] - The specific UI parameter being changed ('l', 'c', 'h').
         * @returns {GoatColor} A valid GoatColor instance.
         */
        createFromPicker: function (mode, p1, p2, p3, opacityPercent, options = {}) {
            if (mode === 'hsl') {
                let h = p1, s = p2, l = p3;
                if (s > 0) {
                    GPG.state.lastHslHue = h;
                } else {
                    h = GPG.state.lastHslHue; // Use last saved hue if saturation is zero
                }
                return GoatColor(`hsla(${h}, ${s}%, ${l}%, ${opacityPercent / 100})`);
            } else { // oklch
                let l = p3, cPercent = p2, h = p1;
                cPercent = Math.max(0, Math.min(100, cPercent));

                // Always calculate absolute chroma from the UI percentage and the current L and H.
                // This prevents creating colors far outside the sRGB gamut when L or H change,
                // which was causing erratic slider behavior due to severe gamut clipping.
                const maxAbsC = GoatColor.getMaxSRGBChroma(l, h, GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE);
                const cAbsolute = (cPercent / 100) * maxAbsC;

                let hueForCreation = h;
                if (cAbsolute < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD) {
                    hueForCreation = GPG.state.lastOklchHue; // Use last hue if chroma is effectively zero
                } else {
                    // Only update last hue from UI if chromatic
                    // This prevents achromatic colors from resetting the stored hue
                }
                return GoatColor(`oklch(${l}% ${cAbsolute.toFixed(4)} ${hueForCreation} / ${opacityPercent / 100})`);
            }
        }
    };
}(window.GPG));