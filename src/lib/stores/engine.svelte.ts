import { colordx } from '@colordx/core';
import { PRECISION } from '../constants';
import { type GenerationMode, generatePalette, isHarmonyMode } from '../utils/palette';
import ColorNameSearchWorker from '../workers/color-name-search.ts?worker';
import type { ColorStore } from './color.svelte';

export class EngineStore {
    closestName = $state('Searching...');
    #searchWorker: Worker | null = null;
    #debounceHandle: number | null = null;
    #initialized = false;
    #colorStore: ColorStore;
    #workerRetryCount = 0;
    #maxWorkerRetries = 3;
    #workerRetryDelay = 1000;

    genSteps = $state(8);
    genAxis = $state<GenerationMode>('l');

    constructor(colorStore: ColorStore) {
        this.#colorStore = colorStore;
    }

    #contrastWhite = $derived.by((): string => {
        try {
            const current = colordx(this.#colorStore.hex);
            const raw = current.apcaContrast('#fff');
            return Math.abs(raw).toFixed(PRECISION.CONTRAST_DISPLAY);
        } catch {
            return '0';
        }
    });

    get contrastWhite(): string {
        return this.#contrastWhite;
    }

    #contrastBlack = $derived.by((): string => {
        try {
            const current = colordx(this.#colorStore.hex);
            const raw = current.apcaContrast('#000');
            return Math.abs(raw).toFixed(PRECISION.CONTRAST_DISPLAY);
        } catch {
            return '0';
        }
    });

    get contrastBlack(): string {
        return this.#contrastBlack;
    }

    #isHarmonyMode = $derived(isHarmonyMode(this.genAxis));

    get isHarmonyMode(): boolean {
        return this.#isHarmonyMode;
    }

    #generated = $derived.by((): string[] => {
        if (isHarmonyMode(this.genAxis)) {
            const base = this.#getBaseColor();
            return colordx({ l: base.l, c: base.c, h: base.h })
                .harmonies(this.genAxis)
                .map((c) => c.toHex());
        }
        return generatePalette(this.#getBaseColor(), this.genAxis, this.genSteps);
    });

    get generated(): string[] {
        return this.#generated;
    }

    init() {
        if (this.#initialized) return;
        this.#initialized = true;

        this.#initWorker();

        $effect(() => {
            const current = {
                l: this.#colorStore.l,
                c: this.#colorStore.c,
                h: this.#colorStore.h,
                alpha: this.#colorStore.alpha,
            };

            if (this.#debounceHandle !== null) {
                clearTimeout(this.#debounceHandle);
            }

            this.#debounceHandle = window.setTimeout(() => {
                this.#searchColorName(current);
                this.#debounceHandle = null;
            }, 150);
        });
    }

    #initWorker() {
        try {
            this.#searchWorker = new ColorNameSearchWorker();

            this.#searchWorker.onmessage = (e: MessageEvent<{ type: string; name: string }>) => {
                if (e.data.type === 'result') {
                    this.closestName = e.data.name;
                    this.#workerRetryCount = 0;
                }
            };

            this.#searchWorker.onerror = (error) => {
                console.error('Color name search worker error:', error);
                this.closestName = 'Custom Color';
                this.#terminateWorker();

                if (this.#workerRetryCount < this.#maxWorkerRetries) {
                    this.#workerRetryCount++;
                    const delay = this.#workerRetryDelay * this.#workerRetryCount;
                    setTimeout(() => {
                        this.#initWorker();
                    }, delay);
                } else {
                    console.error('Max worker retry attempts reached. Giving up.');
                }
            };
        } catch (error) {
            console.error('Failed to initialize color name search worker:', error);
            this.closestName = 'Custom Color';

            if (this.#workerRetryCount < this.#maxWorkerRetries) {
                this.#workerRetryCount++;
                const delay = this.#workerRetryDelay * this.#workerRetryCount;
                setTimeout(() => {
                    this.#initWorker();
                }, delay);
            } else {
                console.error('Max worker initialization attempts reached. Giving up.');
            }
        }
    }

    #searchColorName(color: { l: number; c: number; h: number; alpha: number }) {
        if (!this.#searchWorker) {
            this.closestName = 'Custom Color';
            return;
        }

        try {
            this.#searchWorker.postMessage({
                type: 'search',
                color: color,
            });
        } catch (error) {
            console.error('Failed to send message to worker:', error);
            this.closestName = 'Custom Color';
        }
    }

    #terminateWorker() {
        if (this.#searchWorker) {
            this.#searchWorker.terminate();
            this.#searchWorker = null;
        }
    }

    destroy() {
        if (this.#debounceHandle !== null) {
            clearTimeout(this.#debounceHandle);
            this.#debounceHandle = null;
        }
        this.#terminateWorker();
        this.#workerRetryCount = 0;
    }

    #getBaseColor(): { l: number; c: number; h: number; alpha: number } {
        return {
            l: this.#colorStore.l,
            c: this.#colorStore.c,
            h: this.#colorStore.h,
            alpha: this.#colorStore.alpha,
        };
    }
}
