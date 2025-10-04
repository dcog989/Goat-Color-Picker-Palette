window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    // --- L_r functions (Tone-Mapped Lightness) from reference app's gamut.rs ---
    // Assuming these exist in GoatColor or are local/global helpers.
    // For this update, we will treat the L_slider value as L_r, but use L as the final color's L.
    // NOTE: This is a placeholder until GoatColorToolbox.js is updated with toe/toe_inv.
    // Assuming L_slider = L_r, and GoatColor uses L.

    const K1 = 0.206;
    const K2 = 0.03;
    const K3 = (1. + K1) / (1. + K2);

    /** L_r to L (inverse toe function) */
    function toe_inv(lr) {
        return (lr * (lr + K1)) / (K3 * (lr + K2));
    }

    /** L to L_r (toe function) */
    function toe(l) {
        return 0.5 * (K3 * l - K1 + Math.sqrt((K3 * l - K1) * (K3 * l - K1) + 4. * K2 * K3 * l));
    }
    // --- End L_r functions ---

    GPG.color = {
        /**
         * Creates a GoatColor instance from picker values, handling mode-specific logic.
         * @param {string} mode - 'hsl' or 'oklch'.
         * @param {number} p1 - Hue (HSL/OKLCH).
         * @param {number} p2 - Saturation (HSL) or Chroma % (OKLCH).
         * @param {number} p3 - Lightness (HSL) or Lr % (OKLCH).
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
                let lr_slider = p3, c_percent = p2, h_from_slider = p1;

                let hue_for_calc = GPG.state.lastOklchHue;
                if (options.param === 'h' || (options.param === 'c' && c_percent > 0.1)) {
                    GPG.state.lastOklchHue = h_from_slider;
                    hue_for_calc = h_from_slider;
                }

                // 1. Convert Lr_slider (0-100%) to Oklab Lightness L (0-100%)
                let final_l_lr = lr_slider;
                let final_l = toe_inv(final_l_lr / 100) * 100;

                // 2. Map user's 0-100% Chroma to target ABSOLUTE chroma (based on max at L=50)
                const max_c_at_L_ref = GoatColor.getMaxSRGBChroma(50, hue_for_calc, GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE);
                let final_c = (c_percent / 100) * max_c_at_L_ref;

                if (final_c < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD) {
                    final_c = 0;
                }

                // 3. GoatColor constructor will now apply a gamut clip (chroma reduction) if needed,
                // preserving the L and H from the created color string.
                const newColor = GoatColor(`oklch(${final_l}% ${final_c.toFixed(8)} ${hue_for_calc} / ${opacityPercent / 100})`);

                // --- Diagnostics Update (Simplified for Lr) ---
                GPG.state.diag.createFromPicker = {
                    l_slider: lr_slider,
                    c_percent: c_percent,
                    target_chroma: final_c.toFixed(5),
                    minL: "N/A (Lr mode)",
                    maxL: "N/A (Lr mode)",
                    path: "Lr mode",
                    final_l: newColor.isValid() ? newColor.toOklch().l.toFixed(1) : "N/A",
                    final_c: newColor.isValid() ? newColor.toOklch().c.toFixed(5) : "N/A"
                };
                // --- End Diagnostics Update ---

                return newColor;
            }
        }
    };
}(window.GPG));