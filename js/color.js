window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    function findCusp(h) {
        // Find the cusp by creating an out-of-gamut color with high chroma
        // and letting the library's clipping bring it back to the gamut edge.
        const cuspColor = GoatColor(`oklch(60% 0.5 ${h})`);
        return cuspColor.toOklch();
    }

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
                let l_slider = p3, c_percent = p2, h_from_slider = p1;

                let hue_for_calc = GPG.state.lastOklchHue;
                if (options.param === 'h' || (options.param === 'c' && c_percent > 0.1)) {
                    GPG.state.lastOklchHue = h_from_slider;
                    hue_for_calc = h_from_slider;
                }

                let final_l = l_slider;
                let final_c;

                const cusp = findCusp(hue_for_calc);
                let max_c_at_L;

                if (l_slider < cusp.l) {
                    max_c_at_L = cusp.l > 0 ? (l_slider / cusp.l) * cusp.c : 0;
                } else {
                    max_c_at_L = (100 - cusp.l) > 0.01 ? ((100 - l_slider) / (100 - cusp.l)) * cusp.c : 0;
                }

                final_c = (c_percent / 100) * max_c_at_L;

                if (final_c < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD) {
                    final_c = 0;
                }

                return GoatColor(`oklch(${final_l}% ${final_c.toFixed(8)} ${hue_for_calc} / ${opacityPercent / 100})`);
            }
        }
    };
}(window.GPG));