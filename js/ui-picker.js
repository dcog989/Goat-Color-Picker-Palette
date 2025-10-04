window.GPG = window.GPG || {};
GPG.ui = GPG.ui || {};

(function (GPG) {
    'use strict';
    // --- L_r functions (Tone-Mapped Lightness) from reference app's gamut.rs ---
    const K1 = 0.206;
    const K2 = 0.03;
    const K3 = (1. + K1) / (1. + K2);
    function toe_inv(lr) {
        return (lr * (lr + K1)) / (K3 * (lr + K2));
    }
    function toe(l) {
        return 0.5 * (K3 * l - K1 + Math.sqrt((K3 * l - K1) * (K3 * l - K1) + 4. * K2 * K3 * l));
    }
    // --- End L_r functions ---

    Object.assign(GPG.ui, {
        generateHslHueTrackGradientString: function (s, l, steps = 12) {
            if (s < 1 || l <= 0 || l >= 100) {
                const grayColor = `hsl(0, 0%, ${l}%)`;
                return `linear-gradient(to right, ${grayColor}, ${grayColor})`;
            }
            let gradientStops = [];
            for (let i = 0; i <= steps; i++) {
                const hue = (i / steps) * 360;
                const hForString = (hue === 360) ? 0 : hue;
                gradientStops.push(`hsl(${Math.round(hForString)}, ${Math.round(s)}%, ${Math.round(l)}%)`);
            }
            return `linear-gradient(to right, ${gradientStops.join(", ")})`;
        },

        generateOklchHueTrackGradientString: function (l, c, steps = 12) {
            if (c < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD) {
                const grayColor = GoatColor(`oklch(${l}% 0 0)`).toRgbString();
                return `linear-gradient(to right, ${grayColor}, ${grayColor})`;
            }
            let gradientStops = [];
            for (let i = 0; i <= steps; i++) {
                const hue = (i / steps) * 360;
                const hForString = (hue === 360) ? 0 : hue;
                const color = GoatColor(`oklch(${l}% ${c.toFixed(4)} ${Math.round(hForString)})`);
                if (color.isValid()) {
                    gradientStops.push(`${color.toRgbString()} ${(i / steps) * 100}%`);
                } else {
                    gradientStops.push(`rgb(128,128,128) ${(i / steps) * 100}%`);
                }
            }
            return `linear-gradient(to right, ${gradientStops.join(", ")})`;
        },

        updateAllSliderBackgrounds: function () {
            const root = document.documentElement;
            const masterColor = GPG.state.currentGoatColor;

            const fallbackRainbow = "linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(0 100% 50%))";
            const neutralGrayVar = "linear-gradient(to right, #777, #777)";

            if (!masterColor || !masterColor.isValid()) {
                root.style.setProperty("--background-image-slider-track-hsl-h", fallbackRainbow);
                root.style.setProperty("--background-image-slider-track-saturation", neutralGrayVar);
                root.style.setProperty("--background-image-slider-track-lightness", neutralGrayVar);
                root.style.setProperty("--background-image-slider-track-oklch-l", neutralGrayVar);
                root.style.setProperty("--background-image-slider-track-oklch-c", neutralGrayVar);
                root.style.setProperty("--background-image-slider-track-oklch-h", neutralGrayVar);
                return;
            }

            // HSL Sliders
            const h_hsl = parseFloat(GPG.elements.pickerInput1.value);
            const s_hsl = parseFloat(GPG.elements.pickerInput2.value);
            const l_hsl = parseFloat(GPG.elements.pickerInput3.value);
            if (!isNaN(h_hsl) && !isNaN(s_hsl) && !isNaN(l_hsl)) {
                const isAchromatic = s_hsl < 1 || l_hsl <= 0 || l_hsl >= 100;
                const stable_h_hsl = isAchromatic ? GPG.state.lastHslHue : h_hsl;
                const saturationForTracks = isAchromatic ? 0 : s_hsl;

                const hTrackGradientHsl = this.generateHslHueTrackGradientString(s_hsl, l_hsl);
                root.style.setProperty("--background-image-slider-track-hsl-h", hTrackGradientHsl);
                root.style.setProperty("--background-image-slider-track-saturation", `linear-gradient(to right, hsl(${stable_h_hsl}, 0%, ${l_hsl}%) 0%, hsl(${stable_h_hsl}, 100%, ${l_hsl}%) 100%)`);
                root.style.setProperty("--background-image-slider-track-lightness", `linear-gradient(to right, hsl(${stable_h_hsl}, ${saturationForTracks}%, 0%) 0%, hsl(${stable_h_hsl}, ${saturationForTracks}%, 50%) 50%, hsl(${stable_h_hsl}, ${saturationForTracks}%, 100%) 100%)`);
            }

            // OKLCH Sliders
            const masterOklch = masterColor.toOklch();
            const c_percent_oklch = parseFloat(GPG.elements.pickerInput2.value);
            const h_oklch = parseFloat(GPG.elements.pickerInput1.value);

            // L_r is the value in the input field
            const lr_oklch_percent = parseFloat(GPG.elements.pickerInput3.value);

            if (!isNaN(c_percent_oklch) && !isNaN(h_oklch) && !isNaN(lr_oklch_percent)) {
                const stable_h_oklch = GPG.state.lastOklchHue;
                const current_abs_c = masterOklch.c;

                // Calculate the actual Oklab Lightness (L) from the current Lr (L-slider value)
                const current_l_oklab = toe_inv(lr_oklch_percent / 100) * 100;


                // --- OKLCH Lr-Slider Background (Tone-Mapped Track) ---
                const target_abs_c_for_gradient = (c_percent_oklch / 100) * GoatColor.getMaxSRGBChroma(50, stable_h_oklch, GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE);

                const LrStops = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
                const LrColors = LrStops.map(lr_percent => {
                    const l = toe_inv(lr_percent / 100) * 100;
                    return GoatColor(`oklch(${l}% ${target_abs_c_for_gradient} ${stable_h_oklch})`).toRgbString();
                });
                const gradient = `linear-gradient(to right, ${LrColors.map((c, i) => `${c} ${LrStops[i]}%`).join(', ')})`;

                root.style.setProperty("--background-image-slider-track-oklch-l", gradient);

                GPG.state.diag.sliderGradient = {
                    minL: 0, maxL: 100, // Lr is 0-100%
                    stops: LrColors
                };


                // --- OKLCH C-Slider Background (Dynamic Max Chroma Track) ---
                const l_oklch_for_c = current_l_oklab; // Use the *actual* L derived from Lr
                const stable_h_for_c = stable_h_oklch;
                if (!isNaN(l_oklch_for_c)) {
                    const cTrackStart = `oklch(${l_oklch_for_c}% 0 ${stable_h_for_c})`;
                    // Find the actual sRGB gamut maximum Chroma for this L and H
                    const max_c_for_c_track = GoatColor.getMaxSRGBChroma(l_oklch_for_c, stable_h_for_c, GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE);
                    const cTrackEnd = `oklch(${l_oklch_for_c}% ${max_c_for_c_track.toFixed(4)} ${stable_h_for_c})`;
                    root.style.setProperty("--background-image-slider-track-oklch-c", `linear-gradient(to right, ${cTrackStart}, ${cTrackEnd})`);
                }

                // --- OKLCH H-Slider Background ---
                // The H-slider should use the actual L and the final clipped C.
                const hTrackGradientOklch = this.generateOklchHueTrackGradientString(masterOklch.l, current_abs_c);
                root.style.setProperty("--background-image-slider-track-oklch-h", hTrackGradientOklch);
            }


            // Opacity slider (common to both)
            const masterRgb = masterColor.toRgb();
            const opacityGradient = `linear-gradient(to right, rgba(${masterRgb.r},${masterRgb.g},${masterRgb.b},0) 0%, rgba(${masterRgb.r},${masterRgb.g},${masterRgb.b},1) 100%)`;
            root.style.setProperty("--background-image-slider-track-opacity", opacityGradient);
        },

        updateDynamicSliderThumbStyles: function () {
            const rootStyle = document.documentElement.style;

            if (!GPG.state.currentGoatColor || !GPG.state.currentGoatColor.isValid()) {
                rootStyle.removeProperty('--color-bg-slider-thumb');
                rootStyle.removeProperty('--color-border-slider-thumb');
                return;
            }

            const opaqueBaseColorForThumb = GoatColor(GPG.state.currentGoatColor.toHex());
            if (!opaqueBaseColorForThumb.isValid()) {
                rootStyle.removeProperty('--color-bg-slider-thumb');
                rootStyle.removeProperty('--color-border-slider-thumb');
                return;
            }

            const thumbBgColorString = opaqueBaseColorForThumb.toRgbaString();
            rootStyle.setProperty('--color-bg-slider-thumb', thumbBgColorString);

            const originalHsl = GPG.state.currentGoatColor.toHsl();
            const baseHueForBorder = Math.round(originalHsl.h);
            const borderSaturation = originalHsl.s < 5 ? 10 : Math.max(30, Math.min(originalHsl.s, 75));
            let chosenBorderColorString;
            const thumbBgHsl = opaqueBaseColorForThumb.toHsl();
            const l_darker_border_val = Math.max(5, thumbBgHsl.l - 30);
            const l_lighter_border_val = Math.min(95, thumbBgHsl.l + 30);
            const darkBorderCandidate = GoatColor(`hsl(${baseHueForBorder}, ${borderSaturation}%, ${l_darker_border_val}%)`);
            const lightBorderCandidate = GoatColor(`hsl(${baseHueForBorder}, ${borderSaturation}%, ${l_lighter_border_val}%)`);
            const fallbackDarkGray = 'hsl(0, 0%, 25%)';
            const fallbackLightGray = 'hsl(0, 0%, 75%)';
            let fallbackBorder = thumbBgHsl.l > 50 ? fallbackDarkGray : fallbackLightGray;

            if (typeof GoatColor.getContrastRatio !== 'function') {
                chosenBorderColorString = fallbackBorder;
            } else {
                let primaryCandidate, secondaryCandidate;
                let primaryContrast = 0,
                    secondaryContrast = 0;

                if (thumbBgHsl.l >= 50) {
                    primaryCandidate = darkBorderCandidate;
                    secondaryCandidate = lightBorderCandidate;
                } else {
                    primaryCandidate = lightBorderCandidate;
                    secondaryCandidate = darkBorderCandidate;
                }

                if (primaryCandidate.isValid()) {
                    primaryContrast = GoatColor.getContrastRatio(primaryCandidate, opaqueBaseColorForThumb);
                }
                if (secondaryCandidate.isValid()) {
                    secondaryContrast = GoatColor.getContrastRatio(secondaryCandidate, opaqueBaseColorForThumb);
                }

                const CONTRAST_THRESHOLD_BORDER = 1.5;

                if (primaryCandidate.isValid() && primaryContrast >= CONTRAST_THRESHOLD_BORDER) {
                    chosenBorderColorString = primaryCandidate.toRgbaString();
                } else if (secondaryCandidate.isValid() && secondaryContrast >= CONTRAST_THRESHOLD_BORDER) {
                    chosenBorderColorString = secondaryCandidate.toRgbaString();
                } else {
                    if (primaryCandidate.isValid() && secondaryCandidate.isValid()) {
                        chosenBorderColorString = (primaryContrast >= secondaryContrast) ? primaryCandidate.toRgbaString() : secondaryCandidate.toRgbaString();
                    } else if (primaryCandidate.isValid()) {
                        chosenBorderColorString = primaryCandidate.toRgbaString();
                    } else if (secondaryCandidate.isValid()) {
                        chosenBorderColorString = secondaryCandidate.toRgbaString();
                    } else {
                        chosenBorderColorString = fallbackBorder;
                    }
                }
            }
            rootStyle.setProperty('--color-border-slider-thumb', chosenBorderColorString);
        },

        updateOklchHueSliderState: function (oklchCPercent, oklchL, oklchH_displayValue) {
            let cAbsolute;
            let lForMaxChroma = parseFloat(oklchL);
            if (isNaN(lForMaxChroma) && GPG.state.currentGoatColor && GPG.state.currentGoatColor.isValid()) {
                lForMaxChroma = GPG.state.currentGoatColor.toOklch().l;
            } else if (isNaN(lForMaxChroma)) {
                lForMaxChroma = 50;
            }

            let hForMaxChroma = GPG.utils.normalizeHueForDisplay(oklchH_displayValue);

            if (typeof GoatColor.getMaxSRGBChroma === "function") {
                const maxC = GoatColor.getMaxSRGBChroma(lForMaxChroma, hForMaxChroma, GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE);
                cAbsolute = (oklchCPercent / 100) * maxC;
            } else {
                cAbsolute = (oklchCPercent / 100) * GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE;
            }

            const isDisabled = cAbsolute < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD;
            const tooltipText = "Hue is not applicable when Chroma is zero.";

            GPG.elements.pickerSlider1.disabled = isDisabled;
            GPG.elements.pickerInput1.disabled = isDisabled;

            if (isDisabled) {
                GPG.elements.pickerGroup1.classList.add('disabled-control');
                GPG.elements.pickerSlider1.title = tooltipText;
                GPG.elements.pickerInput1.title = tooltipText;
            } else {
                GPG.elements.pickerGroup1.classList.remove('disabled-control');
                GPG.elements.pickerSlider1.title = "";
                GPG.elements.pickerInput1.title = "";
            }

            GPG.ui.updateUiElementValue(GPG.elements.pickerSlider1, oklchH_displayValue);
            GPG.ui.updateUiElementValue(GPG.elements.pickerInput1, oklchH_displayValue);
        },

        updatePickerControls: function (mode) {
            const {
                pickerLabel1, pickerSlider1, pickerInput1, pickerUnit1,
                pickerLabel2, pickerSlider2, pickerInput2, pickerUnit2,
                pickerLabel3, pickerSlider3, pickerInput3, pickerUnit3,
                pickerGroup1, pickerGroup2, pickerGroup3, pickerOpacityGroup
            } = GPG.elements;

            const controlsContainer = pickerGroup1.parentElement;
            const titleChroma = "Chroma (colorfulness percentage relative to a typical sRGB maximum). Maximum achievable actual chroma changes with Lightness and Hue.";

            if (mode === 'hsl') {
                // Order: H, S, L
                controlsContainer.appendChild(pickerGroup1);
                controlsContainer.appendChild(pickerGroup2);
                controlsContainer.appendChild(pickerGroup3);

                // Group 1 -> Hue
                pickerLabel1.textContent = "Hue:"; pickerLabel1.htmlFor = 'picker-slider-1';
                pickerSlider1.className = 'hue-slider';
                pickerSlider1.min = 0; pickerSlider1.max = 360; pickerSlider1.step = 1;
                pickerInput1.min = 0; pickerInput1.max = 360; pickerInput1.step = 1;
                pickerUnit1.textContent = '°';

                // Group 2 -> Saturation
                pickerLabel2.textContent = "Saturation:"; pickerLabel2.htmlFor = 'picker-slider-2';
                pickerSlider2.className = 'saturation-slider';
                pickerSlider2.min = 0; pickerSlider2.max = 100; pickerSlider2.step = 1;
                pickerInput2.min = 0; pickerInput2.max = 100; pickerInput2.step = 1;
                pickerUnit2.textContent = '%';
                pickerSlider2.title = ""; pickerInput2.title = "";

                // Group 3 -> Lightness
                pickerLabel3.textContent = "Lightness:"; pickerLabel3.htmlFor = 'picker-slider-3';
                pickerSlider3.className = 'lightness-slider';
                pickerSlider3.min = 0; pickerSlider3.max = 100; pickerSlider3.step = 1;
                pickerInput3.min = 0; pickerInput3.max = 100; pickerInput3.step = 1;
                pickerUnit3.textContent = '%';

                pickerGroup1.classList.remove('disabled-control');
                pickerSlider1.disabled = false;
                pickerInput1.disabled = false;
                pickerSlider1.title = "";
            } else { // oklch
                // Order: Lr, C, H
                controlsContainer.appendChild(pickerGroup3);
                controlsContainer.appendChild(pickerGroup2);
                controlsContainer.appendChild(pickerGroup1);

                // Group 3 -> Lightness (Lr)
                pickerLabel3.textContent = "Lr:"; pickerLabel3.htmlFor = 'picker-slider-3';
                pickerSlider3.className = 'oklch-l-slider';
                pickerSlider3.min = 0; pickerSlider3.max = 100; pickerSlider3.step = 0.1;
                pickerInput3.min = 0; pickerInput3.max = 100; pickerInput3.step = 0.1;
                pickerUnit3.textContent = '%';

                // Group 2 -> Chroma
                pickerLabel2.textContent = "Chroma:"; pickerLabel2.htmlFor = 'picker-slider-2';
                pickerSlider2.className = 'oklch-c-slider';
                pickerSlider2.min = 0; pickerSlider2.max = 100; pickerSlider2.step = 0.1;
                pickerInput2.min = 0; pickerInput2.max = 100; pickerInput2.step = 0.1;
                pickerUnit2.textContent = '%';
                pickerSlider2.title = titleChroma; pickerInput2.title = titleChroma;

                // Group 1 -> Hue
                pickerLabel1.textContent = "Hue:"; pickerLabel1.htmlFor = 'picker-slider-1';
                pickerSlider1.className = 'oklch-h-slider';
                pickerSlider1.min = 0; pickerSlider1.max = 360; pickerSlider1.step = 1;
                pickerInput1.min = 0; pickerInput1.max = 360; pickerInput1.step = 1;
                pickerUnit1.textContent = '°';
            }
            // Always ensure the opacity slider is last.
            controlsContainer.appendChild(pickerOpacityGroup);
        }

    });
}(window.GPG));