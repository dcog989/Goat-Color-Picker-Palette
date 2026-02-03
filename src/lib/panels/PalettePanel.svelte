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
    class="
      h-full rounded-xl border border-(--ui-border) bg-(--ui-card) p-8 shadow-xl
    ">
    <div
        class="
          mb-6 flex flex-col items-center justify-between gap-4
          xl:flex-row
        ">
        <h2
            class="
              shrink-0 self-start text-xs font-black tracking-widest
              text-(--ui-text-muted) uppercase
              xl:self-center
            ">
            Palette
        </h2>

        <div
            class="
              flex w-full flex-wrap items-center justify-end gap-2
              xl:w-auto
            ">
            <select
                id="paletteVariable"
                bind:value={engine.genAxis}
                class="
                  min-w-35 flex-1 cursor-pointer rounded-lg border
                  border-(--ui-border) bg-(--ui-bg) px-3 py-1.5 text-xs
                  font-bold uppercase transition-all outline-none
                  focus:border-(--current-color)
                  xl:flex-none
                ">
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
                    class="
                      flex items-center gap-1 rounded-lg border
                      border-(--ui-border) bg-(--ui-bg) p-1
                    ">
                    <button
                        onclick={removeRow}
                        class="
                          rounded-md p-1.5 text-(--ui-text-muted)
                          transition-colors
                          hover:bg-(--ui-card) hover:text-(--current-color)
                        "
                        title="Remove Row"
                        aria-label="Decrease steps">
                        <ListMinus class="size-4" />
                    </button>
                    <button
                        onclick={addRow}
                        class="
                          rounded-md p-1.5 text-(--ui-text-muted)
                          transition-colors
                          hover:bg-(--ui-card) hover:text-(--current-color)
                        "
                        title="Add Row"
                        aria-label="Increase steps">
                        <ListPlus class="size-4" />
                    </button>
                </div>
            {/if}

            <button
                onclick={(e) => addAll(e)}
                class="
                  shrink-0 rounded-lg border border-(--ui-border) bg-(--ui-bg)
                  p-2 text-(--ui-text-muted) shadow-sm transition-all
                  hover:bg-(--current-color) hover:text-white
                "
                title="Add all to paintbox">
                <LayersPlus class="size-4" />
            </button>
        </div>
    </div>

    <div class="grid grid-cols-4 gap-2">
        {#each engine.generated as swatch, i (swatch + i)}
            {@const btnClass = getActionClass(swatch)}
            <div
                role="button"
                tabindex="0"
                class="
                  group relative aspect-square cursor-pointer overflow-hidden
                  rounded-lg border border-white/10 shadow-md transition-all
                  [background:var(--swatch-color)]
                  hover:scale-105
                "
                style:--swatch-color={swatch}
                title={color.formatColor(swatch)}
                onclick={() => color.set(swatch)}
                onkeydown={(e) => handleKeyDown(e, swatch)}
                aria-label="Select swatch {i + 1}">
                <div
                    class="
                      absolute inset-0 flex items-center justify-center gap-2
                      opacity-0 transition-opacity
                      group-hover:opacity-100
                    ">
                    <button
                        onclick={(e) => {
                            e.stopPropagation();
                            paintbox.add(swatch);
                            toast.show('Added', e);
                        }}
                        class="{btnClass}
                          cursor-pointer rounded-full p-3 shadow-sm
                          transition-transform
                          hover:scale-110
                        "
                        title="Add to paintbox"
                        type="button">
                        <Plus class="pointer-events-none size-4" />
                    </button>
                    <button
                        onclick={(e) => {
                            e.stopPropagation();
                            copy(swatch, e);
                        }}
                        class="{btnClass}
                          cursor-pointer rounded-full p-3 shadow-sm
                          transition-transform
                          hover:scale-110
                        "
                        title="Copy"
                        type="button">
                        <Copy class="pointer-events-none size-4" />
                    </button>
                </div>
            </div>
        {/each}
    </div>
</section>
