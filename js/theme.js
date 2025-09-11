window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    GPG.theme = {
        applyTheme: function (theme) {
            const root = document.documentElement;

            if (theme === 'system') {
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                root.classList.toggle('theme-light', !prefersDark);
            } else {
                root.classList.toggle('theme-light', theme === 'light');
            }

            // Refresh UI elements that depend on theme changes
            GPG.ui.updateAllSliderBackgrounds();
            GPG.ui.updateDynamicSliderThumbStyles();
            GPG.ui.updateH1CharacterStyles();
            if (GPG.state.generatedColors.length > 0) {
                GPG.elements.paletteContainer.innerHTML = "";
                const fragment = document.createDocumentFragment();
                for (const color of GPG.state.generatedColors) {
                    const swatchEl = GPG.ui.createSwatch(color);
                    if (swatchEl) {
                        fragment.appendChild(swatchEl);
                    }
                }
                GPG.elements.paletteContainer.appendChild(fragment);
            }
        }
    };
}(window.GPG));