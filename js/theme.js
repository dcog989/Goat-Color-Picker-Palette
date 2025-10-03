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
        }
    };
}(window.GPG));