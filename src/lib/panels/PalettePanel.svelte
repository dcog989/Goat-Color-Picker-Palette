<script lang="ts">
    import { converter, parse, type Oklch } from 'culori/fn';
    import { Copy, LayersPlus, ListMinus, ListPlus, Plus } from 'lucide-svelte';
    import { getApp } from '../context';

    const { color, engine, paintbox, toast } = getApp();
    const toOklch = converter<Oklch>('oklch');

    const copy = (swatchCss: string, e?: MouseEvent) => {
        const formatted = color.formatColor(swatchCss);
        navigator.clipboard.writeText(formatted);
        toast.show('Copied', e);
    };

    const addAll = (e?: MouseEvent) => {
        engine.generated.forEach((c: string) => paintbox.add(c));
        toast.show('Added All to Paintbox', e);
    };

    const handleKeyDown = (e: KeyboardEvent, swatch: string) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            color.set(swatch);
        }
    };

    const addRow = () => {
        engine.genSteps = Math.min(20, engine.genSteps + 4);
    };

    const removeRow = () => {
        engine.genSteps = Math.max(2, engine.genSteps - 4);
    };

    const getActionClass = (css: string) => {
        const parsed = parse(css);
        const l = parsed ? (toOklch(parsed)?.l ?? 0) : 0;
        return l > 0.6
            ? 'bg-black/10 hover:bg-black/20 text-black'
            : 'bg-white/20 hover:bg-white/30 text-white';
    };
</script>

<section
    class="p-8 rounded-xl bg-[var(--ui-card)] border border-[var(--ui-border)] shadow-xl h-full">
    <div class="flex flex-col xl:flex-row items-center justify-between gap-4 mb-6">
        <h2
            class="text-xs font-black uppercase tracking-widest text-[var(--ui-text-muted)] shrink-0 self-start xl:self-center">
            Palette
        </h2>

        <div class="flex flex-wrap gap-2 items-center justify-end w-full xl:w-auto">
            <select
                bind:value={engine.genAxis}
                class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg px-3 py-1.5 text-xs font-bold uppercase outline-none cursor-pointer transition-all focus:border-[var(--current-color)] flex-1 xl:flex-none min-w-[140px]">
                <optgroup label="Variables">
                    <option value="l">Lightness</option>
                    <option value="c">Chroma</option>
                    <option value="h">Hue</option>
                    <option value="a">Alpha</option>
                </optgroup>
                <optgroup label="Harmony">
                    <option value="complementary">Complementary</option>
                    <option value="split-complementary">Split Complementary</option>
                    <option value="analogous">Analogous</option>
                    <option value="triadic">Triadic</option>
                    <option value="tetradic">Tetradic</option>
                    <option value="square">Square</option>
                </optgroup>
            </select>

            {#if !engine.isHarmonyMode}
                <div
                    class="flex items-center gap-1 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg p-1">
                    <button
                        onclick={removeRow}
                        class="p-1.5 hover:bg-[var(--ui-card)] rounded-md transition-colors text-[var(--ui-text-muted)] hover:text-[var(--current-color)]"
                        title="Remove Row"
                        aria-label="Decrease steps">
                        <ListMinus class="w-4 h-4" />
                    </button>
                    <button
                        onclick={addRow}
                        class="p-1.5 hover:bg-[var(--ui-card)] rounded-md transition-colors text-[var(--ui-text-muted)] hover:text-[var(--current-color)]"
                        title="Add Row"
                        aria-label="Increase steps">
                        <ListPlus class="w-4 h-4" />
                    </button>
                </div>
            {/if}

            <button
                onclick={(e) => addAll(e)}
                class="p-2 bg-[var(--ui-bg)] hover:bg-[var(--current-color)] hover:text-white border border-[var(--ui-border)] rounded-lg transition-all shadow-sm shrink-0 text-[var(--ui-text-muted)]"
                title="Add all to paintbox">
                <LayersPlus class="w-4 h-4" />
            </button>
        </div>
    </div>

    <div class="grid grid-cols-4 gap-2">
        {#each engine.generated as swatch, i (swatch + i)}
            {@const btnClass = getActionClass(swatch)}
            <div
                role="button"
                tabindex="0"
                class="group relative aspect-square rounded-lg border border-white/10 shadow-md transition-all cursor-pointer overflow-hidden hover:scale-105 [background:var(--swatch-color)]"
                style:--swatch-color={swatch}
                title={color.formatColor(swatch)}
                onclick={() => color.set(swatch)}
                onkeydown={(e) => handleKeyDown(e, swatch)}
                aria-label="Select swatch {i + 1}">
                <div
                    class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                    <button
                        onclick={(e) => {
                            e.stopPropagation();
                            paintbox.add(swatch);
                            toast.show('Added', e);
                        }}
                        class="{btnClass} p-3 rounded-full shadow-sm transition-transform hover:scale-110 cursor-pointer"
                        title="Add to paintbox"
                        type="button">
                        <Plus class="w-4 h-4 pointer-events-none" />
                    </button>
                    <button
                        onclick={(e) => {
                            e.stopPropagation();
                            copy(swatch, e);
                        }}
                        class="{btnClass} p-3 rounded-full shadow-sm transition-transform hover:scale-110 cursor-pointer"
                        title="Copy"
                        type="button">
                        <Copy class="w-4 h-4 pointer-events-none" />
                    </button>
                </div>
            </div>
        {/each}
    </div>
</section>
