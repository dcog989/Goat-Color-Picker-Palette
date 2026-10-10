import { colordx } from "@colordx/core";
import { IMAGE_ANALYSIS } from "../constants";
import { validateImageFile } from "../utils/validate-image";
import { ManagedWorker } from "../utils/worker-manager";
import ColorAnalysisWorker from "../workers/color-analysis.ts?worker";

export type SortMode = "dominant" | "vibrant" | "bright" | "dark";

type ImageWorkerMessage = {
  clusters: { color: string; pixels: number }[];
};

export class ImageStore {
  mosaicData = $state<{ color: string; pixels: number }[]>([]);

  sortMode = $state<SortMode>("dominant");
  isProcessing = $state(false);
  previewUrl = $state<string>("");
  currentFile = $state<File | null>(null);

  #managedWorker = new ManagedWorker<ImageWorkerMessage>();

  extractedPalette = $derived.by(() => {
    if (!this.mosaicData.length) return [];

    const needsColor = this.sortMode !== "dominant";
    const candidates = this.mosaicData.map((item) => {
      let l = 0;
      let c = 0;
      if (needsColor) {
        const parsed = colordx(item.color);
        if (parsed.isValid()) {
          const oklch = parsed.toOklch();
          l = oklch.l;
          c = oklch.c;
        }
      }
      return { color: item.color, pixels: item.pixels, l, c };
    });

    switch (this.sortMode) {
      case "vibrant":
        candidates.sort((a, b) => b.c - a.c);
        break;
      case "bright":
        candidates.sort((a, b) => b.l - a.l);
        break;
      case "dark":
        candidates.sort((a, b) => a.l - b.l);
        break;
      default:
        candidates.sort((a, b) => b.pixels - a.pixels);
        break;
    }

    return candidates.slice(0, 24).map((c) => c.color);
  });

  async analyze(file: File) {
    validateImageFile(file);

    this.#managedWorker.terminate();

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
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bitmap.close();
        this.isProcessing = false;
        return;
      }

      ctx.drawImage(bitmap, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);

      bitmap.close();

      this.#managedWorker.init(
        () => new ColorAnalysisWorker(),
        {
          onMessage: (data) => {
            this.mosaicData = data.clusters;
            this.isProcessing = false;
            this.#managedWorker.terminate();
          },
          onError: () => {
            this.isProcessing = false;
          },
        },
        "Image analysis worker",
      );

      this.#managedWorker.post({ imageData, distance: 0.05 }, [imageData.data.buffer]);
    } catch (error) {
      console.error("Image analysis error:", error);
      this.isProcessing = false;
      this.#managedWorker.terminate();
      throw error;
    }
  }

  clear() {
    this.mosaicData = [];
    this.currentFile = null;
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = "";
    }
    this.#managedWorker.terminate();
  }

  destroy() {
    this.clear();
    this.#managedWorker.destroy();
  }
}
