<script lang="ts">
    import { CircleX } from 'lucide-svelte';
    import PaintboxGrid from '../components/PaintboxGrid.svelte';
    import { getApp } from '../context';
    import type { PaintboxSortMode } from '../stores/paintbox.svelte';
    import { exportPdf, exportPng, exportSvg } from '../utils/export';

    interface Props {
        onExport: () => void;
    }

    let { onExport }: Props = $props();

    const app = getApp();
    const { paintbox } = app;

    const sortOptions: { label: string; value: PaintboxSortMode }[] = [
        { label: 'Recent', value: 'recent' },
        { label: 'Hue', value: 'hue' },
        { label: 'Bright', value: 'lightness' },
        { label: 'Vivid', value: 'chroma' },
    ];
</script>

<section
    class="
      flex h-full flex-col justify-between rounded-xl border
      border-(--ui-border) bg-(--ui-card) p-8 shadow-xl
    ">
    <div class="space-y-6">
        <div
            class="
              flex flex-col items-start justify-between gap-4
              sm:flex-row sm:items-center
            ">
            <h2
                class="
                  shrink-0 text-xs font-black tracking-widest
                  text-(--ui-text-muted) uppercase
                ">
                Paintbox
            </h2>

            <div
                class="
                  flex w-full flex-wrap items-center gap-2
                  sm:w-auto
                ">
                <select
                    id="paintboxSort"
                    bind:value={paintbox.sortMode}
                    class="
                      flex-1 cursor-pointer rounded-lg border
                      border-(--ui-border) bg-(--ui-bg) px-2 py-1.5 text-xs
                      font-bold uppercase transition-all outline-none
                      focus:border-(--current-color)
                      sm:flex-none
                    ">
                    {#each sortOptions as option (option.value)}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>

                <button
                    onclick={() => paintbox.clear()}
                    disabled={paintbox.items.length === 0}
                    class="
                      shrink-0 rounded-lg border border-(--ui-border)
                      bg-(--ui-bg) p-2 text-(--ui-text-muted) shadow-sm
                      transition-all
                      hover:bg-red-500 hover:text-white
                      {paintbox.items.length > 0 ? 'opacity-100' : `pointer-events-none opacity-0`}"
                    title="Clear Paintbox">
                    <CircleX class="size-4" />
                </button>
            </div>
        </div>

        <PaintboxGrid />
    </div>

    <!-- Export Options -->
    <div class="mt-8 space-y-3">
        <h3
            class="
              text-xs font-black tracking-widest text-(--ui-text-muted)
              uppercase
            ">
            Export
        </h3>
        <div class="grid grid-cols-4 gap-3">
            <button
                onclick={() => exportPng(app)}
                class="
                  hover:text-on-current
                  cursor-pointer rounded-2xl border border-(--ui-border)
                  bg-(--ui-bg) p-4 text-xs font-black uppercase shadow-sm
                  transition-all
                  hover:bg-(--current-color)
                ">PNG</button>
            <button
                onclick={() => exportSvg(app)}
                class="
                  hover:text-on-current
                  cursor-pointer rounded-2xl border border-(--ui-border)
                  bg-(--ui-bg) p-4 text-xs font-black uppercase shadow-sm
                  transition-all
                  hover:bg-(--current-color)
                ">SVG</button>
            <button
                onclick={() => exportPdf(app)}
                class="
                  hover:text-on-current
                  cursor-pointer rounded-2xl border border-(--ui-border)
                  bg-(--ui-bg) p-4 text-xs font-black uppercase shadow-sm
                  transition-all
                  hover:bg-(--current-color)
                ">PDF</button>
            <button
                onclick={onExport}
                class="
                  hover:text-on-current
                  cursor-pointer rounded-2xl border border-(--ui-border)
                  bg-(--ui-bg) p-4 text-xs font-black uppercase shadow-sm
                  transition-all
                  hover:bg-(--current-color)
                ">Code</button>
        </div>
    </div>
</section>
