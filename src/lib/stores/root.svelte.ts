import { extend } from '@colordx/core';
import a11y from '@colordx/core/plugins/a11y';
import cmyk from '@colordx/core/plugins/cmyk';
import harmonies from '@colordx/core/plugins/harmonies';
import lab from '@colordx/core/plugins/lab';

import { ColorStore } from './color.svelte';
import { EngineStore } from './engine.svelte';
import { ImageStore } from './image.svelte';
import { PaintboxStore } from './paintbox.svelte';
import { ThemeStore } from './theme.svelte';
import { ToastStore } from './toast.svelte';

extend([a11y, harmonies, cmyk, lab]);

export class RootStore {
    precision = $state<'precise' | 'practical'>('practical');
    color: ColorStore;
    toast = new ToastStore();
    paintbox = new PaintboxStore();
    image = new ImageStore();
    theme = new ThemeStore();
    engine: EngineStore;

    constructor() {
        // ColorStore depends on precision getter
        this.color = new ColorStore(() => this.precision);
        // Engine depends on Color
        this.engine = new EngineStore(this.color);
    }

    init() {
        this.theme.init();
        this.paintbox.init();
        this.engine.init();
    }

    destroy() {
        this.engine.destroy();
        this.image.destroy();
    }

    copy(text: string, e?: MouseEvent) {
        navigator.clipboard.writeText(text);
        this.toast.show('Copied', e);
    }
}
