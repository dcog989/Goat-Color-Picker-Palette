import { ColorStore } from './color.svelte';
import { EngineStore } from './engine.svelte';
import { ImageStore } from './image.svelte';
import { PaintboxStore } from './paintbox.svelte';
import { ThemeStore } from './theme.svelte';
import { ToastStore } from './toast.svelte';

export class RootStore {
    precision = $state<'scientific' | 'sensible'>('sensible');
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
}
