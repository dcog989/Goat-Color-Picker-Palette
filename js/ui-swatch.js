window.GPG = window.GPG || {};
GPG.ui = GPG.ui || {};

(function (GPG) {
    'use strict';

    function _addDragListenersToSwatch(swatch) {
        swatch.addEventListener("dragstart", (e) => {
            GPG.state.draggedItem.element = e.currentTarget;
            e.currentTarget.classList.add("dragging");

            const colorStringFromDataset = e.currentTarget.dataset.color;
            GPG.state.draggedItem.colorInstance = colorStringFromDataset ? GoatColor(colorStringFromDataset) : null;

            GPG.state.draggedItem.sourceType = e.currentTarget.closest("#theory-palette-swatches") ? "theory"
                : e.currentTarget.closest("#paintbox-grid") ? "paintbox"
                    : "unknown";
            GPG.state.draggedItem.originalIndex = (GPG.state.draggedItem.sourceType === "paintbox" && e.currentTarget.dataset.index)
                ? parseInt(e.currentTarget.dataset.index, 10) : -1;

            if (GPG.state.draggedItem.sourceType === "paintbox") {
                e.dataTransfer.effectAllowed = "copyMove";
            } else if (GPG.state.draggedItem.sourceType === "theory" || GPG.state.draggedItem.sourceType === "palette") {
                e.dataTransfer.effectAllowed = "copy";
            } else {
                e.dataTransfer.effectAllowed = "none";
            }

            try {
                e.dataTransfer.setData("text/plain", colorStringFromDataset || "empty");
            } catch (err) {
                console.error("Error setting drag data:", err);
            }
        });
        swatch.addEventListener("dragend", GPG.handlers.resetDragState);
    }

    function _addClickListenerToSwatch(swatch) {
        swatch.addEventListener("click", (e) => {
            const colorString = e.currentTarget.dataset.color;

            if (!colorString) return;

            const clickedGC = GoatColor(colorString);
            if (!clickedGC.isValid()) return;

            GPG.state.currentGoatColor = clickedGC;

            const newHsl = clickedGC.toHsl();
            if (newHsl.s > 0) {
                GPG.state.lastHslHue = GPG.utils.normalizeHueForDisplay(newHsl.h);
            }

            const newOklch = clickedGC.toOklch();
            if (newOklch.c >= GPG.OKLCH_ACHROMATIC_CHROMA_THRESHOLD) {
                GPG.state.lastOklchHue = GPG.utils.normalizeHueForDisplay(newOklch.h);
            }

            GPG.ui.syncAllUiFromState();
            GPG.palette.generate();
            GPG.handlers.generateAndDisplayTheoryPalette();
        });
    }

    function _addDropListenersToPaintboxSwatch(swatch) {
        swatch.addEventListener("dragover", (e) => {
            e.preventDefault();
            const sourceType = GPG.state.draggedItem.sourceType;
            e.dataTransfer.dropEffect = (sourceType === "theory" || sourceType === "palette") ? "copy" : "move";
            e.currentTarget.classList.add("drag-over");
        });
        swatch.addEventListener("dragenter", (e) => {
            e.preventDefault();
            e.currentTarget.classList.add("drag-over");
        });
        swatch.addEventListener("dragleave", (e) => {
            e.currentTarget.classList.remove("drag-over");
        });
        swatch.addEventListener("drop", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const targetSwatchElement = e.currentTarget;
            targetSwatchElement.classList.remove("drag-over");

            const targetIndex = parseInt(targetSwatchElement.dataset.index, 10);
            const colorAtTargetBeforeDrop = GPG.state.paintboxColors[targetIndex];
            const draggedColor = GPG.state.draggedItem.colorInstance;

            GPG.ui.updatePaintboxSwatchUI(targetSwatchElement, draggedColor);

            if (GPG.state.draggedItem.sourceType === "paintbox" && GPG.state.draggedItem.originalIndex !== -1 && GPG.state.draggedItem.originalIndex !== targetIndex) {
                const originalSwatchElement = Array.from(GPG.elements.paintboxGrid.children).find(child => child.dataset.index === String(GPG.state.draggedItem.originalIndex));
                if (originalSwatchElement) {
                    GPG.ui.updatePaintboxSwatchUI(originalSwatchElement, colorAtTargetBeforeDrop);
                }
            }
            GPG.handlers.resetDragState();
        });
    }

    Object.assign(GPG.ui, {
        createDraggableSwatchElement: function (colorInstance, className = "swatch", isPaintboxSwatch = false, index = -1) {
            const swatch = document.createElement("div");
            swatch.className = className;
            swatch.draggable = true;
            if (index !== -1) swatch.dataset.index = index;

            const currentGC = (colorInstance && colorInstance.isValid()) ? colorInstance : null;

            if (currentGC) {
                const hex = currentGC.toHex().toUpperCase();
                const hexa = currentGC.toHexa();
                swatch.style.backgroundColor = hexa;
                swatch.title = `${hex}\nDrag or click to select.`;
                swatch.dataset.color = hexa;
            } else {
                swatch.style.backgroundColor = "var(--color-bg-input)";
                swatch.title = "Empty";
                swatch.dataset.color = "";
            }

            _addDragListenersToSwatch(swatch);
            if (className !== 'color-input-main') {
                _addClickListenerToSwatch(swatch);
            }
            if (isPaintboxSwatch) {
                _addDropListenersToPaintboxSwatch(swatch);
            }
            return swatch;
        },

        initializePaintbox: function () {
            // Remove only old swatches, keeping the bin element
            GPG.elements.paintboxGrid.querySelectorAll('.paintbox-swatch').forEach(swatch => swatch.remove());

            const numSwatches = GPG.PAINTBOX_ROWS * GPG.PAINTBOX_COLS - 1;
            GPG.state.paintboxColors = Array(numSwatches).fill(null);

            for (let i = 0; i < numSwatches; i++) {
                const swatch = GPG.ui.createDraggableSwatchElement(null, "paintbox-swatch", true, i);
                // Insert new swatches before the bin element
                GPG.elements.paintboxGrid.insertBefore(swatch, GPG.elements.paintboxBin);
            }

            GPG.elements.exportActionButton.disabled = true;
        },

        createSwatch: function (swatchGoatColor) {
            if (!swatchGoatColor || !swatchGoatColor.isValid()) {
                console.warn("Invalid color for swatch:", swatchGoatColor);
                return null;
            }

            const hexForTooltip = swatchGoatColor.toHex().toUpperCase();
            const swatchRgba = swatchGoatColor.toRgba();
            const o = swatchGoatColor.a;

            const colorItem = document.createElement("div");
            colorItem.classList.add("color-item");
            colorItem.draggable = true;

            colorItem.addEventListener('dragstart', (e) => {
                GPG.state.draggedItem.element = e.currentTarget;
                e.currentTarget.classList.add("dragging");
                GPG.state.draggedItem.colorInstance = swatchGoatColor;
                GPG.state.draggedItem.sourceType = "palette";
                GPG.state.draggedItem.originalIndex = -1;

                e.dataTransfer.effectAllowed = "copy";
                try {
                    e.dataTransfer.setData("text/plain", swatchGoatColor.toHexa());
                } catch (err) {
                    console.error("Error setting drag data:", err);
                }
            });
            colorItem.addEventListener("dragend", GPG.handlers.resetDragState);

            const colorInputMainDiv = document.createElement("div");
            colorInputMainDiv.classList.add("color-input-main");
            colorInputMainDiv.title = `${hexForTooltip}\nDrag or click to select.`;
            colorInputMainDiv.dataset.color = swatchGoatColor.toHexa();

            const checkerboardDiv = document.createElement("div");
            checkerboardDiv.classList.add("checkerboard-element");
            checkerboardDiv.style.opacity = (1 - o).toFixed(2);

            const colorOverlayDiv = document.createElement("div");
            colorOverlayDiv.classList.add("color-overlay-element");
            colorOverlayDiv.style.backgroundColor = `rgba(${swatchRgba.r}, ${swatchRgba.g}, ${swatchRgba.b}, ${swatchRgba.a})`;

            _addClickListenerToSwatch(colorInputMainDiv);

            colorInputMainDiv.appendChild(checkerboardDiv);
            colorInputMainDiv.appendChild(colorOverlayDiv);
            colorItem.appendChild(colorInputMainDiv);
            return colorItem;
        },

        updatePaintboxSwatchUI: function (swatchElement, goatColorInstance) {
            const index = parseInt(swatchElement.dataset.index, 10);
            GPG.state.paintboxColors[index] = (goatColorInstance && goatColorInstance.isValid()) ? goatColorInstance : null;

            if (goatColorInstance && goatColorInstance.isValid()) {
                const hex = goatColorInstance.toHex().toUpperCase();
                const hexa = goatColorInstance.toHexa();
                swatchElement.style.backgroundColor = hexa;
                swatchElement.title = `${hex}\nDrag or click to select.`;
                swatchElement.dataset.color = hexa;
            } else {
                swatchElement.style.backgroundColor = "var(--color-bg-input)";
                swatchElement.title = "Empty";
                swatchElement.dataset.color = "";
            }
            const hasColors = GPG.state.paintboxColors.some((c) => c && c.isValid());
            GPG.elements.exportActionButton.disabled = !hasColors;
        }
    });
}(window.GPG));