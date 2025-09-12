window.GPG = window.GPG || {};
GPG.ui = GPG.ui || {};

(function (GPG) {
    'use strict';
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
            document.body.style.backgroundColor = masterColor.toRgbaString();

            const opaqueBaseColor = masterColor.flatten();
            if (opaqueBaseColor.isValid()) {
                const baseHsl = opaqueBaseColor.toHsl();
                const roundedS = Math.round(baseHsl.s);
                const roundedL = Math.round(baseHsl.l);
                const isAchromatic = roundedS === 0 || roundedL === 0 || roundedL === 100;
                let hueForCssVars = isAchromatic ? GPG.state.lastHslHue : Math.round(baseHsl.h);
                const buttonSaturation = isAchromatic ? 0 : 90;

                document.documentElement.style.setProperty("--animation-base-hue", `${hueForCssVars}deg`);
                document.documentElement.style.setProperty("--animation-base-saturation", `${roundedS}%`);
                document.documentElement.style.setProperty("--animation-base-lightness", `${roundedL}%`);
                document.documentElement.style.setProperty("--button-saturation", `${buttonSaturation}%`);
            }

            const masterHsl = masterColor.toHsl();
            const masterOklch = masterColor.toOklch();
            const currentAlphaPercent = Math.round(masterColor.a * 100);

            if (GPG.state.activePickerMode === 'hsl') {
                if (source !== 'hsl') {
                    const hDisplayHsl = GPG.utils.normalizeHueForDisplay(masterHsl.s < 1 ? GPG.state.lastHslHue : masterHsl.h);
                    this.updateUiElementValue(GPG.elements.pickerSlider1, hDisplayHsl);
                    this.updateUiElementValue(GPG.elements.pickerInput1, hDisplayHsl);
                    this.updateUiElementValue(GPG.elements.pickerSlider2, Math.round(masterHsl.s));
                    this.updateUiElementValue(GPG.elements.pickerInput2, Math.round(masterHsl.s));
                    this.updateUiElementValue(GPG.elements.pickerSlider3, Math.round(masterHsl.l));
                    this.updateUiElementValue(GPG.elements.pickerInput3, Math.round(masterHsl.l));
                }
            } else { // oklch
                if (source !== 'oklch') {
                    const hDisplayOklch = GPG.utils.normalizeHueForDisplay(masterOklch.c < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD ? GPG.state.lastOklchHue : masterOklch.h);
                    const lDisplayOklch = Math.round(masterOklch.l);

                    if (lDisplayOklch > 0 && lDisplayOklch < 100) {
                        const maxCForCurrentLH = GoatColor.getMaxSRGBChroma(lDisplayOklch, hDisplayOklch, GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE);
                        const cPercentDisplay = maxCForCurrentLH > 0.0001 ? (masterOklch.c / maxCForCurrentLH) * 100 : 0;
                        this.updateUiElementValue(GPG.elements.pickerSlider2, cPercentDisplay.toFixed(1));
                    }

                    this.updateUiElementValue(GPG.elements.pickerSlider3, lDisplayOklch);
                    this.updateUiElementValue(GPG.elements.pickerInput3, lDisplayOklch);
                    this.updateUiElementValue(GPG.elements.pickerSlider1, hDisplayOklch);
                    this.updateUiElementValue(GPG.elements.pickerInput1, hDisplayOklch);
                }
            }

            if (GPG.state.activePickerMode === 'oklch') {
                const lForStateCheck = (source === 'oklch' && !isNaN(parseInt(GPG.elements.pickerInput3.value, 10))) ? parseInt(GPG.elements.pickerInput3.value, 10) : Math.round(masterOklch.l);
                const cPercentForStateCheck = (source === 'oklch' && !isNaN(parseFloat(GPG.elements.pickerInput2.value))) ? parseFloat(GPG.elements.pickerInput2.value) : (GoatColor.getMaxSRGBChroma(lForStateCheck, GPG.utils.normalizeHueForDisplay(masterOklch.h), GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE) > 0.0001 ? (masterOklch.c / GoatColor.getMaxSRGBChroma(lForStateCheck, GPG.utils.normalizeHueForDisplay(masterOklch.h), GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE)) * 100 : 0);
                const hForStateCheck = (source === 'oklch' && !isNaN(parseInt(GPG.elements.pickerInput1.value, 10))) ? parseInt(GPG.elements.pickerInput1.value, 10) : GPG.utils.normalizeHueForDisplay(masterOklch.c < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD ? GPG.state.lastOklchHue : masterOklch.h);
                GPG.ui.updateOklchHueSliderState(cPercentForStateCheck, lForStateCheck, hForStateCheck);
            }

            this.updateUiElementValue(GPG.elements.pickerOpacitySlider, currentAlphaPercent);
            this.updateUiElementValue(GPG.elements.pickerOpacityInput, currentAlphaPercent);

            const colorString = GPG.state.activePickerMode === 'hsl' ? GPG.utils.getFormattedColorString(masterColor, 'hsl') : GPG.utils.getFormattedColorString(masterColor, 'oklch');
            this.updateUiElementValue(GPG.elements.colorStringInput, colorString);
            GPG.elements.colorStringInput.classList.remove('invalid');

            const previewColorString = masterColor.toRgbaString();
            GPG.elements.colorPreviewBox_colorOverlay.style.backgroundColor = previewColorString;
            const checkerOpacity = (1 - masterColor.a).toFixed(2);
            GPG.elements.colorPreviewBox_checkerboard.style.opacity = checkerOpacity;

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

            let hexOutputValue = colorToDisplay.toHexaShort();
            if (!hexOutputValue) {
                hexOutputValue = colorToDisplay.a < 1 ? colorToDisplay.toHexa() : colorToDisplay.toHexShort() || colorToDisplay.toHex();
            }
            GPG.elements.outputSpans.hex.textContent = hexOutputValue;
            GPG.elements.outputSpans.hsl.textContent = colorToDisplay.toHslaString();
            GPG.elements.outputSpans.rgb.textContent = colorToDisplay.toRgbaString();
            GPG.elements.outputSpans.oklch.textContent = colorToDisplay.toOklchaString();
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

            const textColor10 = GoatColor(`hsl(${bgHue}, ${bgSat}%, 30%)`);
            const textColor90 = GoatColor(`hsl(${bgHue}, ${bgSat}%, 70%)`);

            let finalTextColor;
            if (textColor10.isValid() && textColor90.isValid()) {
                const contrastWith10 = GoatColor.getContrastRatio(textColor10, blockBgColor);
                const contrastWith90 = GoatColor.getContrastRatio(textColor90, blockBgColor);
                finalTextColor = contrastWith90 > contrastWith10 ? textColor90 : textColor10;
            } else {
                finalTextColor = blockBgColor.getRelativeLuminance() > 0.5 ? GoatColor('black') : GoatColor('white');
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

            const previousValue = select.value;
            select.innerHTML = ''; // Clear existing options

            const options = GPG.state.activePickerMode === 'hsl'
                ? [
                    { value: 'hue', text: 'Hue' },
                    { value: 'saturation', text: 'Saturation' },
                    { value: 'lightness', text: 'Lightness' },
                    { value: 'opacity', text: 'Alpha' }
                ]
                : [ // oklch
                    { value: 'oklch_l', text: 'Lightness' },
                    { value: 'oklch_c', text: 'Chroma' },
                    { value: 'oklch_h', text: 'Hue' },
                    { value: 'opacity', text: 'Alpha' }
                ];

            options.forEach(optData => {
                const option = document.createElement('option');
                option.value = optData.value;
                option.textContent = optData.text;
                select.appendChild(option);
            });

            // Try to restore selection
            const valueMap = {
                'hue': 'oklch_h', 'oklch_h': 'hue',
                'saturation': 'oklch_c', 'oklch_c': 'saturation',
                'lightness': 'oklch_l', 'oklch_l': 'lightness',
                'opacity': 'opacity'
            };
            const equivalentValue = valueMap[previousValue];

            if (options.some(opt => opt.value === previousValue)) {
                select.value = previousValue;
            } else if (equivalentValue && options.some(opt => opt.value === equivalentValue)) {
                select.value = equivalentValue;
            } else {
                select.value = GPG.state.activePickerMode === 'hsl' ? 'saturation' : 'oklch_l';
            }

            // Disable hue option if color is achromatic
            const isAchromatic = GPG.state.activePickerMode === 'hsl'
                ? GPG.state.currentGoatColor.toHsl().s < 0.1
                : GPG.state.currentGoatColor.toOklch().c < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD;

            const hueOptionValue = GPG.state.activePickerMode === 'hsl' ? 'hue' : 'oklch_h';
            const hueOption = select.querySelector(`option[value="${hueOptionValue}"]`);

            if (hueOption) {
                hueOption.disabled = isAchromatic;
                if (isAchromatic && hueOption.selected) {
                    select.value = GPG.state.activePickerMode === 'hsl' ? 'saturation' : 'oklch_l';
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