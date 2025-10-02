window.GPG = window.GPG || {};
GPG.ui = GPG.ui || {};

(function (GPG) {
    'use strict';
    function _updateCssVariables(opaqueBaseColor) {
        if (!opaqueBaseColor.isValid()) return;

        const baseHsl = opaqueBaseColor.toHsl();
        const roundedS = Math.round(baseHsl.s);
        const roundedL = Math.round(baseHsl.l);
        const isAchromatic = roundedS === 0 || roundedL === 0 || roundedL === 100;
        let hueForCssVars = isAchromatic ? GPG.state.lastHslHue : Math.round(baseHsl.h);
        const buttonSaturation = isAchromatic ? 0 : 90;

        const rootStyle = document.documentElement.style;
        rootStyle.setProperty("--animation-base-hue", `${hueForCssVars}deg`);
        rootStyle.setProperty("--animation-base-saturation", `${roundedS}%`);
        rootStyle.setProperty("--animation-base-lightness", `${roundedL}%`);
        rootStyle.setProperty("--button-saturation", `${buttonSaturation}%`);

        // --- Accent Color Logic ---
        const accentHue = baseHsl.h;
        const accentSat = baseHsl.s;
        let accentLightness = baseHsl.l > 20 ? baseHsl.l - 10 : baseHsl.l + 10;
        accentLightness = Math.max(0, Math.min(100, accentLightness));

        const accentColor = GoatColor(`hsl(${accentHue}, ${accentSat}%, ${accentLightness}%)`);
        if (accentColor.isValid()) {
            rootStyle.setProperty('--color-accent-main', accentColor.toRgbString());

            const TARGET_CONTRAST = 4.5;
            const textColorDark = GoatColor(`hsl(${accentHue}, ${accentSat}%, 30%)`);
            const textColorLight = GoatColor(`hsl(${accentHue}, ${accentSat}%, 70%)`);
            let accentTextColor;

            if (textColorLight.isValid() && textColorDark.isValid()) {
                const contrastWithLight = GoatColor.getContrastRatio(textColorLight, accentColor);
                if (contrastWithLight >= TARGET_CONTRAST) {
                    accentTextColor = textColorLight;
                } else {
                    const contrastWithDark = GoatColor.getContrastRatio(textColorDark, accentColor);
                    if (contrastWithDark >= TARGET_CONTRAST) {
                        accentTextColor = textColorDark;
                    } else {
                        accentTextColor = contrastWithLight > contrastWithDark ? textColorLight : textColorDark;
                    }
                }
            } else {
                const contrastWithWhite = GoatColor.getContrastRatio(GoatColor('white'), accentColor);
                const contrastWithBlack = GoatColor.getContrastRatio(GoatColor('black'), accentColor);
                accentTextColor = contrastWithWhite >= contrastWithBlack ? GoatColor('white') : GoatColor('black');
            }
            rootStyle.setProperty('--color-text-on-accent', accentTextColor.toRgbString());
        }
    }

    function _updateHslPickerControls(masterHsl) {
        const hDisplayHsl = GPG.utils.normalizeHueForDisplay(masterHsl.s < 1 ? GPG.state.lastHslHue : masterHsl.h);
        GPG.ui.updateUiElementValue(GPG.elements.pickerSlider1, hDisplayHsl);
        GPG.ui.updateUiElementValue(GPG.elements.pickerInput1, hDisplayHsl);
        GPG.ui.updateUiElementValue(GPG.elements.pickerSlider2, Math.round(masterHsl.s));
        GPG.ui.updateUiElementValue(GPG.elements.pickerInput2, Math.round(masterHsl.s));
        GPG.ui.updateUiElementValue(GPG.elements.pickerSlider3, Math.round(masterHsl.l));
        GPG.ui.updateUiElementValue(GPG.elements.pickerInput3, Math.round(masterHsl.l));
    }

    function _updateOklchPickerControls(masterOklch) {
        const hDisplayOklch = GPG.utils.normalizeHueForDisplay(masterOklch.c < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD ? GPG.state.lastOklchHue : masterOklch.h);
        const lDisplayOklch = Number(masterOklch.l.toFixed(1));

        if (masterOklch.l > 0 && masterOklch.l < 100) {
            const maxCForCurrentLH = GoatColor.getMaxSRGBChroma(masterOklch.l, hDisplayOklch, GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE);
            let cPercentDisplay = maxCForCurrentLH > 0.0001 ? (masterOklch.c / maxCForCurrentLH) * 100 : 0;
            cPercentDisplay = Math.min(100, cPercentDisplay); // Clamp to 100
            const cPercentDisplayRounded = Number(cPercentDisplay.toFixed(1));
            GPG.ui.updateUiElementValue(GPG.elements.pickerSlider2, cPercentDisplayRounded);
            GPG.ui.updateUiElementValue(GPG.elements.pickerInput2, cPercentDisplayRounded);
        }

        GPG.ui.updateUiElementValue(GPG.elements.pickerSlider3, lDisplayOklch);
        GPG.ui.updateUiElementValue(GPG.elements.pickerInput3, lDisplayOklch);
        GPG.ui.updateUiElementValue(GPG.elements.pickerSlider1, hDisplayOklch);
        GPG.ui.updateUiElementValue(GPG.elements.pickerInput1, hDisplayOklch);
    }

    function _updateSharedPickerUI(masterColor) {
        const currentAlphaPercent = Math.round(masterColor.a * 100);
        GPG.ui.updateUiElementValue(GPG.elements.pickerOpacitySlider, currentAlphaPercent);
        GPG.ui.updateUiElementValue(GPG.elements.pickerOpacityInput, currentAlphaPercent);
        GPG.elements.colorPreviewBox_colorOverlay.style.backgroundColor = masterColor.toRgbaString();
    }


    Object.assign(GPG.ui, {
        showBinNotification: function (message, targetElement) {
            if (GPG.state.binClearState.notificationElement) GPG.state.binClearState.notificationElement.remove();

            GPG.state.binClearState.notificationElement = document.createElement("div");
            GPG.state.binClearState.notificationElement.className = "bin-click-notification";
            GPG.state.binClearState.notificationElement.textContent = message;
            document.body.appendChild(GPG.state.binClearState.notificationElement);

            const rect = targetElement.getBoundingClientRect();
            GPG.state.binClearState.notificationElement.style.top = `${rect.bottom + window.scrollY + 8}px`;
            GPG.state.binClearState.notificationElement.style.left = `${rect.left + window.scrollX + (rect.width / 2)}px`;
        },

        hideBinNotification: function () {
            if (GPG.state.binClearState.notificationElement) {
                GPG.state.binClearState.notificationElement.remove();
                GPG.state.binClearState.notificationElement = null;
            }
        },

        syncInstantUiFromState: function (options = {}) {
            const { source = 'external' } = options;
            const masterColor = GPG.state.currentGoatColor;

            // Update global styles
            document.body.style.backgroundColor = masterColor.toRgbaString();
            _updateCssVariables(masterColor.flatten());

            // Update picker-specific controls if the update did not originate from them
            if (GPG.state.activePickerMode === 'hsl') {
                if (source !== 'hsl') {
                    _updateHslPickerControls(masterColor.toHsl());
                }
            } else { // oklch
                if (source !== 'oklch') {
                    _updateOklchPickerControls(masterColor.toOklch());
                }
            }

            // Update Hue slider disabled state for OKLCH if needed
            if (GPG.state.activePickerMode === 'oklch') {
                const masterOklch = masterColor.toOklch();
                const lForStateCheck = (source === 'oklch' && !isNaN(parseFloat(GPG.elements.pickerInput3.value))) ? parseFloat(GPG.elements.pickerInput3.value) : masterOklch.l;
                const maxC = GoatColor.getMaxSRGBChroma(lForStateCheck, GPG.utils.normalizeHueForDisplay(masterOklch.h), GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE);
                const cPercentForStateCheck = (source === 'oklch' && !isNaN(parseFloat(GPG.elements.pickerInput2.value))) ? parseFloat(GPG.elements.pickerInput2.value) : (maxC > 0.0001 ? (masterOklch.c / maxC) * 100 : 0);
                const hForStateCheck = (source === 'oklch' && !isNaN(parseInt(GPG.elements.pickerInput1.value, 10))) ? parseInt(GPG.elements.pickerInput1.value, 10) : GPG.utils.normalizeHueForDisplay(masterOklch.c < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD ? GPG.state.lastOklchHue : masterOklch.h);
                GPG.ui.updateOklchHueSliderState(cPercentForStateCheck, lForStateCheck, hForStateCheck);
            }

            // Update shared UI elements (preview box, opacity)
            _updateSharedPickerUI(masterColor);

            // Update Color String Input - Use picker values as source of truth when picker is the source
            let colorString;
            if (source === 'hsl') {
                const h = GPG.elements.pickerInput1.value;
                const s = GPG.elements.pickerInput2.value;
                const l = GPG.elements.pickerInput3.value;
                const o = GPG.elements.pickerOpacityInput.value;
                const alphaStr = o == 100 ? '' : ` / ${o}%`;
                colorString = `hsl(${h} ${s}% ${l}%${alphaStr})`;

            } else if (source === 'oklch') {
                // The currentGoatColor was just updated from the picker, so we can use it
                // and the utility function will format it correctly.
                colorString = GPG.utils.getFormattedColorString(masterColor, 'oklch');
            } else { // Source is external (e.g. text input, swatch click)
                colorString = GPG.state.activePickerMode === 'hsl' ? masterColor.toHslaString() : GPG.utils.getFormattedColorString(masterColor, 'oklch');
            }
            GPG.ui.updateUiElementValue(GPG.elements.colorStringInput, colorString);
            GPG.elements.colorStringInput.classList.remove('invalid');

            // Update remaining UI
            this.updateIncrementUI();
            this.updateColorOutputSpans();
            this.requestH1Update();
        },

        performExpensiveUpdates: function () {
            GPG.ui.updateAllSliderBackgrounds();
            GPG.ui.updateDynamicSliderThumbStyles();
        },

        requestExpensiveUpdate: function () {
            if (GPG.state.isUiUpdateThrottled) return;
            GPG.state.isUiUpdateThrottled = true;

            requestAnimationFrame(() => {
                this.performExpensiveUpdates();
                GPG.palette.generate();
                GPG.handlers.generateAndDisplayTheoryPalette();
                GPG.state.isUiUpdateThrottled = false;
            });
        },

        syncAllUiFromState: function (options = {}) {
            if (!GPG.state.currentGoatColor || !GPG.state.currentGoatColor.isValid()) {
                console.warn("syncAllUiFromState called with invalid currentGoatColor");
                return;
            }
            GPG.state.isProgrammaticUpdate = true;
            this.syncInstantUiFromState(options);
            this.performExpensiveUpdates();
            GPG.state.isProgrammaticUpdate = false;
        },

        updateColorOutputSpans: function () {
            const colorToDisplay = GPG.state.currentGoatColor || GoatColor(null);
            const errorMsg = colorToDisplay.error || "Invalid";

            if (!GPG.elements.outputSpans || !GPG.elements.outputSpans.hex) {
                return; // Elements not ready
            }

            if (!colorToDisplay.isValid()) {
                GPG.elements.outputSpans.hex.textContent = errorMsg;
                GPG.elements.outputSpans.hsl.textContent = errorMsg;
                GPG.elements.outputSpans.rgb.textContent = errorMsg;
                GPG.elements.outputSpans.oklch.textContent = errorMsg;
                return;
            }

            // Clone the color and set the alpha style hint to number for consistent fractional display in UI
            const displayColor = GoatColor(colorToDisplay.toRgbaString());
            displayColor.setAlpha(displayColor.a, GoatColor.ALPHA_STYLE_HINT_NUMBER);

            let hexOutputValue = displayColor.toHexaShort();
            if (!hexOutputValue) {
                hexOutputValue = displayColor.a < 1 ? displayColor.toHexa() : displayColor.toHexShort() || displayColor.toHex();
            }
            GPG.elements.outputSpans.hex.textContent = hexOutputValue;
            GPG.elements.outputSpans.hsl.textContent = GPG.utils.getFormattedColorString(displayColor, 'hsl');
            GPG.elements.outputSpans.rgb.textContent = GPG.utils.getFormattedColorString(displayColor, 'rgb');
            GPG.elements.outputSpans.oklch.textContent = GPG.utils.getFormattedColorString(displayColor, 'oklch');
        },

        updateUiElementValue: function (element, value) {
            if (!element) return;
            const stringValue = String(value);
            if (element.value !== stringValue) {
                element.value = stringValue;
            }
        },

        initializeH1Styles: function () {
            const h1 = document.querySelector('h1');
            if (!h1 || !h1.textContent) return;

            const text = h1.textContent;
            h1.innerHTML = '';
            GPG.state.h1Chars = [];

            for (let i = 0; i < text.length; i++) {
                const span = document.createElement('span');
                span.className = 'block-letter'; // Base class for all blocks
                if (text[i] === ' ') {
                    span.classList.add('h1-space');
                    span.innerHTML = '&nbsp;'; // Content to prevent collapse
                } else {
                    span.textContent = text[i];
                }
                h1.appendChild(span);
                GPG.state.h1Chars.push(span);
            }
        },

        requestH1Update: function () {
            clearTimeout(GPG.state.h1UpdateDebounceTimer);
            GPG.state.h1UpdateDebounceTimer = setTimeout(() => {
                this.updateH1CharacterStyles();
            }, 200);
        },

        updateH1CharacterStyles: function () {
            if (!GPG.state.h1Chars.length || !GPG.state.currentGoatColor || !GPG.state.currentGoatColor.isValid()) {
                return;
            }

            const mainColor = GPG.state.currentGoatColor;
            const mainHsl = mainColor.toHsl();

            const bgHue = mainHsl.h;
            const bgSat = mainHsl.s;
            let bgLightness = mainHsl.l > 20 ? mainHsl.l - 10 : mainHsl.l + 10;
            bgLightness = Math.max(0, Math.min(100, bgLightness));

            const blockBgColor = GoatColor(`hsl(${bgHue}, ${bgSat}%, ${bgLightness}%)`);
            if (!blockBgColor.isValid()) return;

            const TARGET_CONTRAST = 4.5;
            const textColorDark = GoatColor(`hsl(${bgHue}, ${bgSat}%, 30%)`);
            const textColorLight = GoatColor(`hsl(${bgHue}, ${bgSat}%, 70%)`);
            let finalTextColor;

            if (textColorLight.isValid() && textColorDark.isValid()) {
                const contrastWithLight = GoatColor.getContrastRatio(textColorLight, blockBgColor);
                if (contrastWithLight >= TARGET_CONTRAST) {
                    finalTextColor = textColorLight;
                } else {
                    const contrastWithDark = GoatColor.getContrastRatio(textColorDark, blockBgColor);
                    if (contrastWithDark >= TARGET_CONTRAST) {
                        finalTextColor = textColorDark;
                    } else {
                        finalTextColor = contrastWithLight > contrastWithDark ? textColorLight : textColorDark;
                    }
                }
            } else {
                const contrastWithWhite = GoatColor.getContrastRatio(GoatColor('white'), blockBgColor);
                const contrastWithBlack = GoatColor.getContrastRatio(GoatColor('black'), blockBgColor);
                finalTextColor = contrastWithWhite >= contrastWithBlack ? GoatColor('white') : GoatColor('black');
            }

            const finalBgString = blockBgColor.toRgbString();
            const finalColorString = finalTextColor.toRgbString();

            GPG.state.h1Chars.forEach(span => {
                if (span.textContent.trim() !== '') {
                    span.style.backgroundColor = finalBgString;
                    span.style.color = finalColorString;
                }
            });
        },

        updateInfoPanel: function () {
            if (!GPG.elements.oklchInfoPanel) return;

            if (GPG.state.activePickerMode === "oklch") {
                GPG.elements.oklchInfoPanel.classList.add('visible');
            } else {
                GPG.elements.oklchInfoPanel.classList.remove('visible');
            }
        },

        updateIncrementUI: function () {
            const select = GPG.elements.varyParamSelect;
            if (!select || !GPG.state.currentGoatColor || !GPG.state.currentGoatColor.isValid()) return;

            const activeMode = GPG.state.activePickerMode;
            const previousValue = select.value;
            select.innerHTML = ''; // Clear existing options

            const options = GPG.PALETTE_VARY_PARAMS[activeMode];

            options.forEach(optData => {
                const option = document.createElement('option');
                option.value = optData.value;
                option.textContent = optData.text;
                select.appendChild(option);
            });

            // Try to restore selection
            const currentOptionsValues = options.map(opt => opt.value);
            let newSelection = '';

            if (currentOptionsValues.includes(previousValue)) {
                newSelection = previousValue;
            } else {
                const otherMode = activeMode === 'hsl' ? 'oklch' : 'hsl';
                const previousOptionData = GPG.PALETTE_VARY_PARAMS[otherMode].find(opt => opt.value === previousValue);
                if (previousOptionData && currentOptionsValues.includes(previousOptionData.equivalent)) {
                    newSelection = previousOptionData.equivalent;
                }
            }

            select.value = newSelection || (activeMode === 'hsl' ? 'saturation' : 'oklch_l');

            // Disable hue option if color is achromatic
            const isAchromatic = activeMode === 'hsl'
                ? GPG.state.currentGoatColor.toHsl().s < 0.1
                : GPG.state.currentGoatColor.toOklch().c < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD;

            const hueOptionConfig = options.find(opt => opt.isHue);
            if (hueOptionConfig) {
                const hueOption = select.querySelector(`option[value="${hueOptionConfig.value}"]`);
                if (hueOption) {
                    hueOption.disabled = isAchromatic;
                    if (isAchromatic && hueOption.selected) {
                        select.value = activeMode === 'hsl' ? 'saturation' : 'oklch_l';
                    }
                }
            }
        },

        updateAllSwatches: function () {
            if (GPG.state.generatedColors.length > 0) {
                GPG.elements.paletteContainer.innerHTML = "";
                const fragment = document.createDocumentFragment();
                for (const color of GPG.state.generatedColors) {
                    const swatchEl = GPG.ui.createSwatch(color);
                    if (swatchEl) {
                        fragment.appendChild(swatchEl);
                    }
                }
                GPG.elements.paletteContainer.appendChild(fragment);
            }
        }
    });
}(window.GPG));