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

    function _addColorsToPaintbox(colors, button) {
        if (!colors || colors.length === 0) {
            _provideButtonFeedback(button, false, "No Colors!");
            return;
        }
        let appendedCount = 0;
        let paintboxWasFull = false;
        for (const color of colors) {
            if (color && color.isValid()) {
                let emptyIdx = GPG.state.paintboxColors.findIndex(c => !c || !c.isValid());

                // If no empty slot, try to add a new one
                if (emptyIdx === -1 && GPG.state.paintboxColors.length < GPG.PAINTBOX_MAX_SWATCHES) {
                    GPG.ui.addSwatchToPaintbox(null); // Add a new empty swatch
                    emptyIdx = GPG.state.paintboxColors.length - 1; // It's the last one
                }

                if (emptyIdx !== -1) {
                    const targetChild = Array.from(GPG.elements.paintboxGrid.children).find(child => child.dataset.index === String(emptyIdx));
                    if (targetChild) {
                        GPG.ui.updatePaintboxSwatchUI(targetChild, color);
                        appendedCount++;
                    }
                } else {
                    paintboxWasFull = true;
                    break;
                }
            }
        }

        if (appendedCount > 0 && paintboxWasFull) {
            _provideButtonFeedback(button, true, "Partial Add");
        } else if (appendedCount > 0 && !paintboxWasFull) {
            _provideButtonFeedback(button, true, "Added!");
        } else if (appendedCount === 0 && paintboxWasFull) {
            _provideButtonFeedback(button, false, "Full!");
        } else if (appendedCount === 0 && !paintboxWasFull && colors.length > 0) {
            _provideButtonFeedback(button, false, "No valid colors");
        }
    }

    function _processColorUpdate(newColor, sourceMode, isSliderEvent) {
        if (!newColor.isValid()) return;

        GPG.state.currentGoatColor = newColor;

        if (sourceMode === 'hsl') {
            const newOklch = newColor.toOklch();
            if (newOklch.c >= GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD) {
                GPG.state.lastOklchHue = GPG.utils.normalizeHueForDisplay(newOklch.h);
            }
        } else { // oklch
            const newHsl = newColor.toHsl();
            if (newHsl.s > 0) {
                GPG.state.lastHslHue = GPG.utils.normalizeHueForDisplay(newHsl.h);
            }
        }

        if (isSliderEvent) {
            GPG.state.isProgrammaticUpdate = true;
            GPG.ui.syncInstantUiFromState({ source: sourceMode });
            GPG.state.isProgrammaticUpdate = false;
            GPG.ui.requestExpensiveUpdate();
        } else {
            GPG.ui.syncAllUiFromState({ source: sourceMode });
            GPG.palette.generate();
            GPG.handlers.generateAndDisplayTheoryPalette();
        }
    }

    GPG.handlers = {
        updateFromHslPicker: function (isSliderEvent = false) {
            if (GPG.state.isProgrammaticUpdate) return;

            const h = parseInt(GPG.elements.pickerInput1.value, 10);
            const s = parseInt(GPG.elements.pickerInput2.value, 10);
            const l = parseInt(GPG.elements.pickerInput3.value, 10);
            const o = parseInt(GPG.elements.pickerOpacityInput.value, 10);

            if (isNaN(h) || isNaN(s) || isNaN(l) || isNaN(o)) return;

            const newColor = GPG.color.createFromPicker('hsl', h, s, l, o);
            _processColorUpdate(newColor, 'hsl', isSliderEvent);
        },

        updateFromOklchPicker: function (isSliderEvent = false) {
            if (GPG.state.isProgrammaticUpdate) return;

            const l = parseFloat(GPG.elements.pickerInput3.value);
            const cPercent = parseFloat(GPG.elements.pickerInput2.value);
            const h = parseInt(GPG.elements.pickerInput1.value, 10);
            const o = parseInt(GPG.elements.pickerOpacityInput.value, 10);

            if (isNaN(l) || isNaN(cPercent) || isNaN(h) || isNaN(o)) return;

            const newColor = GPG.color.createFromPicker('oklch', h, cPercent, l, o);
            _processColorUpdate(newColor, 'oklch', isSliderEvent);
        },

        dragOverHandler: function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            e.currentTarget.classList.add('drag-over');
        },

        dragLeaveHandler: function (e) {
            e.currentTarget.classList.remove('drag-over');
        },

        handleDropOnPicker: function (event) {
            event.preventDefault();
            event.currentTarget.classList.remove('drag-over');

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
                    GPG.palette.generate();
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

                let finalColor = newColor;
                const oklch = newColor.toOklch();

                // If the new color is achromatic while in OKLCH mode, recreate it using the last known hue.
                // This keeps the internal state consistent with the UI's hue-locking behavior for grays.
                if (GPG.state.activePickerMode === 'oklch' && oklch.c < GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD) {
                    finalColor = GoatColor(`oklch(${oklch.l}% ${oklch.c} ${GPG.state.lastOklchHue})`);
                } else {
                    GPG.state.lastOklchHue = GPG.utils.normalizeHueForDisplay(oklch.h);
                }

                GPG.state.currentGoatColor = finalColor;

                // Also update the HSL hue cache
                const hsl = finalColor.toHsl();
                if (hsl.s > 0) {
                    GPG.state.lastHslHue = GPG.utils.normalizeHueForDisplay(hsl.h);
                }

                GPG.ui.syncAllUiFromState();
                GPG.palette.generate();
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
            _addColorsToPaintbox(GPG.state.theoryPaletteCache, GPG.elements.copyTheoryToPaintboxBtn);
        },

        copyPaletteToPaintbox: function () {
            _addColorsToPaintbox(GPG.state.generatedColors, GPG.elements.addPaletteToPaintboxBtn);
        },

        handlePaintboxExport: function () {
            const button = GPG.elements.exportActionButton;
            const destination = document.querySelector('input[name="export-destination"]:checked').value;

            const hasColors = GPG.state.paintboxColors.some(c => c && c.isValid());
            if (!hasColors) {
                _provideButtonFeedback(button, false, "Empty!");
                return;
            }

            if (destination === 'css-file') {
                GPG.exporter.exportCssFile();
            } else if (destination === 'xml-file') {
                GPG.exporter.exportXmlFile();
            } else if (destination === 'clipboard') {
                const plainTextContent = GPG.exporter.generatePlainColorListString();
                if (plainTextContent) {
                    navigator.clipboard.writeText(plainTextContent).then(() => {
                        _provideButtonFeedback(button, true, "Copied!");
                    }).catch(() => {
                        _provideButtonFeedback(button, false, "Failed!");
                    });
                }
            }
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
            GPG.palette.generate();
        },

        handlePaintboxBinDrop: function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove("drag-over-bin");
            if (GPG.state.draggedItem.sourceType === "paintbox" && GPG.state.draggedItem.originalIndex !== -1) {
                const childToClear = Array.from(GPG.elements.paintboxGrid.children).find(child => child.dataset.index === String(GPG.state.draggedItem.originalIndex));
                if (childToClear) {
                    GPG.ui.updatePaintboxSwatchUI(childToClear, null);
                }
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
            const visuallyHiddenSpan = button.querySelector('.visually-hidden');

            const restoreButtonState = () => {
                button.classList.remove("copied-success", "copied-fail");
                button.title = originalTitle;
                button.innerHTML = GPG.SVG_COPY_ICON;
                if (visuallyHiddenSpan) button.appendChild(visuallyHiddenSpan);
            };

            if (textToCopy && textToCopy !== "Invalid" && textToCopy !== "Error") {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    button.classList.add("copied-success");
                    button.title = "Copied!";
                    button.innerHTML = GPG.SVG_COPIED_ICON;
                    if (visuallyHiddenSpan) button.appendChild(visuallyHiddenSpan);
                    setTimeout(restoreButtonState, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                    button.classList.add("copied-fail");
                    button.title = "Copy failed";
                    setTimeout(restoreButtonState, 2000);
                });
            } else {
                button.classList.add("copied-fail");
                button.title = "Nothing to copy!";
                setTimeout(restoreButtonState, 2000);
            }
        }
    };
}(window.GPG));