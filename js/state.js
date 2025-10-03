window.GPG = window.GPG || {};

(function (GPG) {
    'use strict';

    GPG.state = {
        activePickerMode: "hsl",
        currentGoatColor: null,
        debounceTimer: null,
        h1UpdateDebounceTimer: null,
        generatedColors: [],
        h1Chars: [],
        isUiUpdateThrottled: false,
        lastHslHue: 0,
        lastOklchHue: 0,
        theoryPaletteCache: [],
        paintboxColors: [],
        draggedItem: { element: null, colorInstance: null, sourceType: null, originalIndex: -1 },
        binClearState: { ready: false, timeoutId: null, notificationElement: null },
        originalBinTitle: "",
        diag: {
            createFromPicker: {},
            sliderGradient: {}
        }
    };

}(window.GPG));