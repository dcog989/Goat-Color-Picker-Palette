window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    function generateExportHeaderComment() {
        if (!GPG.state.currentGoatColor || !GPG.state.currentGoatColor.isValid()) return "/* Base color invalid */\n\n";

        const numSwatchesInputEl = GPG.elements.swatchCountInput;
        const numSwatches = parseInt(numSwatchesInputEl.value, 10) || 1;

        const varyParamSelect = GPG.elements.varyParamSelect;
        const selectedOption = varyParamSelect.options[varyParamSelect.selectedIndex];
        const varyParamDataName = selectedOption ? selectedOption.textContent : "Parameter";

        let exportFormat = document.querySelector('input[name="export-format"]:checked').value;

        let baseColorStringForComment;
        if (GPG.state.activePickerMode === "hsl") {
            baseColorStringForComment = GPG.state.currentGoatColor.toHslaString();
        } else {
            baseColorStringForComment = GPG.state.currentGoatColor.toOklchaString();
        }


        return `/*\n * Palette based on ${baseColorStringForComment}\n * Varying: ${varyParamDataName}, Number of Swatches: ${numSwatches}\n * Export Format: ${exportFormat.toUpperCase()}\n */\n\n`;
    }

    function generateExportFilename(base, extension) {
        const now = new Date();
        const year = String(now.getFullYear()).slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        return `${base}-${year}${month}${day}-${hours}${minutes}.${extension}`;
    }

    function downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        }, 100);
    }

    function processColorsForExport(exportFormat, individualColorFormatter) {
        if (GPG.state.generatedColors.length === 0) {
            alert("Generate a palette first!");
            return null;
        }

        const opacityStyleHint = GPG.state.currentGoatColor._alphaInputStyleHint || GoatColor.ALPHA_STYLE_HINT_NUMBER;

        let outputItems = [];
        GPG.state.generatedColors.forEach((colorInstance, index) => {
            if (!colorInstance || !colorInstance.isValid()) {
                console.warn("Skipping invalid color during export:", colorInstance);
                return;
            }
            colorInstance.setAlpha(colorInstance.a, opacityStyleHint);
            const formattedColorString = GPG.utils.getFormattedColorString(colorInstance, exportFormat);
            outputItems.push(individualColorFormatter(colorInstance, index, formattedColorString, exportFormat));
        });
        return outputItems.join('');
    }

    GPG.exporter = {
        exportCssPalette: function () {
            const exportFormat = document.querySelector('input[name="export-format"]:checked').value;
            const comment = generateExportHeaderComment();

            const cssVarLines = processColorsForExport(exportFormat, (colorInstance, index, formattedString) => {
                const varName = `--color-${String(index + 1).padStart(3, "0")}`;
                return `  ${varName}: ${formattedString};\n`;
            });

            if (cssVarLines === null) return;

            const cssContent = comment + ":root {\n" + cssVarLines + "}";
            downloadFile(cssContent, generateExportFilename("palette", "css"), "text/css");
        },

        exportXmlPalette: function () {
            const exportFormat = document.querySelector('input[name="export-format"]:checked').value;
            const comment = generateExportHeaderComment().replace(/\/\*/g, "<!--").replace(/\*\//g, "-->");

            const xmlColorLines = processColorsForExport(exportFormat, (colorInstance, index, formattedString, currentExportFormat) => {
                let attrName = currentExportFormat + (colorInstance.a < 1 ? "a" : "") + "Value";
                if (currentExportFormat === "hex" && colorInstance.a < 1) attrName = "hexaValue";
                else if (currentExportFormat === "hex") attrName = "hexValue";

                const name = `color${String(index + 1).padStart(3, "0")}`;

                const valueAttrEscaped = formattedString
                    .replace(/&/g, "&" + "amp;")
                    .replace(/</g, "&" + "lt;")
                    .replace(/>/g, "&" + "gt;")
                    .replace(/"/g, "&" + "quot;")
                    .replace(/'/g, "&" + "apos;");

                return `    <myColor ${attrName}="${valueAttrEscaped}" name="${name}" />\n`;
            });

            if (xmlColorLines === null) return;

            const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n${comment}<Palette>\n\n${xmlColorLines}\n</Palette>`;
            downloadFile(xmlContent, generateExportFilename("palette", "xml"), "application/xml");
        }
    };
}(window.GPG));