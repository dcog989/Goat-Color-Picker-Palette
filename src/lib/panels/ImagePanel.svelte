<script lang="ts">
    import { Image, LayersPlus, X } from 'lucide-svelte';
    import { onDestroy } from 'svelte';
    import { IMAGE_ANALYSIS } from '../constants';
    import { getApp } from '../context';
    import type { SortMode } from '../stores/image.svelte';
    import Swatch from '../components/Swatch.svelte';

    const { image: imageAnalyzer, paintbox, toast } = getApp();

    let isDragging = $state(false);

    const gridColors = $derived.by(() => {
        const colors = imageAnalyzer.extractedPalette;
        return Array.from({ length: 24 }, (_, i) => colors[i] ?? null);
    });

    const handleFiles = async (files: FileList | null) => {
        if (files?.[0]) {
            try {
                await imageAnalyzer.analyze(files[0]);
            } catch (err) {
                toast.show(err instanceof Error ? err.message : 'Failed to analyze image');
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

    const addAll = (e?: MouseEvent) => {
        imageAnalyzer.extractedPalette.forEach((c) => paintbox.add(c));
        toast.show('Added All to Paintbox', e);
    };

    const sortOptions: { label: string; value: SortMode }[] = [
        { label: 'Dominant', value: 'dominant' },
        { label: 'Vibrant', value: 'vibrant' },
        { label: 'Bright', value: 'bright' },
        { label: 'Dark', value: 'dark' },
    ];

    onDestroy(() => {
        imageAnalyzer.destroy();
    });
</script>

<section
    class="
      flex h-full flex-col rounded-xl border border-(--ui-border) bg-(--ui-card)
      p-8 shadow-xl
    ">
    <div class="mb-6 flex shrink-0 items-center justify-between">
        <h2
            class="
              text-xs font-black tracking-widest text-(--ui-text-muted)
              uppercase
            ">
            Image Analyser
        </h2>
    </div>

    <div class="flex-1 space-y-6">
        {#if !imageAnalyzer.mosaicData.length}
            <div class="relative flex h-full flex-col justify-center">
                <input
                    type="file"
                    id="img-upload"
                    accept={IMAGE_ANALYSIS.ALLOWED_TYPES.join(',')}
                    class="hidden"
                    onchange={handleInput} />
                <label
                    for="img-upload"
                    class="
                      flex h-full min-h-65 cursor-pointer flex-col items-center
                      justify-center rounded-2xl border-2 border-dashed
                      bg-(--ui-bg) p-12 transition-all
                    "
                    class:border-brand={isDragging}
                    class:border-(--ui-border)={!isDragging}
                    style:background-color={isDragging
                        ? 'color-mix(in oklch, var(--current-color) 10%, transparent)'
                        : undefined}
                    ondragover={onDragOver}
                    ondragleave={onDragLeave}
                    ondrop={onDrop}>
                    <Image class="pointer-events-none mb-4 size-12 opacity-40" />
                    <span
                        class="
                          pointer-events-none text-sm font-bold tracking-wider
                          uppercase
                        ">
                        {imageAnalyzer.isProcessing
                            ? 'Processing...'
                            : 'Drop Image or Click to Upload'}
                    </span>
                    <span class="pointer-events-none mt-2 text-xs opacity-40"
                        >JPEG, PNG, WEBP, AVIF, GIF, BMP, SVG</span>
                </label>
            </div>
        {:else}
            <!-- Controls & Thumbnail -->
            <div
                class="
                  flex flex-col gap-6 rounded-xl border border-(--ui-border)
                  bg-(--ui-bg) p-4
                  md:flex-row
                ">
                <!-- Thumbnail -->
                <div
                    class="
                      group relative mx-auto shrink-0
                      md:mx-0
                    ">
                    <img
                        src={imageAnalyzer.previewUrl}
                        alt="Analyzed"
                        class="
                          size-64 rounded-lg border border-(--ui-border)
                          bg-(--ui-card) object-cover shadow-sm
                        " />

                    <button
                        onclick={() => imageAnalyzer.clear()}
                        class="
                          absolute inset-0 flex cursor-pointer items-center
                          justify-center rounded-lg bg-black/40 opacity-0
                          transition-all
                          group-hover:opacity-100
                        "
                        title="Clear Image">
                        <div
                            class="
                              rounded-full bg-white/20 p-4 text-white
                              backdrop-blur-md transition-colors
                              hover:bg-red-500
                            ">
                            <X class="size-8" />
                        </div>
                    </button>
                </div>

                <!-- Controls -->
                <div class="flex min-w-0 flex-1 flex-col gap-4">
                    <label
                        for="sort-mode"
                        class="
                          block text-xs font-bold text-(--ui-text-muted)
                          uppercase
                        ">Ordered By:</label>
                    <div class="flex flex-col gap-2" role="radiogroup" aria-label="Sort Mode">
                        {#each sortOptions as option (option.value)}
                            <button
                                class="
                                  flex items-center justify-between rounded-md
                                  border px-4 py-3 text-left text-xs font-bold
                                  uppercase transition-all
                                  {imageAnalyzer.sortMode === option.value
                                    ? `
                                      text-on-current border-transparent
                                      bg-(--current-color) shadow-md
                                    `
                                    : `
                                      border-(--ui-border) bg-(--ui-card)
                                      hover:border-(--current-color)
                                    `}"
                                onclick={() => (imageAnalyzer.sortMode = option.value)}
                                aria-checked={imageAnalyzer.sortMode === option.value}
                                role="radio">
                                {option.label}
                                {#if imageAnalyzer.sortMode === option.value}
                                    <div
                                        class="
                                      size-2 rounded-full bg-white/50
                                    ">
                                    </div>
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>

            <!-- Extracted Colors Grid -->
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <h3
                        class="
                          text-xs font-bold tracking-wider
                          text-(--ui-text-muted) uppercase
                        ">
                        Palette
                    </h3>
                    <div class="flex items-center gap-3">
                        <span class="font-mono text-xs text-(--ui-text-muted)">Top 24</span>
                        <button
                            onclick={(e) => addAll(e)}
                            class="
                              shrink-0 rounded-lg border border-(--ui-border)
                              bg-(--ui-bg) p-2 text-(--ui-text-muted) shadow-sm
                              transition-all
                              hover:bg-(--current-color) hover:text-white
                            "
                            title="Add All to Paintbox">
                            <LayersPlus class="size-4" />
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-6 gap-2">
                    {#each gridColors as swatch, i (i)}
                        {#if swatch !== null}
                            <Swatch color={swatch} index={i} dynamicClass={false} />
                        {:else}
                            <div
                                class="
                                  aspect-square rounded-lg border
                                  border-(--ui-border) bg-(--ui-bg) opacity-30
                                ">
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</section>
