window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    function setupSliderInputPair(slider, input, updateCallback) {
        slider.addEventListener("input", () => {
            if (GPG.state.isProgrammaticUpdate) return;

            // For sliders with a step less than 1 (e.g. oklch), round to whole number for snapping effect.
            // For other sliders, the value is already a whole number.
            const step = parseFloat(slider.step) || 1;
            const value = step < 1 ? Math.round(parseFloat(slider.value)) : parseFloat(slider.value);

            GPG.state.isProgrammaticUpdate = true;
            // Force the UI to the snapped value during dragging.
            slider.value = value;
            input.value = value;
            GPG.state.isProgrammaticUpdate = false;
            updateCallback(true);
        });

        input.addEventListener("input", () => {
            if (GPG.state.isProgrammaticUpdate) return;

            let numericValue = parseFloat(input.value);
            const min = parseFloat(input.min);
            const max = parseFloat(input.max);

            if (!isNaN(numericValue)) {
                if (numericValue > max) {
                    numericValue = max;
                    input.value = max;
                } else if (numericValue < min && input.value.length >= String(min).length) {
                    // Allow typing, but don't update slider if below min
                } else {
                    GPG.state.isProgrammaticUpdate = true;
                    if (slider) slider.value = Math.max(min, Math.min(max, numericValue));
                    GPG.state.isProgrammaticUpdate = false;
                    updateCallback(true);
                }
            }
        });

        input.addEventListener("change", () => {
            if (GPG.state.isProgrammaticUpdate) return;
            let numericValue = parseFloat(input.value);
            const min = parseFloat(input.min);
            const max = parseFloat(input.max);

            if (isNaN(numericValue) || numericValue < min) {
                numericValue = min;
            } else if (numericValue > max) {
                numericValue = max;
            }

            const step = input.step;
            const decimals = (step && step.includes('.')) ? step.split('.')[1].length : 0;
            const finalValue = Number(numericValue.toFixed(decimals)); // Use Number() to remove trailing .0

            GPG.state.isProgrammaticUpdate = true;
            input.value = finalValue;
            if (slider) slider.value = finalValue;
            GPG.state.isProgrammaticUpdate = false;

            if (updateCallback) updateCallback(false);
        });
    }

    GPG.events = {
        bindEventListeners: function () {
            const updateFromHsl = (isSlider, param) => GPG.handlers.updateFromHslPicker(isSlider, param);
            const updateFromOklch = (isSlider, param) => GPG.handlers.updateFromOklchPicker(isSlider, param);

            const createUpdateCallback = (paramHsl, paramOklch) => (isSlider) => {
                if (GPG.state.activePickerMode === 'hsl') {
                    updateFromHsl(isSlider, paramHsl);
                } else {
                    updateFromOklch(isSlider, paramOklch);
                }
            };

            // Picker Controls
            setupSliderInputPair(GPG.elements.pickerSlider1, GPG.elements.pickerInput1, createUpdateCallback('h', 'h'));
            setupSliderInputPair(GPG.elements.pickerSlider2, GPG.elements.pickerInput2, createUpdateCallback('s', 'c'));
            setupSliderInputPair(GPG.elements.pickerSlider3, GPG.elements.pickerInput3, createUpdateCallback('l', 'l'));
            setupSliderInputPair(GPG.elements.pickerOpacitySlider, GPG.elements.pickerOpacityInput, createUpdateCallback('o', 'o'));

            if (GPG.elements.colorStringInput) {
                const input = GPG.elements.colorStringInput;
                input.addEventListener('change', GPG.handlers.handleColorStringInputChange);
                input.addEventListener('input', () => input.classList.remove('invalid'));

                // --- Drag and Drop for Color Input ---
                input.addEventListener('dragover', GPG.handlers.dragOverHandler);
                input.addEventListener('dragleave', GPG.handlers.dragLeaveHandler);
                input.addEventListener('drop', e => {
                    e.preventDefault();
                    GPG.handlers.dragLeaveHandler(e);
                    const colorString = e.dataTransfer.getData('text/plain');
                    if (colorString) {
                        input.value = colorString;
                        input.dispatchEvent(new Event('change'));
                    }
                });
            }


            // Palette Generator Controls
            GPG.elements.swatchCountInput.addEventListener("change", GPG.palette.generate);
            GPG.elements.varyParamSelect.addEventListener("change", GPG.palette.generate);
            GPG.elements.addPaletteToPaintboxBtn.addEventListener("click", GPG.handlers.copyPaletteToPaintbox);

            // Export Controls
            GPG.elements.exportActionButton.addEventListener("click", GPG.handlers.handlePaintboxExport);

            // Side Panel Controls
            GPG.elements.harmonySelect.addEventListener("change", GPG.handlers.generateAndDisplayTheoryPalette);
            GPG.elements.copyTheoryToPaintboxBtn.addEventListener("click", GPG.handlers.copyTheoryToPaintbox);

            // Paintbox Bin
            GPG.elements.paintboxBin.addEventListener("dragover", e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; e.currentTarget.classList.add("drag-over-bin"); });
            GPG.elements.paintboxBin.addEventListener("dragenter", e => { e.preventDefault(); e.currentTarget.classList.add("drag-over-bin"); });
            GPG.elements.paintboxBin.addEventListener("dragleave", e => e.currentTarget.classList.remove("drag-over-bin"));
            GPG.elements.paintboxBin.addEventListener("drop", GPG.handlers.handlePaintboxBinDrop);
            GPG.elements.paintboxBin.addEventListener("click", GPG.handlers.handlePaintboxBinClick);
            GPG.elements.paintboxBin.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); GPG.handlers.handlePaintboxBinClick(); } });

            // App Mode / Theme Controls
            GPG.elements.pickerModeRadios.forEach(radio => radio.addEventListener('change', GPG.handlers.handlePickerModeChange));
            GPG.elements.themeSelect.addEventListener('change', e => {
                const newTheme = e.target.value;
                localStorage.setItem('goatPaletteGenerator_theme', newTheme);
                GPG.theme.applyTheme(newTheme);
            });
            window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
                if (GPG.elements.themeSelect.value === 'system') GPG.theme.applyTheme('system');
            });

            // Global Drag/Drop
            if (GPG.elements.colorPreviewBox) {
                const box = GPG.elements.colorPreviewBox;
                box.addEventListener('dragover', GPG.handlers.dragOverHandler);
                box.addEventListener('dragleave', GPG.handlers.dragLeaveHandler);
                box.addEventListener('drop', GPG.handlers.handleDropOnPicker);
            }

            // Delegated click for copy buttons
            if (GPG.elements.colorOutputContainer) {
                GPG.elements.colorOutputContainer.addEventListener("click", GPG.handlers.handleCopyButtonClick);
            }
        }

    };
}(window.GPG));