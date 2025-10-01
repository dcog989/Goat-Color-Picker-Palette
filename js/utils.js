window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    GPG.utils = {
        normalizeHueForDisplay: function (hue) {
            if (isNaN(hue)) return 0;
            let h = Math.round(parseFloat(hue)) % 360;
            if (h < 0) h += 360;
            if (h === 360) h = 0;
            return h;
        },

        getFormattedColorString: function (colorInstance, format) {
            if (!colorInstance || !colorInstance.isValid()) return "Invalid Color";
            const hasOpacity = colorInstance.a < 1;

            switch (format) {
                case "hsl":
                    return hasOpacity ? colorInstance.toHslaString() : colorInstance.toHslString();
                case "rgb":
                    return hasOpacity ? colorInstance.toRgbaString() : colorInstance.toRgbString();
                case "oklch":
                    return hasOpacity ? colorInstance.toOklchaString() : colorInstance.toOklchString();
                case "hex":
                default:
                    return hasOpacity ? colorInstance.toHexa() : colorInstance.toHex();
            }
        },

        findContrastingTextColor: function (bgColorInstances, targetHue) {
            const TARGET_CONTRAST = 4.5;
            const TEXT_SATURATION = 20;

            if (!Array.isArray(bgColorInstances) || bgColorInstances.length === 0 || !bgColorInstances.every(c => c && c.isValid())) {
                return GoatColor("black");
            }

            // Determine if we should search for a light or dark color
            const averageLuminance = bgColorInstances.reduce((sum, c) => sum + c.getRelativeLuminance(), 0) / bgColorInstances.length;
            const iterateUp = averageLuminance < 0.5; // Search for lighter colors if average bg is dark

            const startL = iterateUp ? 40 : 60;
            const endL = iterateUp ? 100 : 0;
            const stepL = iterateUp ? 1 : -1;

            for (let l = startL; iterateUp ? l <= endL : l >= endL; l += stepL) {
                const textColorCandidate = GoatColor(`hsl(${targetHue}, ${TEXT_SATURATION}%, ${l}%)`);
                if (textColorCandidate.isValid()) {
                    const meetsContrast = bgColorInstances.every(bg => GoatColor.getContrastRatio(textColorCandidate, bg) >= TARGET_CONTRAST);
                    if (meetsContrast) {
                        return textColorCandidate; // Found a good colored one
                    }
                }
            }

            // Fallback to black or white
            const white = GoatColor('white');
            const black = GoatColor('black');
            let minContrastWithWhite = 21;
            let minContrastWithBlack = 21;

            for (const bgColor of bgColorInstances) {
                minContrastWithWhite = Math.min(minContrastWithWhite, GoatColor.getContrastRatio(white, bgColor));
                minContrastWithBlack = Math.min(minContrastWithBlack, GoatColor.getContrastRatio(black, bgColor));
            }

            return minContrastWithWhite >= minContrastWithBlack ? white : black;
        }
    };
}(window.GPG));