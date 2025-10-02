// Goat Color Picker Palette
//
window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    function initializeApp() {
        if (typeof GoatColor === "undefined" || typeof GoatColor.getMaxSRGBChroma === "undefined") {
            setTimeout(initializeApp, 50);
            return;
        }

        GPG.cacheElements();
        if (!GPG.validateCachedElements()) {
            if (GPG.elements.paletteContainer) GPG.elements.paletteContainer.innerHTML = "<p>Error: App Init Failed. Check console.</p>";
            return;
        }

        // --- Initial State Setup ---
        GPG.elements.appVersion.textContent = `v${GPG.APP_VERSION}`;
        GPG.state.originalBinTitle = GPG.elements.paintboxBin.title;
        const lastActiveMode = localStorage.getItem('goatPaletteGenerator_activeMode') || 'hsl';
        document.getElementById(`mode-${lastActiveMode}`).checked = true;
        GPG.state.activePickerMode = lastActiveMode;

        GPG.elements.copyButtons.forEach(button => {
            const span = button.querySelector('.visually-hidden');
            button.innerHTML = GPG.SVG_COPY_ICON;
            if (span) {
                button.appendChild(span);
            }
        });

        const initialH = Math.floor(Math.random() * (245 - 4 + 1)) + 4;
        const initialL_oklch = 45;
        const initialC_oklch = 0.13;
        const initialO = 100;

        GPG.state.currentGoatColor = GoatColor(`oklch(${initialL_oklch}% ${initialC_oklch} ${initialH} / ${initialO / 100})`);
        if (!GPG.state.currentGoatColor.isValid()) {
            GPG.state.currentGoatColor = GoatColor(`oklch(45% 0.13 200 / 1)`); // Fallback
            console.error("Failed to initialize with random OKLCH color, using default.");
        }

        const initialHsl = GPG.state.currentGoatColor.toHsl();
        const initialOklch = GPG.state.currentGoatColor.toOklch();
        GPG.state.lastHslHue = initialHsl.h;
        GPG.state.lastOklchHue = initialOklch.h;

        GPG.elements.swatchCountInput.value = 8;

        document.getElementById("format-hsl").checked = true;

        // --- Bind Events ---
        GPG.events.bindEventListeners();

        // --- Initial UI Render ---
        const savedTheme = localStorage.getItem('goatPaletteGenerator_theme') || 'system';
        GPG.elements.themeSelect.value = savedTheme;
        GPG.theme.applyTheme(savedTheme);

        GPG.ui.initializeH1Styles();
        GPG.ui.initializePaintbox();

        // Trigger change to set correct initial picker UI
        document.querySelector(`input[name="picker-mode"]:checked`).dispatchEvent(new Event('change'));

        GPG.ui.syncAllUiFromState();

        try {
            GPG.palette.generate();
            GPG.handlers.generateAndDisplayTheoryPalette();
        } catch (e) {
            console.error("Error during initial generation:", e);
        }
    }

    document.addEventListener("DOMContentLoaded", initializeApp);

}(window.GPG));