<script lang="ts">
import LayersPlus from "@lucide/svelte/icons/layers-plus";
import ListMinus from "@lucide/svelte/icons/list-minus";
import ListPlus from "@lucide/svelte/icons/list-plus";
import Swatch from "../components/Swatch.svelte";
import { getApp } from "../context";

const { engine, paintbox, toast } = getApp();

const addAll = (e?: MouseEvent) => {
  engine.generated.forEach((c: string) => {
    paintbox.add(c);
  });
  toast.showAt("Added All to Paintbox", e);
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
      panel
    "
>
  <div
    class="
          mb-6 flex flex-col items-center justify-between gap-4
          md:flex-row
        "
  >
    <h2 class="section-heading shrink-0 self-start md:self-center">Palette</h2>

    <div
      class="
              flex w-full flex-wrap items-center justify-end gap-2
              md:w-auto
            "
    >
      <select
        id="paletteVariable"
        bind:value={engine.genAxis}
        aria-label="Palette generation variable"
        class="select-control"
      >
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
        <div class="control-group flex items-center gap-1">
          <button
            type="button"
            onclick={removeRow}
            disabled={engine.genSteps <= 4}
            class="icon-button-inset"
            title="Remove Row"
            aria-label="Decrease steps"
          >
            <ListMinus class="size-4" />
          </button>
          <button type="button" onclick={addRow} class="icon-button-inset" title="Add Row" aria-label="Increase steps">
            <ListPlus class="size-4" />
          </button>
        </div>
      {/if}

      <button type="button" onclick={(e) => addAll(e)} class="icon-button" title="Add all to paintbox">
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
