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

        formatOklchForPicker: function (colorInstance, rawPickerValues = null) {
            if (!colorInstance || !colorInstance.isValid()) return "Invalid Color";

            const oklcha = colorInstance.toOklcha();
            const lightnessToDisplay = (rawPickerValues && rawPickerValues.l !== undefined) ? rawPickerValues.l : oklcha.l;
            const lStr = Number(parseFloat(lightnessToDisplay).toFixed(1));

            const cStr = Number(oklcha.c.toFixed(3));
            let hStr = Math.round(oklcha.h);
            if (hStr === 360) hStr = 0;

            if (oklcha.a < 1) {
                const aStr = `${Math.round(oklcha.a * 100)}%`;
                return `oklch(${lStr}% ${cStr} ${hStr} / ${aStr})`;
            } else {
                return `oklch(${lStr}% ${cStr} ${hStr})`;
            }
        }
    };
}(window.GPG));