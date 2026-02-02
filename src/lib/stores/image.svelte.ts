import { converter, parse, type Oklch } from 'culori/fn';
import { SvelteURL } from 'svelte/reactivity';
import { IMAGE_ANALYSIS } from '../constants';

const toOklch = converter<Oklch>('oklch');

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
        const getOklch = (() => {
            // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Internal computation cache, not reactive state
            const cache = new Map<string, Oklch>();
            return (hex: string) => {
                if (!cache.has(hex)) {
                    const parsed = parse(hex);
                    const converted = parsed ? toOklch(parsed) : undefined;
                    const val: Oklch = converted || { mode: 'oklch', l: 0, c: 0, h: 0 };
                    cache.set(hex, val);
                }
                return cache.get(hex)!;
            };
        })();

        switch (this.sortMode) {
            case 'vibrant':
                candidates.sort((a, b) => getOklch(b.color).c - getOklch(a.color).c);
                break;
            case 'bright':
                candidates.sort((a, b) => getOklch(b.color).l - getOklch(a.color).l);
                break;
            case 'dark':
                candidates.sort((a, b) => getOklch(a.color).l - getOklch(b.color).l);
                break;
            case 'dominant':
            default:
                candidates.sort((a, b) => b.pixels - a.pixels);
                break;
        }

        return candidates.slice(0, 24).map((c) => c.color);
    });

    async analyze(file: File) {
        // Validation
        // File type validation from external source - file.type is validated against known MIME types
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
            // 1. Decode image (Async, off-main-thread usually)
            const bitmap = await createImageBitmap(file);

            // 2. CONSTANT SIZE: Always scale to a small fixed size (256x256 = 65k pixels)
            // This ensures performance O(1) regardless of input image megapixels.
            const width = IMAGE_ANALYSIS.DOWNSAMPLE_SIZE;
            const height = IMAGE_ANALYSIS.DOWNSAMPLE_SIZE;

            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                bitmap.close();
                this.isProcessing = false;
                return;
            }

            // 3. Draw and Scale (GPU/Hardware accelerated)
            ctx.drawImage(bitmap, 0, 0, width, height);

            // 4. Read small buffer (Fast, ~65k pixels)
            const imageData = ctx.getImageData(0, 0, width, height);

            // Cleanup bitmap immediately
            bitmap.close();

            this.#activeWorker = new Worker(
                new SvelteURL('../workers/color-analysis.ts', import.meta.url),
                { type: 'module' },
            );

            // 5. Zero-Copy Transfer
            this.#activeWorker.postMessage({ imageData, distance: 0.05 }, [imageData.data.buffer]);

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

            this.#activeWorker.onerror = (error) => {
                console.error('Worker error:', error);
                this.isProcessing = false;
                this.#terminateWorker();
            };
        } catch (error) {
            console.error('Image analysis error:', error);
            this.isProcessing = false;
            this.#terminateWorker();
            // Re-throw to allow UI to notify user
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
