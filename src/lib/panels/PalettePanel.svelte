<script lang="ts">
import { LayersPlus, ListMinus, ListPlus } from '@lucide/svelte';
import Swatch from '../components/Swatch.svelte';
import { getApp } from '../context';

const { engine, paintbox, toast } = getApp();

const addAll = (e?: MouseEvent) => {
    engine.generated.forEach((c: string) => {
        paintbox.add(c);
    });
    toast.show('Added All to Paintbox', e);
};

const addRow = () => {
    engine.genSteps = Math.min(20, engine.genSteps + 4);
};

const removeRow = () => {
    engine.genSteps = Math.max(4, engine.genSteps - 4);
};
</script>

<section
    class="
      h-full overflow-y-auto rounded-xl border border-(--ui-border)
      bg-(--ui-card) p-4 shadow-xl
      sm:p-6
      md:p-8
    ">
    <div
        class="
          mb-6 flex flex-col items-center justify-between gap-4
          md:flex-row
        ">
        <h2
            class="
              shrink-0 self-start text-xs font-black tracking-widest
              text-(--ui-text-muted) uppercase
              md:self-center
            ">
            Palette
        </h2>

        <div
            class="
              flex w-full flex-wrap items-center justify-end gap-2
              md:w-auto
            ">
                <select
                    id="paletteVariable"
                    bind:value={engine.genAxis}
                    aria-label="Palette generation variable"
                    class="
                      cursor-pointer rounded-lg border
                      border-(--ui-border) bg-(--ui-bg) px-3 py-1.5 text-xs
                      font-bold uppercase transition-all outline-none
                      focus:border-(--current-color)
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
                    <option value="rectangle">Rectangle</option>
                </optgroup>
            </select>

            {#if !engine.isHarmonyMode}
                <div
                    class="
                      flex items-center gap-1 rounded-lg border
                      border-(--ui-border) bg-(--ui-bg) p-1
                    ">
                    <button
                        type="button"
                        onclick={removeRow}
                        disabled={engine.genSteps <= 4}
                        class="
                          rounded-md p-1.5 text-(--ui-text-muted)
                          transition-all hover:bg-(--current-color) hover:text-white
                          {engine.genSteps <= 4 ? 'pointer-events-none opacity-55' : ''}
                        "
                        title="Remove Row"
                        aria-label="Decrease steps">
                        <ListMinus class="size-4" />
                    </button>
                    <button
                        type="button"
                        onclick={addRow}
                        class="
                          rounded-md p-1.5 text-(--ui-text-muted)
                          transition-all hover:bg-(--current-color) hover:text-white
                        "
                        title="Add Row"
                        aria-label="Increase steps">
                        <ListPlus class="size-4" />
                    </button>
                </div>
            {/if}

            <button
                type="button"
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
            <Swatch color={swatch} index={i} />
        {/each}
    </div>
</section>
