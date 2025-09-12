window.GPG = window.GPG || {}; (function (GPG) {
    'use strict'; function _provideButtonFeedback(button, success, message) {
        const originalText = button.textContent;
        button.textContent = message;
        button.disabled = true;
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);
    }

    GPG.handlers = {
        updateFromHslPicker: function (isSliderEvent = false) {
            if (GPG.state.isProgrammaticUpdate) return;

            let h = parseInt(GPG.elements.pickerInput1.value, 10);
            let s = parseInt(GPG.elements.pickerInput2.value, 10);
            let l = parseInt(GPG.elements.pickerInput3.value, 10);
            const o = parseInt(GPG.elements.pickerOpacityInput.value, 10);

            if (isNaN(h) || isNaN(s) || isNaN(l) || isNaN(o)) return;

            if (s > 0) {
                GPG.state.lastHslHue = h;
            } else {
                h = GPG.state.lastHslHue; // Use last saved hue if saturation is zero
            }

            const newColor = GoatColor(`hsla(${h}, ${s}%, ${l}%, ${o / 100})`);
            if (newColor.isValid()) {
                GPG.state.currentGoatColor = newColor;

                const newOklch = newColor.toOklch();
                if (newOklch.c >= GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD) {
                    GPG.state.lastOklchHue = GPG.utils.normalizeHueForDisplay(newOklch.h);
                }

                if (isSliderEvent) {
                    GPG.state.isProgrammaticUpdate = true;
                    GPG.ui.syncInstantUiFromState({ source: 'hsl' });
                    GPG.state.isProgrammaticUpdate = false;
                    GPG.ui.requestExpensiveUpdate();
                } else {
                    GPG.ui.syncAllUiFromState({ source: 'hsl' });
                    GPG.palette.generatePaletteDynamically(false);
                    GPG.handlers.generateAndDisplayTheoryPalette();
                }
            }
        },

        updateFromOklchPicker: function (isSliderEvent = false) {
            if (GPG.state.isProgrammaticUpdate) return;

            let l = parseInt(GPG.elements.pickerInput3.value, 10);
            let cPercent = parseFloat(GPG.elements.pickerInput2.value);
            let h = parseInt(GPG.elements.pickerInput1.value, 10);
            const o = parseInt(GPG.elements.pickerOpacityInput.value, 10);

            if (isNaN(l) || isNaN(cPercent) || isNaN(h) || isNaN(o)) return;

            cPercent = Math.max(0, Math.min(100, cPercent));

            const hueForMaxChroma = cPercent < 1 ? GPG.state.lastOklchHue : h;
            const maxAbsC = GoatColor.getMaxSRGBChroma(l, hueForMaxChroma, GPG.OKLCH_C_SLIDER_STATIC_MAX_ABSOLUTE);
            let cAbsolute = (cPercent / 100) * maxAbsC;

            let hueForCreation;
            if (cAbsolute >= GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD) {
                GPG.state.lastOklchHue = h;
                hueForCreation = h;
            } else {
                hueForCreation = GPG.state.lastOklchHue;
                cAbsolute = 0;
            }

            const newColor = GoatColor(`oklch(${l}% ${cAbsolute.toFixed(4)} ${hueForCreation} / ${o / 100})`);
            if (newColor.isValid()) {
                GPG.state.currentGoatColor = newColor;

                const newHsl = newColor.toHsl();
                if (newHsl.s > 0) {
                    GPG.state.lastHslHue = GPG.utils.normalizeHueForDisplay(newHsl.h);
                }

                if (isSliderEvent) {
                    GPG.state.isProgrammaticUpdate = true;
                    GPG.ui.syncInstantUiFromState({ source: 'oklch' });
                    GPG.state.isProgrammaticUpdate = false;
                    GPG.ui.requestExpensiveUpdate();
                } else {
                    GPG.ui.syncAllUiFromState({ source: 'oklch' });
                    GPG.palette.generatePaletteDynamically(false);
                    GPG.handlers.generateAndDisplayTheoryPalette();
                }
            }
        },

        handleDropOnPicker: function (event) {
            event.preventDefault();
            GPG.elements.colorPreviewBox.classList.remove('drag-over');

            const colorString = event.dataTransfer.getData('text/plain');
            if (colorString) {
                const newColor = GoatColor(colorString);
                if (newColor.isValid()) {
                    GPG.state.currentGoatColor = newColor;
                    const newHsl = newColor.toHsl();
                    const newOklch = newColor.toOklch();

                    if (newHsl.s > 0) {
                        GPG.state.lastHslHue = GPG.utils.normalizeHueForDisplay(newHsl.h);
                    }
                    if (newOklch.c >= GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD) {
                        GPG.state.lastOklchHue = GPG.utils.normalizeHueForDisplay(newOklch.h);
                    }

                    GPG.ui.syncAllUiFromState();
                    GPG.palette.generatePaletteDynamically(false);
                    GPG.handlers.generateAndDisplayTheoryPalette();
                } else {
                    console.warn("Dropped color string is invalid:", colorString, newColor.error);
                }
            }
        },

        handleColorStringInputChange: function (event) {
            const inputElement = event.target;
            const colorString = inputElement.value;

            if (colorString.trim() === "") {
                inputElement.classList.remove('invalid');
                return;
            }

            const newColor = GoatColor(colorString);

            if (newColor.isValid()) {
                inputElement.classList.remove('invalid');
                GPG.state.currentGoatColor = newColor;

                const newHsl = newColor.toHsl();
                if (newHsl.s > 0) {
                    GPG.state.lastHslHue = GPG.utils.normalizeHueForDisplay(newHsl.h);
                }

                const newOklch = newColor.toOklch();
                if (newOklch.c >= GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD) {
                    GPG.state.lastOklchHue = GPG.utils.normalizeHueForDisplay(newOklch.h);
                }

                GPG.ui.syncAllUiFromState();
                GPG.palette.generatePaletteDynamically(false);
                GPG.handlers.generateAndDisplayTheoryPalette();
            } else {
                inputElement.classList.add('invalid');
            }
        },

        generateAndDisplayTheoryPalette: function () {
            GPG.state.theoryPaletteCache = [];
            const harmonyType = GPG.elements.harmonySelect.value;
            if (!harmonyType) {
                GPG.elements.theoryPaletteSwatches.innerHTML = "";
                GPG.elements.copyTheoryToPaintboxBtn.disabled = true;
                return;
            }

            const baseColor = GPG.state.currentGoatColor;
            if (!baseColor || !baseColor.isValid()) {
                GPG.elements.theoryPaletteSwatches.innerHTML = '<p class="palette-message">Select a valid base color.</p>';
                GPG.elements.copyTheoryToPaintboxBtn.disabled = true;
                return;
            }

            const currentAlpha = baseColor.a;
            let tempPalette = [];

            switch (harmonyType) {
                case "monochromatic": tempPalette = baseColor.getMonochromaticPalette(GPG.MONOCHROMATIC_PALETTE_SIZE); break;
                case "analogous": tempPalette = baseColor.getAnalogousPalette(); break;
                case "complementary": tempPalette = baseColor.getComplementaryPalette(); break;
                case "split-complementary": tempPalette = baseColor.getSplitComplementaryPalette(); break;
                case "triadic": tempPalette = baseColor.getTriadicPalette(); break;
                case "tetradic": tempPalette = baseColor.getTetradicPalette(); break;
                default: tempPalette = [];
            }

            GPG.state.theoryPaletteCache = tempPalette.map((c) => {
                const hsla = c.toHsla();
                return GoatColor(`hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${currentAlpha})`);
            });

            GPG.elements.theoryPaletteSwatches.innerHTML = "";
            if (GPG.state.theoryPaletteCache.length > 0) {
                GPG.state.theoryPaletteCache.forEach((c) => GPG.elements.theoryPaletteSwatches.appendChild(GPG.ui.createDraggableSwatchElement(c, "swatch")));
            } else {
                GPG.elements.theoryPaletteSwatches.innerHTML = '<p class="palette-message">No palette generated.</p>';
            }
            GPG.elements.copyTheoryToPaintboxBtn.disabled = GPG.state.theoryPaletteCache.length === 0;
        },

        copyTheoryToPaintbox: function () {
            if (GPG.state.theoryPaletteCache.length === 0) {
                _provideButtonFeedback(GPG.elements.copyTheoryToPaintboxBtn, false, "No Palette!");
                return;
            }
            let appendedCount = 0;
            let paintboxWasFull = false;
            for (const theoryColor of GPG.state.theoryPaletteCache) {
                if (theoryColor && theoryColor.isValid()) {
                    const emptyIdx = GPG.state.paintboxColors.findIndex(c => !c || !c.isValid());
                    if (emptyIdx !== -1) {
                        if (GPG.elements.paintboxGrid.children[emptyIdx]) {
                            GPG.ui.updatePaintboxSwatchUI(GPG.elements.paintboxGrid.children[emptyIdx], theoryColor);
                            appendedCount++;
                        }
                    } else {
                        paintboxWasFull = true;
                        break;
                    }
                }
            }

            if (appendedCount > 0 && paintboxWasFull) {
                _provideButtonFeedback(GPG.elements.copyTheoryToPaintboxBtn, true, "Partial Add");
            } else if (appendedCount > 0 && !paintboxWasFull) {
                _provideButtonFeedback(GPG.elements.copyTheoryToPaintboxBtn, true, "Added!");
            } else if (appendedCount === 0 && paintboxWasFull) {
                _provideButtonFeedback(GPG.elements.copyTheoryToPaintboxBtn, false, "Full!");
            } else if (appendedCount === 0 && !paintboxWasFull && GPG.state.theoryPaletteCache.length > 0) {
                _provideButtonFeedback(GPG.elements.copyTheoryToPaintboxBtn, false, "No valid colors");
            }
        },
        exportPaintboxColors: function () {
            let cssVars = ":root {\n";
            let hasColors = false;
            GPG.state.paintboxColors.forEach((color, index) => {
                if (color && color.isValid()) {
                    const outputString = GPG.utils.getFormattedColorString(color, 'hex'); // Default to hex for export
                    cssVars += `  --paintbox-color-${String(index + 1).padStart(2, "0")}: ${outputString};\n`;
                    hasColors = true;
                }
            });
            cssVars += "}";

            if (!hasColors) {
                _provideButtonFeedback(GPG.elements.exportPaintboxBtn, false, "Empty!");
                return;
            }

            navigator.clipboard.writeText(cssVars).then(() => {
                _provideButtonFeedback(GPG.elements.exportPaintboxBtn, true, "Copied!");
            }).catch(() => {
                _provideButtonFeedback(GPG.elements.exportPaintboxBtn, false, "Failed!");
            });
        },
        resetDragState: function () {
            if (GPG.state.draggedItem.element) {
                GPG.state.draggedItem.element.classList.remove("dragging");
            }
            GPG.state.draggedItem = { element: null, colorInstance: null, sourceType: null, originalIndex: -1 };
            document.querySelectorAll('.drag-over, .drag-over-bin, .drag-over-main-target')
                .forEach(el => el.classList.remove('drag-over', 'drag-over-bin', 'drag-over-main-target'));
        },
        handlePaintboxBinClick: function () {
            if (GPG.state.draggedItem.element) return;

            if (GPG.state.binClearState.ready) {
                GPG.ui.initializePaintbox();
                clearTimeout(GPG.state.binClearState.timeoutId);
                GPG.state.binClearState.ready = false;
                GPG.elements.paintboxBin.title = GPG.state.originalBinTitle;
                GPG.elements.paintboxBin.classList.remove("pending-clear");
                GPG.elements.paintboxBin.setAttribute("aria-label", GPG.state.originalBinTitle);
                GPG.ui.hideBinNotification();
            } else {
                GPG.state.binClearState.ready = true;
                GPG.elements.paintboxBin.classList.add("pending-clear");
                const notificationMessage = "Click bin again to empty entire Paintbox";
                GPG.ui.showBinNotification(notificationMessage, GPG.elements.paintboxBin);
                GPG.elements.paintboxBin.title = notificationMessage;
                GPG.elements.paintboxBin.setAttribute("aria-label", notificationMessage);

                GPG.state.binClearState.timeoutId = setTimeout(() => {
                    GPG.state.binClearState.ready = false;
                    GPG.elements.paintboxBin.title = GPG.state.originalBinTitle;
                    GPG.elements.paintboxBin.classList.remove("pending-clear");
                    GPG.elements.paintboxBin.setAttribute("aria-label", GPG.state.originalBinTitle);
                    GPG.ui.hideBinNotification();
                }, 3000);
            }
        },

        handlePickerModeChange: function (event) {
            const newMode = event.target.value;
            localStorage.setItem('goatPaletteGenerator_activeMode', newMode);

            GPG.state.activePickerMode = newMode;
            GPG.ui.updatePickerControls(newMode);
            GPG.ui.updateIncrementUI();
            GPG.ui.updateInfoPanel();
            GPG.ui.syncAllUiFromState();
            GPG.palette.generatePaletteDynamically(false);
        },

        handlePaintboxBinDrop: function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove("drag-over-bin");
            if (GPG.state.draggedItem.sourceType === "paintbox" && GPG.state.draggedItem.originalIndex !== -1 && GPG.elements.paintboxGrid.children[GPG.state.draggedItem.originalIndex]) {
                GPG.ui.updatePaintboxSwatchUI(GPG.elements.paintboxGrid.children[GPG.state.draggedItem.originalIndex], null);
            }
            GPG.handlers.resetDragState();
        },
        handleCopyButtonClick: function (event) {
            const button = event.target.closest(".copy-btn");
            if (!button || !button.dataset.target) return;

            const targetSpan = document.getElementById(button.dataset.target);
            if (!targetSpan) return;

            const textToCopy = targetSpan.textContent;
            const originalTitle = button.title;

            const removeFeedbackClasses = () => {
                button.classList.remove("copied-success", "copied-fail");
                button.title = originalTitle;
            };

            if (textToCopy && textToCopy !== "Invalid" && textToCopy !== "Error") {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    button.classList.add("copied-success");
                    button.title = "Copied!";
                    setTimeout(removeFeedbackClasses, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                    button.classList.add("copied-fail");
                    button.title = "Copy failed";
                    setTimeout(removeFeedbackClasses, 2000);
                });
            } else {
                button.classList.add("copied-fail");
                button.title = "Nothing to copy!";
                setTimeout(removeFeedbackClasses, 2000);
            }
        }
    };
}(window.GPG));