import { calcAPCA } from 'apca-w3';
import type { Oklch } from 'culori/fn';
import { PRECISION } from '../constants';
import {
    generateColors,
    getAllHarmonies,
    isHarmonyMode,
    type GenerationMode,
    type HarmonyType,
} from '../utils/harmonies';
import type { ColorStore } from './color.svelte';
import ColorNameSearchWorker from '../workers/color-name-search.ts?worker';

export class EngineStore {
    closestName = $state('Searching...');
    #searchWorker: Worker | null = null;
    #debounceHandle: number | null = null;
    #initialized = false;
    #colorStore: ColorStore;
    #workerRetryCount = 0;
    #maxWorkerRetries = 3;
    #workerRetryDelay = 1000;

    // Palette generation configuration
    genSteps = $state(8);
    genAxis = $state<GenerationMode>('l');

    // Derived properties
    contrastWhite: string;
    contrastBlack: string;
    isHarmonyMode: boolean;
    harmonies: Record<HarmonyType, string[]>;
    generated: string[];

    constructor(colorStore: ColorStore) {
        this.#colorStore = colorStore;

        // Initialize derived properties in constructor to ensure #colorStore is available
        this.contrastWhite = $derived.by(() => {
            const raw = calcAPCA('#ffffff', this.#colorStore.hex);
            return (typeof raw === 'number' ? Math.abs(raw) : 0).toFixed(
                PRECISION.CONTRAST_DISPLAY,
            );
        });

        this.contrastBlack = $derived.by(() => {
            const raw = calcAPCA('#000000', this.#colorStore.hex);
            return (typeof raw === 'number' ? Math.abs(raw) : 0).toFixed(
                PRECISION.CONTRAST_DISPLAY,
            );
        });

        this.isHarmonyMode = $derived(isHarmonyMode(this.genAxis));

        this.harmonies = $derived(getAllHarmonies(this.#getBaseColor()));

        this.generated = $derived.by(() => {
            return generateColors(this.#getBaseColor(), this.genAxis, this.genSteps);
        });
    }

    init() {
        if (this.#initialized) return;
        this.#initialized = true;

        // Initialize the worker
        this.#initWorker();

        // Reactive effect to trigger name search when color changes
        $effect(() => {
            // Track dependencies
            const current = {
                mode: 'oklch' as const,
                l: this.#colorStore.l,
                c: this.#colorStore.c,
                h: this.#colorStore.h,
            } as Oklch;

            // Debounce rapid color changes
            if (this.#debounceHandle !== null) {
                clearTimeout(this.#debounceHandle);
            }

            this.#debounceHandle = setTimeout(() => {
                this.#searchColorName(current);
                this.#debounceHandle = null;
            }, 150) as unknown as number;
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

    #searchColorName(color: Oklch) {
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

    // Get current base color as Oklch
    #getBaseColor(): Oklch {
        return {
            mode: 'oklch',
            l: this.#colorStore.l,
            c: this.#colorStore.c,
            h: this.#colorStore.h,
            alpha: this.#colorStore.alpha,
        };
    }
}
