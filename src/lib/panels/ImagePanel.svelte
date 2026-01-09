<script lang="ts">
    import { Copy, Image, LayersPlus, Plus, X } from "lucide-svelte";
    import { onDestroy } from "svelte";
    import { IMAGE_ANALYSIS } from "../constants";
    import { getApp } from "../context";
    import type { SortMode } from "../stores/image.svelte";

    const { color, image: imageAnalyzer, paintbox, toast } = getApp();

    let isDragging = $state(false);

    // Create fixed-length array for grid to prevent layout shifts
    const gridColors = $derived.by(() => {
        const colors = imageAnalyzer.extractedPalette;
        return Array.from({ length: 24 }, (_, i) => colors[i] ?? null);
    });

    const handleFiles = async (files: FileList | null) => {
        if (files?.[0]) {
            try {
                await imageAnalyzer.analyze(files[0]);
            } catch (err) {
                toast.show(err instanceof Error ? err.message : "Failed to analyze image");
            }
        }
    };

    const handleInput = (e: Event) => {
        const input = e.target as HTMLInputElement;
        handleFiles(input.files);
    };

    const onDragOver = (e: DragEvent) => {
        e.preventDefault();
        isDragging = true;
    };

    const onDragLeave = () => {
        isDragging = false;
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        isDragging = false;
        if (e.dataTransfer?.files) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const copy = (swatchCss: string, e?: MouseEvent) => {
        const formatted = color.formatColor(swatchCss);
        navigator.clipboard.writeText(formatted);
        toast.show("Copied", e);
    };

    const addAll = (e?: MouseEvent) => {
        imageAnalyzer.extractedPalette.forEach((c) => paintbox.add(c));
        toast.show("Added All to Paintbox", e);
    };

    const handleKeyDown = (e: KeyboardEvent, swatch: string) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            color.set(swatch);
        }
    };

    const sortOptions: { label: string; value: SortMode }[] = [
        { label: "Dominant", value: "dominant" },
        { label: "Vibrant", value: "vibrant" },
        { label: "Bright", value: "bright" },
        { label: "Dark", value: "dark" },
    ];

    onDestroy(() => {
        imageAnalyzer.destroy();
    });
</script>

<section class="p-8 rounded-xl bg-[var(--ui-card)] border border-[var(--ui-border)] shadow-xl h-full flex flex-col">
    <div class="flex items-center justify-between mb-6 shrink-0">
        <h2 class="text-xs font-black uppercase tracking-widest text-[var(--ui-text-muted)]">Image Analyser</h2>
    </div>

    <div class="space-y-6 flex-1">
        {#if !imageAnalyzer.mosaicData.length}
            <div class="relative h-full flex flex-col justify-center">
                <input type="file" id="img-upload" accept={IMAGE_ANALYSIS.ALLOWED_TYPES.join(",")} class="hidden" onchange={handleInput} />
                <label for="img-upload" class="flex flex-col items-center justify-center p-12 rounded-2xl bg-[var(--ui-bg)] border-2 border-dashed transition-all cursor-pointer min-h-[260px] h-full" class:border-brand={isDragging} class:border-[var(--ui-border)]={!isDragging} class:bg-[var(--current-color)]={isDragging} class:bg-opacity-10={isDragging} ondragover={onDragOver} ondragleave={onDragLeave} ondrop={onDrop}>
                    <Image class="w-12 h-12 mb-4 opacity-40 pointer-events-none" />
                    <span class="text-sm font-bold uppercase tracking-wider pointer-events-none">
                        {imageAnalyzer.isProcessing ? "Processing..." : "Drop Image or Click to Upload"}
                    </span>
                    <span class="text-xs opacity-40 mt-2 pointer-events-none">JPEG, PNG, WEBP, AVIF, GIF, BMP, SVG</span>
                </label>
            </div>
        {:else}
            <!-- Controls & Thumbnail -->
            <div class="flex flex-col md:flex-row gap-6 p-4 bg-[var(--ui-bg)] rounded-xl border border-[var(--ui-border)]">
                <!-- Thumbnail -->
                <div class="relative group shrink-0 mx-auto md:mx-0">
                    <img src={imageAnalyzer.previewUrl} alt="Analyzed" class="w-64 h-64 object-cover rounded-lg border border-[var(--ui-border)] shadow-sm bg-[var(--ui-card)]" />

                    <button onclick={() => imageAnalyzer.clear()} class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all rounded-lg cursor-pointer" title="Clear Image">
                        <div class="p-4 bg-white/20 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-md">
                            <X class="w-8 h-8" />
                        </div>
                    </button>
                </div>

                <!-- Controls -->
                <div class="flex-1 min-w-0 flex flex-col gap-4">
                    <label for="sort-mode" class="text-xs font-bold uppercase text-[var(--ui-text-muted)] block">Ordered By:</label>
                    <div class="flex flex-col gap-2" role="radiogroup" aria-label="Sort Mode">
                        {#each sortOptions as option}
                            <button class="px-4 py-3 text-xs font-bold uppercase rounded-md border transition-all text-left flex justify-between items-center {imageAnalyzer.sortMode === option.value ? 'bg-[var(--current-color)] text-on-current border-transparent shadow-md' : 'bg-[var(--ui-card)] border-[var(--ui-border)] hover:border-[var(--current-color)]'}" onclick={() => (imageAnalyzer.sortMode = option.value)} aria-checked={imageAnalyzer.sortMode === option.value} role="radio">
                                {option.label}
                                {#if imageAnalyzer.sortMode === option.value}
                                    <div class="w-2 h-2 rounded-full bg-white/50"></div>
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>

            <!-- Extracted Colors Grid -->
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">Palette</h3>
                    <div class="flex items-center gap-3">
                        <span class="text-xs font-mono text-[var(--ui-text-muted)]">Top 24</span>
                        <button onclick={(e) => addAll(e)} class="p-2 bg-[var(--ui-bg)] hover:bg-[var(--current-color)] hover:text-white border border-[var(--ui-border)] rounded-lg transition-all shadow-sm shrink-0 text-[var(--ui-text-muted)]" title="Add All to Paintbox">
                            <LayersPlus class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-6 gap-2">
                    {#each gridColors as swatch, i (i)}
                        {#if swatch !== null}
                            <div role="button" tabindex="0" class="group relative aspect-square rounded-lg border border-white/10 shadow-md transition-all cursor-pointer overflow-hidden hover:scale-105 [background:var(--swatch-color)]" style:--swatch-color={swatch} title={color.formatColor(swatch)} onclick={() => color.set(swatch)} onkeydown={(e) => handleKeyDown(e, swatch)} aria-label="Select extracted color {i + 1}">
                                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            paintbox.add(swatch);
                                            toast.show("Added", e);
                                        }}
                                        class="bg-white/30 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/50 transition-all hover:scale-115 shadow-lg cursor-pointer"
                                        title="Add to paintbox"
                                        type="button"
                                    >
                                        <Plus class="w-3 h-3 pointer-events-none" />
                                    </button>
                                    <button
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            copy(swatch, e);
                                        }}
                                        class="bg-white/30 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/50 transition-all hover:scale-115 shadow-lg cursor-pointer"
                                        title="Copy"
                                        type="button"
                                    >
                                        <Copy class="w-3 h-3 pointer-events-none" />
                                    </button>
                                </div>
                            </div>
                        {:else}
                            <div class="aspect-square rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] opacity-30"></div>
                        {/if}
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</section>
