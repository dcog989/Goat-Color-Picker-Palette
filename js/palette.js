window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    function getPaletteVariantColor(varyParam, value, baseHsl, baseOklch, baseOpacity, oklchStaticMaxAbsolute, lastOklchHueForGen) {
        let tempGoatColor;
        let c_absolute_for_oklch_gen;

        if (varyParam === "oklch_c") {
            c_absolute_for_oklch_gen = value;
        } else {
            const maxCForBaseLH = GoatColor.getMaxSRGBChroma(baseOklch.l, baseOklch.h, oklchStaticMaxAbsolute);
            const cPercent = maxCForBaseLH > 0 ? (baseOklch.c / maxCForBaseLH) * 100 : 0;
            c_absolute_for_oklch_gen = (cPercent / 100) * (maxCForBaseLH > 0.0001 ? maxCForBaseLH : oklchStaticMaxAbsolute);
        }

        if (c_absolute_for_oklch_gen < 0.001 && varyParam !== "oklch_c") {
            c_absolute_for_oklch_gen = 0.0001;
        }

        let effectiveOklchH = baseOklch.h;
        if (c_absolute_for_oklch_gen < 0.001 && varyParam !== "oklch_h" && varyParam !== "oklch_c") {
            effectiveOklchH = lastOklchHueForGen;
        }

        if (varyParam === "oklch_c" && value < 0.001) {
            effectiveOklchH = lastOklchHueForGen;
        }

        switch (varyParam) {
            case "hue":
                tempGoatColor = GoatColor(`hsla(${value}, ${baseHsl.s}%, ${baseHsl.l}%, ${baseOpacity})`);
                break;
            case "saturation":
                tempGoatColor = GoatColor(`hsla(${baseHsl.h}, ${value}%, ${baseHsl.l}%, ${baseOpacity})`);
                break;
            case "lightness":
                tempGoatColor = GoatColor(`hsla(${baseHsl.h}, ${baseHsl.s}%, ${value}%, ${baseOpacity})`);
                break;
            case "oklch_l":
                tempGoatColor = GoatColor(`oklch(${value}% ${c_absolute_for_oklch_gen.toFixed(4)} ${effectiveOklchH} / ${baseOpacity * 100}%)`);
                break;
            case "oklch_c":
                tempGoatColor = GoatColor(`oklch(${baseOklch.l}% ${value.toFixed(4)} ${effectiveOklchH} / ${baseOpacity * 100}%)`);
                break;
            case "oklch_h":
                tempGoatColor = GoatColor(`oklch(${baseOklch.l}% ${c_absolute_for_oklch_gen.toFixed(4)} ${value} / ${baseOpacity * 100}%)`);
                break;
            case "opacity":
                const currentOpacityVal = Math.max(0, Math.min(1, value / 100.0));
                tempGoatColor = GoatColor(`hsla(${baseHsl.h}, ${baseHsl.s}%, ${baseHsl.l}%, ${currentOpacityVal})`);
                break;
        }
        return tempGoatColor;
    }

    function generatePalette() {
        if (!GPG.state.currentGoatColor || !GPG.state.currentGoatColor.isValid()) {
            return;
        }

        const baseColor = GPG.state.currentGoatColor;
        const baseHsl = baseColor.toHsl();
        const baseOklch = baseColor.toOklch();
        const baseOpacity = baseColor.a;

        const baseHslForGeneration = {
            h: GPG.utils.normalizeHueForDisplay(baseHsl.s < 1 ? GPG.state.lastHslHue : baseHsl.h),
            s: baseHsl.s,
            l: baseHsl.l
        };
        const baseOklchForGeneration = {
            l: baseOklch.l,
            c: baseOklch.c,
            h: GPG.utils.normalizeHueForDisplay(baseOklch.c < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD ? GPG.state.lastOklchHue : baseOklch.h)
        };

        const variationPercent = parseInt(GPG.elements.variationInput.value, 10) / 100;

        let numTotalSwatches = parseInt(GPG.elements.swatchCountInput.value, 10);
        const varyParam = GPG.elements.varyParamSelect.value;

        if (!varyParam) {
            console.warn("No vary parameter selected.");
            return;
        }
        GPG.ui.updateIncrementUI();

        GPG.elements.paletteContainer.innerHTML = "";
        GPG.state.generatedColors = [];

        if (isNaN(numTotalSwatches) || numTotalSwatches < 2) {
            numTotalSwatches = 2;
        }

        let baseValue, minValue = 0,
            maxValue;
        let isHueParam = false;

        switch (varyParam) {
            case "hue":
                baseValue = baseHslForGeneration.h;
                minValue = 0;
                maxValue = 359;
                isHueParam = true;
                break;
            case "saturation":
                baseValue = baseHslForGeneration.s;
                minValue = 0;
                maxValue = 100;
                break;
            case "lightness":
                baseValue = baseHslForGeneration.l;
                minValue = 0;
                maxValue = 100;
                break;
            case "oklch_l":
                baseValue = baseOklchForGeneration.l;
                minValue = 0;
                maxValue = 100;
                break;
            case "oklch_c":
                const baseLForMaxC = baseOklchForGeneration.l;
                let baseHForMaxC = baseOklchForGeneration.h;
                const currentBaseChromaAbsolute = baseOklch.c;

                if (currentBaseChromaAbsolute < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD) {
                    baseHForMaxC = GPG.utils.normalizeHueForDisplay(GPG.state.lastOklchHue);
                }

                maxValue = GoatColor.getMaxSRGBChroma(baseLForMaxC, baseHForMaxC, GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE);
                if (maxValue < 0.0001) maxValue = 0.0001;
                baseValue = Math.min(currentBaseChromaAbsolute, maxValue);
                minValue = 0;
                break;
            case "oklch_h":
                baseValue = baseOklchForGeneration.h;
                minValue = 0;
                maxValue = 359;
                isHueParam = true;
                break;
            case "opacity":
                baseValue = baseOpacity * 100;
                minValue = 0;
                maxValue = 100;
                break;
        }

        let startValue, endValue;

        if (isHueParam) {
            const spread = 180 * variationPercent;
            startValue = baseValue - spread;
            endValue = baseValue + spread;
        } else {
            startValue = baseValue - (baseValue - minValue) * variationPercent;
            endValue = baseValue + (maxValue - baseValue) * variationPercent;
        }


        for (let i = 0; i < numTotalSwatches; i++) {
            let currentValue;
            if (numTotalSwatches === 1) {
                currentValue = baseValue;
            } else {
                currentValue = startValue + ((endValue - startValue) / (numTotalSwatches - 1)) * i;
            }

            let finalValueToUse;
            if (isHueParam) {
                finalValueToUse = GPG.utils.normalizeHueForDisplay(currentValue);
            } else if (varyParam === "oklch_c") {
                finalValueToUse = parseFloat(currentValue.toFixed(4));
                finalValueToUse = Math.max(minValue, Math.min(maxValue, finalValueToUse));
            } else {
                finalValueToUse = Math.round(currentValue);
                finalValueToUse = Math.max(minValue, Math.min(maxValue, finalValueToUse));
            }

            let tempGoatColor = getPaletteVariantColor(
                varyParam,
                finalValueToUse,
                baseHslForGeneration,
                baseOklchForGeneration,
                baseOpacity,
                GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE,
                GPG.state.lastOklchHue
            );

            if (tempGoatColor && tempGoatColor.isValid()) {
                GPG.state.generatedColors.push(tempGoatColor);
            } else {
                console.warn("Generated color invalid for palette:", finalValueToUse, "for", varyParam, tempGoatColor ? tempGoatColor.error : "N/A");
                if (GPG.state.generatedColors.length < numTotalSwatches) {
                    const fallbackBase = GoatColor(`hsla(${baseHslForGeneration.h}, ${baseHslForGeneration.s}%, ${baseHslForGeneration.l}%, ${baseOpacity})`);
                    if (fallbackBase.isValid()) {
                        GPG.state.generatedColors.push(fallbackBase);
                    } else {
                        console.error("Fallback base HSL color is also invalid. Base HSL input:", baseHslForGeneration, "Opacity:", baseOpacity);
                    }
                }
            }
        }

        if (GPG.state.generatedColors.length === 0 && GPG.state.currentGoatColor && GPG.state.currentGoatColor.isValid()) {
            GPG.state.generatedColors.push(GPG.state.currentGoatColor);
        }

        const fragment = document.createDocumentFragment();
        for (const colorData of GPG.state.generatedColors) {
            const swatchEl = GPG.ui.createSwatch(colorData);
            if (swatchEl) {
                fragment.appendChild(swatchEl);
            }
        }
        GPG.elements.paletteContainer.appendChild(fragment);
    }
    GPG.palette = {
        generate: generatePalette
    };

}(window.GPG));