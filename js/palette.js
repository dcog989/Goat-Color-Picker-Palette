window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    function generatePalette() {
        if (!GPG.state.currentGoatColor || !GPG.state.currentGoatColor.isValid()) {
            return;
        }

        const baseColor = GPG.state.currentGoatColor;
        const baseOpacityPercent = baseColor.a * 100;
        const activeMode = GPG.state.activePickerMode;

        const baseHsl = baseColor.toHsl();
        const baseOklch = baseColor.toOklch();

        const stableHslHue = GPG.utils.normalizeHueForDisplay(baseHsl.s < 1 ? GPG.state.lastHslHue : baseHsl.h);
        const stableOklchHue = GPG.utils.normalizeHueForDisplay(baseOklch.c < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD ? GPG.state.lastOklchHue : baseOklch.h);

        let numTotalSwatches = parseInt(GPG.elements.swatchCountInput.value, 10);
        const varyParam = GPG.elements.varyParamSelect.value;

        if (!varyParam) {
            console.warn("No vary parameter selected.");
            return;
        }
        GPG.ui.updateIncrementUI();

        GPG.state.generatedColors = [];

        if (isNaN(numTotalSwatches) || numTotalSwatches < 1) {
            numTotalSwatches = 1;
        }

        const baseChroma = baseOklch.c;
        let baseChromaPercent = 0;

        // Use GoatColor library's accurate gamut boundary check for the current L/H
        const max_c_at_base_L = GoatColor.getMaxSRGBChroma(
            baseOklch.l,
            stableOklchHue,
            GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE
        );

        if (max_c_at_base_L > 0) {
            baseChromaPercent = (baseChroma / max_c_at_base_L) * 100;
        }

        // Clamp to 100 to prevent slight float calculation overshoots
        baseChromaPercent = Math.min(100, Math.max(0, baseChromaPercent));


        for (let i = 0; i < numTotalSwatches; i++) {
            const stepPercent = (numTotalSwatches <= 1) ? 0.5 : i / (numTotalSwatches - 1);
            let tempGoatColor;

            if (activeMode === 'hsl') {
                let h = stableHslHue, s = baseHsl.s, l = baseHsl.l, o = baseOpacityPercent;
                switch (varyParam) {
                    case 'hue':
                        h = (i / numTotalSwatches) * 360;
                        break;
                    case 'saturation':
                        s = stepPercent * 100;
                        break;
                    case 'lightness':
                        l = GPG.PALETTE_GENERATOR_RANGES.lightness.min + (stepPercent * GPG.PALETTE_GENERATOR_RANGES.lightness.range);
                        break;
                    case 'opacity':
                        o = stepPercent * 100;
                        break;
                }
                tempGoatColor = GPG.color.createFromPicker('hsl', h, s, l, o);
            } else { // oklch
                let l = baseOklch.l, cPercent = baseChromaPercent, h = stableOklchHue, o = baseOpacityPercent;
                switch (varyParam) {
                    case 'oklch_l':
                        l = GPG.PALETTE_GENERATOR_RANGES.lightness.min + (stepPercent * GPG.PALETTE_GENERATOR_RANGES.lightness.range);
                        break;
                    case 'oklch_c':
                        cPercent = GPG.PALETTE_GENERATOR_RANGES.chroma.min + (stepPercent * GPG.PALETTE_GENERATOR_RANGES.chroma.range);
                        break;
                    case 'oklch_h':
                        h = (i / numTotalSwatches) * 360;
                        break;
                    case 'opacity':
                        o = stepPercent * 100;
                        break;
                }
                tempGoatColor = GPG.color.createFromPicker('oklch', h, cPercent, l, o);
            }

            if (tempGoatColor && tempGoatColor.isValid()) {
                GPG.state.generatedColors.push(tempGoatColor);
            } else {
                console.warn("Generated color invalid for palette step:", i, tempGoatColor ? tempGoatColor.error : "N/A");
                GPG.state.generatedColors.push(GoatColor('transparent')); // Push a placeholder
            }
        }

        const container = GPG.elements.paletteContainer;
        const existingSwatches = Array.from(container.children);
        const newColors = GPG.state.generatedColors;

        newColors.forEach((color, i) => {
            if (i < existingSwatches.length) {
                GPG.ui.updateGeneratedSwatch(existingSwatches[i], color);
            } else {
                const newSwatch = GPG.ui.createSwatch(color);
                if (newSwatch) {
                    container.appendChild(newSwatch);
                }
            }
        });

        if (existingSwatches.length > newColors.length) {
            for (let i = existingSwatches.length - 1; i >= newColors.length; i--) {
                container.removeChild(existingSwatches[i]);
            }
        }
    }

    GPG.palette = {
        generate: generatePalette
    };

}(window.GPG));