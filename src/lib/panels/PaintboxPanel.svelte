<script lang="ts">
    import { CircleX } from "lucide-svelte";
    import PaintboxGrid from "../components/PaintboxGrid.svelte";
    import { getApp } from "../context";
    import type { PaintboxSortMode } from "../stores/paintbox.svelte";
    import { exportPdf, exportPng, exportSvg } from "../utils/export";

    interface Props {
        onExport: () => void;
    }

    let { onExport }: Props = $props();

    const app = getApp();
    const { paintbox } = app;

    const sortOptions: { label: string; value: PaintboxSortMode }[] = [
        { label: "Recent", value: "recent" },
        { label: "Hue", value: "hue" },
        { label: "Bright", value: "lightness" },
        { label: "Vivid", value: "chroma" },
    ];
</script>

<section class="p-8 rounded-xl bg-[var(--ui-card)] border border-[var(--ui-border)] shadow-xl h-full flex flex-col justify-between">
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 class="text-xs font-black uppercase tracking-widest text-[var(--ui-text-muted)] shrink-0">Paintbox</h2>

            <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select bind:value={paintbox.sortMode} class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg px-2 py-1.5 text-xs font-bold uppercase outline-none cursor-pointer transition-all focus:border-[var(--current-color)] flex-1 sm:flex-none">
                    {#each sortOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>

                <button onclick={() => paintbox.clear()} disabled={paintbox.items.length === 0} class="p-2 bg-[var(--ui-bg)] hover:bg-red-500 hover:text-white border border-[var(--ui-border)] rounded-lg transition-all shadow-sm shrink-0 text-[var(--ui-text-muted)] {paintbox.items.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}" title="Clear Paintbox">
                    <CircleX class="w-4 h-4" />
                </button>
            </div>
        </div>

        <PaintboxGrid />
    </div>

    <!-- Export Options -->
    <div class="space-y-3 mt-8">
        <h3 class="text-xs font-black uppercase tracking-widest text-[var(--ui-text-muted)]">Export</h3>
        <div class="grid grid-cols-4 gap-3">
            <button onclick={() => exportPng(app)} class="p-4 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl hover:bg-[var(--current-color)] transition-all shadow-sm font-black uppercase text-xs cursor-pointer hover:text-on-current">PNG</button>
            <button onclick={() => exportSvg(app)} class="p-4 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl hover:bg-[var(--current-color)] transition-all shadow-sm font-black uppercase text-xs cursor-pointer hover:text-on-current">SVG</button>
            <button onclick={() => exportPdf(app)} class="p-4 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl hover:bg-[var(--current-color)] transition-all shadow-sm font-black uppercase text-xs cursor-pointer hover:text-on-current">PDF</button>
            <button onclick={onExport} class="p-4 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl hover:bg-[var(--current-color)] transition-all shadow-sm font-black uppercase text-xs cursor-pointer hover:text-on-current">Code</button>
        </div>
    </div>
</section>
