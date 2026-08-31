import { colordx } from '@colordx/core';
import { PRECISION } from '../constants';
import { type GenerationMode, generatePalette, isHarmonyMode } from '../utils/palette';
import { ManagedWorker } from '../utils/worker-manager';
import ColorNameSearchWorker from '../workers/color-name-search.ts?worker';
import type { ColorStore } from './color.svelte';

export type WorkerMessageData = {
  type: string;
  name?: string;
  colors?: Array<{ name: string; hex: string }>;
  total?: number;
};

export class EngineStore {
  closestName = $state('Searching...');
  #managedWorker = new ManagedWorker<WorkerMessageData>({ maxRetries: 3, retryDelay: 1000 });
  #debounceHandle: number | null = null;
  #initialized = false;
  #pendingSearch: { l: number; c: number; h: number; alpha: number } | null = null;
  #colorStore: ColorStore;

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
    this.#managedWorker.init(
      () => new ColorNameSearchWorker(),
      {
        onMessage: (data) => {
          if (data.type === 'result') {
            this.#pendingSearch = null;
            this.closestName = data.name ?? 'Custom Color';
          }
        },
        onError: () => {
          this.closestName = 'Custom Color';
        },
        onReady: () => {
          if (this.#pendingSearch) {
            this.#managedWorker.post({ type: 'search', color: this.#pendingSearch });
          }
        },
      },
      'Color name search worker',
    );
  }

  #searchColorName(color: { l: number; c: number; h: number; alpha: number }) {
    this.#pendingSearch = color;
    this.#managedWorker.post({ type: 'search', color });
  }

  destroy() {
    if (this.#debounceHandle !== null) {
      clearTimeout(this.#debounceHandle);
      this.#debounceHandle = null;
    }
    this.#managedWorker.destroy();
  }

  subscribeToWorker(handler: (msg: WorkerMessageData) => void): () => void {
    return this.#managedWorker.subscribe(handler);
  }

  postToWorker(data: Record<string, unknown>): void {
    this.#managedWorker.post(data);
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
