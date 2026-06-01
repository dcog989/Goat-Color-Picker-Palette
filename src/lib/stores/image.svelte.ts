import { colordx } from '@colordx/core';
import { IMAGE_ANALYSIS } from '../constants';
import ColorAnalysisWorker from '../workers/color-analysis.ts?worker';

export type SortMode = 'dominant' | 'vibrant' | 'bright' | 'dark';

export class ImageStore {
    mosaicData = $state<{ color: string; pixels: number }[]>([]);

    sortMode = $state<SortMode>('dominant');
    isProcessing = $state(false);
    previewUrl = $state<string>('');
    currentFile = $state<File | null>(null);

    #activeWorker: Worker | null = null;

    extractedPalette = $derived.by(() => {
        if (!this.mosaicData.length) return [];

        const candidates = [...this.mosaicData];

        const getL = (hex: string) => {
            const parsed = colordx(hex);
            return parsed.isValid() ? parsed.toOklch().l : 0;
        };
        const getC = (hex: string) => {
            const parsed = colordx(hex);
            return parsed.isValid() ? parsed.toOklch().c : 0;
        };

        switch (this.sortMode) {
            case 'vibrant':
                candidates.sort((a, b) => getC(b.color) - getC(a.color));
                break;
            case 'bright':
                candidates.sort((a, b) => getL(b.color) - getL(a.color));
                break;
            case 'dark':
                candidates.sort((a, b) => getL(a.color) - getL(b.color));
                break;
            default:
                candidates.sort((a, b) => b.pixels - a.pixels);
                break;
        }

        return candidates.slice(0, 24).map((c) => c.color);
    });

    async analyze(file: File) {
        if (
            !IMAGE_ANALYSIS.ALLOWED_TYPES.includes(
                file.type as (typeof IMAGE_ANALYSIS.ALLOWED_TYPES)[number],
            )
        ) {
            throw new Error(
                `Unsupported format. Please use JPEG, PNG, WEBP, AVIF, GIF, BMP, or SVG.`,
            );
        }
        if (file.size > IMAGE_ANALYSIS.MAX_FILE_SIZE) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            const maxMb = IMAGE_ANALYSIS.MAX_FILE_SIZE / (1024 * 1024);
            throw new Error(`Image too large (${sizeMb}MB). Max size is ${maxMb}MB.`);
        }

        this.#terminateWorker();

        this.isProcessing = true;
        this.currentFile = file;

        if (this.previewUrl) {
            URL.revokeObjectURL(this.previewUrl);
        }
        this.previewUrl = URL.createObjectURL(file);

        try {
            const bitmap = await createImageBitmap(file);

            const width = IMAGE_ANALYSIS.DOWNSAMPLE_SIZE;
            const height = IMAGE_ANALYSIS.DOWNSAMPLE_SIZE;

            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                bitmap.close();
                this.isProcessing = false;
                return;
            }

            ctx.drawImage(bitmap, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);

            bitmap.close();

            this.#activeWorker = new ColorAnalysisWorker();

            this.#activeWorker.onmessage = (
                e: MessageEvent<{
                    colors: string[];
                    clusters: { color: string; pixels: number }[];
                }>,
            ) => {
                this.mosaicData = e.data.clusters;
                this.isProcessing = false;
                this.#terminateWorker();
            };

            this.#activeWorker.postMessage({ imageData, distance: 0.05 }, [imageData.data.buffer]);

            this.#activeWorker.onerror = (error) => {
                console.error('Worker error:', error);
                this.isProcessing = false;
                this.#terminateWorker();
            };
        } catch (error) {
            console.error('Image analysis error:', error);
            this.isProcessing = false;
            this.#terminateWorker();
            throw error;
        }
    }

    clear() {
        this.mosaicData = [];
        this.currentFile = null;
        if (this.previewUrl) {
            URL.revokeObjectURL(this.previewUrl);
            this.previewUrl = '';
        }
        this.#terminateWorker();
    }

    #terminateWorker() {
        if (this.#activeWorker) {
            this.#activeWorker.terminate();
            this.#activeWorker = null;
        }
    }

    destroy() {
        this.clear();
        this.#terminateWorker();
    }
}
