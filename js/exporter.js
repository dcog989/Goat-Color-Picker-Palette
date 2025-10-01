window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    function generatePaintboxExportHeaderComment(exportFormat) {
        return `/*\n * Paintbox Export\n * Format: ${exportFormat.toUpperCase()}\n */\n\n`;
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

    function processColorsForExport(colors, exportFormat, individualColorFormatter) {
        const validColors = colors.filter(c => c && c.isValid());

        if (validColors.length === 0) {
            return null;
        }

        const opacityStyleHint = GPG.state.currentGoatColor._alphaInputStyleHint || GoatColor.ALPHA_STYLE_HINT_NUMBER;

        let outputItems = [];
        validColors.forEach((colorInstance, index) => {
            colorInstance.setAlpha(colorInstance.a, opacityStyleHint);
            const formattedColorString = GPG.utils.getFormattedColorString(colorInstance, exportFormat);
            outputItems.push(individualColorFormatter(colorInstance, index, formattedColorString, exportFormat));
        });
        return outputItems.join('');
    }

    function generateCssString() {
        const exportFormat = document.querySelector('input[name="export-format"]:checked').value;
        const comment = generatePaintboxExportHeaderComment(exportFormat);
        const cssVarLines = processColorsForExport(GPG.state.paintboxColors, exportFormat, (colorInstance, index, formattedString) => {
            const varName = `--color-${String(index + 1).padStart(3, "0")}`;
            return `  ${varName}: ${formattedString};\n`;
        });

        if (cssVarLines === null) return null;
        return comment + ":root {\n" + cssVarLines + "}";
    }

    function generateXmlString() {
        const exportFormat = document.querySelector('input[name="export-format"]:checked').value;
        const comment = generatePaintboxExportHeaderComment(exportFormat).replace(/\/\*/g, "<!--").replace(/\*\//g, "-->");

        const xmlColorLines = processColorsForExport(GPG.state.paintboxColors, exportFormat, (colorInstance, index, formattedString, currentExportFormat) => {
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

        if (xmlColorLines === null) return null;
        return `<?xml version="1.0" encoding="UTF-8"?>\n${comment}<Palette>\n\n${xmlColorLines}\n</Palette>`;
    }


    GPG.exporter = {
        generateCssString: generateCssString,

        exportCssFile: function () {
            const cssContent = generateCssString();
            if (cssContent) {
                downloadFile(cssContent, generateExportFilename("paintbox", "css"), "text/css");
            } else {
                alert("No valid colors in the paintbox to export!");
            }
        },

        exportXmlFile: function () {
            const xmlContent = generateXmlString();
            if (xmlContent) {
                downloadFile(xmlContent, generateExportFilename("paintbox", "xml"), "application/xml");
            } else {
                alert("No valid colors in the paintbox to export!");
            }
        }
    };
}(window.GPG));