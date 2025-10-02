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
        }
    };
}(window.GPG));