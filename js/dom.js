window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    GPG.elements = {};

    GPG.cacheElements = function () {
        const elementIdMap = {
            // Unified Picker Controls
            colorStringInput: "color-string-input",
            pickerGroup1: "picker-group-1",
            pickerLabel1: "picker-label-1",
            pickerSlider1: "picker-slider-1",
            pickerInput1: "picker-input-1",
            pickerUnit1: "picker-unit-1",
            pickerGroup2: "picker-group-2",
            pickerLabel2: "picker-label-2",
            pickerSlider2: "picker-slider-2",
            pickerInput2: "picker-input-2",
            pickerUnit2: "picker-unit-2",
            pickerGroup3: "picker-group-3",
            pickerLabel3: "picker-label-3",
            pickerSlider3: "picker-slider-3",
            pickerInput3: "picker-input-3",
            pickerUnit3: "picker-unit-3",
            pickerOpacityGroup: "picker-opacity-group",
            pickerOpacitySlider: "picker-opacity-slider",
            pickerOpacityInput: "picker-opacity-input",
            colorPreviewBox: "colorPreviewBox",
            pickerModeSelector: "picker-mode-selector",

            // Other UI elements
            appVersion: "app-version",
            paletteContainer: "palette-container",
            exportButton: "export-button",
            exportXmlButton: "export-xml-button",
            oklchInfoPanel: "oklchInfoPanel",
            paletteGeneratorPanel: "palette-generator-panel",
            swatchCountInput: "swatch-count-input",
            variationSlider: "variation-slider",
            variationInput: "variation-input",
            varyParamSelect: "vary-param-select",
            harmonySelect: "harmony-select",
            copyTheoryToPaintboxBtn: "copy-theory-to-paintbox-btn",
            theoryPaletteSwatches: "theory-palette-swatches",
            paintboxGrid: "paintbox-grid",
            paintboxBin: "paintbox-bin",
            exportPaintboxBtn: "export-paintbox-btn",
            colorOutputContainer: "colorOutput",
            themeSelect: "theme-select"
        };

        for (const key in elementIdMap) {
            GPG.elements[key] = document.getElementById(elementIdMap[key]);
        }

        GPG.elements.outputSpans = {
            hex: document.getElementById("goatHexOutput"),
            hsl: document.getElementById("goatHslOutput"),
            rgb: document.getElementById("goatRgbOutput"),
            oklch: document.getElementById("goatOklchOutput"),
        };
        GPG.elements.pickerModeRadios = document.querySelectorAll('input[name="picker-mode"]');
        GPG.elements.exportFormatRadios = document.querySelectorAll('input[name="export-format"]');

        if (GPG.elements.colorPreviewBox) {
            GPG.elements.colorPreviewBox_checkerboard = GPG.elements.colorPreviewBox.querySelector(".checkerboard-element");
            GPG.elements.colorPreviewBox_colorOverlay = GPG.elements.colorPreviewBox.querySelector(".color-overlay-element");
        }
    };

    GPG.validateCachedElements = function () {
        const criticalElementIds = [
            "colorStringInput", "pickerGroup1", "pickerSlider1", "pickerInput1",
            "pickerGroup2", "pickerSlider2", "pickerInput2",
            "pickerGroup3", "pickerSlider3", "pickerInput3",
            "pickerOpacityGroup", "pickerOpacitySlider", "pickerOpacityInput", "colorPreviewBox", "pickerModeSelector",
            "appVersion", "paletteContainer", "exportButton", "exportXmlButton",
            "oklchInfoPanel", "paletteGeneratorPanel", "swatchCountInput", "variationSlider", "variationInput",
            "varyParamSelect", "colorOutputContainer",
            "harmonySelect", "copyTheoryToPaintboxBtn", "theoryPaletteSwatches",
            "paintboxGrid", "paintboxBin", "exportPaintboxBtn",
            "themeSelect"
        ];

        let initFailed = false;
        criticalElementIds.forEach(id => {
            if (!GPG.elements[id]) {
                console.error(`Missing critical element: ${id}`);
                initFailed = true;
            }
        });
        if (GPG.elements.outputSpans && (!GPG.elements.outputSpans.hex || !GPG.elements.outputSpans.hsl || !GPG.elements.outputSpans.rgb || !GPG.elements.outputSpans.oklch)) {
            console.error("Missing one or more output span elements.");
            initFailed = true;
        }
        if (!GPG.elements.colorPreviewBox_checkerboard || !GPG.elements.colorPreviewBox_colorOverlay ||
            (GPG.elements.exportFormatRadios && GPG.elements.exportFormatRadios.length !== 4) ||
            (GPG.elements.pickerModeRadios && GPG.elements.pickerModeRadios.length !== 2)
        ) {
            if (!initFailed) console.error("Critical DOM elements missing or incorrect count. Halting initialization.", GPG.elements);
            initFailed = true;
        }

        return !initFailed;
    };
}(window.GPG));