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
                    {
                        const oklcha = colorInstance.toOklcha();

                        const round = (val, dec) => Number(Math.round(val + "e" + dec) + "e-" + dec);

                        let lStr = round(oklcha.l / 100, 3).toString();
                        if (lStr.startsWith("0.")) lStr = lStr.substring(1);

                        let cStr = round(oklcha.c, 3).toString();
                        if (cStr.startsWith("0.")) cStr = cStr.substring(1);

                        let hStr = round(oklcha.h, 0);
                        if (hStr === 360) hStr = 0;

                        if (!hasOpacity) {
                            return `oklch(${lStr} ${cStr} ${hStr})`;
                        }

                        let aStr = round(oklcha.a, 3).toString();
                        if (aStr.startsWith("0.")) aStr = aStr.substring(1);
                        if (aStr === '1') return `oklch(${lStr} ${cStr} ${hStr})`;

                        return `oklch(${lStr} ${cStr} ${hStr} / ${aStr})`;
                    }
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