<script lang="ts">
import Copy from '@lucide/svelte/icons/copy';
import DecimalsArrowLeft from '@lucide/svelte/icons/decimals-arrow-left';
import DecimalsArrowRight from '@lucide/svelte/icons/decimals-arrow-right';
import Link from '@lucide/svelte/icons/link';
import Plus from '@lucide/svelte/icons/plus';
import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
import HslSliders from '../components/HslSliders.svelte';
import OklchSliders from '../components/OklchSliders.svelte';
import RgbSliders from '../components/RgbSliders.svelte';
import Slider from '../components/Slider.svelte';
import { getApp } from '../context';
import { getGradient } from '../utils/gradients';

const app = getApp();
const { color, paintbox, toast } = app;

let hasError = $state(false);

let inputVal = $derived.by(() => {
  switch (color.mode) {
    case 'oklch':
      return color.display;
    case 'rgb':
      return color.rgb;
    case 'hsl':
      return color.hsl;
  }
});

const addToPaintbox = (e?: MouseEvent) => {
  paintbox.add(color.hexa);
  toast.showAt('Added to Paintbox', e);
};

const copyLink = (e?: MouseEvent) => {
  const url = `${location.href.split('#')[0]}#${color.hexa}`;
  app.copy(url, e);
};

const togglePrecision = () => {
  app.precision = app.precision === 'precise' ? 'practical' : 'precise';
};

const handleInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  if (color.set(val)) {
    hasError = false;
  } else {
    hasError = true;
    toast.show('Invalid color format');
  }
};

const hslValues = $derived(color.hslComp);
</script>

<section
  class="
      h-full overflow-y-auto overflow-x-hidden space-y-4 rounded-xl border border-(--ui-border)
      bg-(--ui-card) p-4 shadow-xl
      sm:space-y-6 sm:p-6
      md:space-y-8 md:p-8
    "
  style:--picker-l={color.l}
  style:--picker-c={color.c}
  style:--picker-h={color.h}
  style:--picker-max-c={0.33}
  style:--picker-hsl-h={hslValues.h}
  style:--picker-hsl-s={`${hslValues.s}%`}
  style:--picker-hsl-l={`${hslValues.l}%`}
>
  <!-- Top Row: Input and Mode Switch -->
  <div
    class="
          flex flex-col items-center justify-between gap-4
          md:flex-row
        "
  >
    <div
      class="
              flex w-full flex-1 items-center gap-4
              md:w-auto
            "
    >
      <h2
        class="
                  text-xs font-black tracking-widest whitespace-nowrap
                  text-(--ui-text-muted) uppercase
                "
      >
        Color Picker
      </h2>
      <div class="relative z-50 w-full">
        <input
          type="text"
          value={inputVal}
          id="inputColor"
          onchange={handleInput}
          onfocus={(e) => (e.target as HTMLInputElement).select()}
          class="
                      w-full rounded-md border bg-(--ui-bg) py-2 pr-8 pl-3
                      font-mono text-base uppercase transition-shadow duration-200 outline-none
                      focus:ring-2 focus:ring-(--current-color)
                      {hasError ? 'border-red-500 ring-2 ring-red-500/20' : `border-(--ui-border)`}"
          placeholder="Paste color..."
        >
        {#if color.isOutOfGamut}
          <div
            class="
                      group absolute top-1/2 right-2 -translate-y-1/2
                    "
          >
            <button
              type="button"
              onclick={() => color.mapToSrgb()}
              class="
                          cursor-pointer text-amber-500
                        "
            >
              <TriangleAlert class="size-4" />
            </button>
            <div
              class="
                              pointer-events-none absolute top-full right-0 mt-2
                              w-48 rounded-md border border-amber-500/20
                              bg-(--ui-card) p-2 text-sm text-amber-500
                              opacity-0 shadow-xl transition-opacity
                              group-hover:opacity-100
                            "
            >
              Color is outside sRGB gamut. Converted color values are approximate.<br><br>Click to map to nearest sRGB.
            </div>
          </div>
        {/if}
      </div>
      <button
        type="button"
        onclick={togglePrecision}
        class="
                      group relative shrink-0 rounded-md border border-(--ui-border)
                      bg-(--ui-bg) p-2
                      transition duration-200
                      will-change-transform
                      hover:bg-(--current-color)
                    "
      >
        {#if app.precision === 'precise'}
          <DecimalsArrowRight
            class="
                          size-5 opacity-60 transition-opacity
                          group-hover:opacity-100
                        "
          />
        {:else}
          <DecimalsArrowLeft
            class="
                          size-5 opacity-60 transition-opacity
                          group-hover:opacity-100
                        "
          />
        {/if}
        <div
          class="
                      pointer-events-none absolute bottom-full left-1/2 z-50
                      mb-2 -translate-x-1/2 rounded-md border
                      border-(--ui-border) bg-(--ui-card) px-3 py-2 text-xs
                      whitespace-nowrap opacity-0 shadow-xl transition-opacity
                      group-hover:opacity-100
                    "
        >
          {app.precision === 'precise' ? 'Precise → Practical' : 'Practical → Precise'}
        </div>
      </button>
    </div>

    <div
      class="
              flex shrink-0 gap-1 rounded-md border border-(--ui-border)
              bg-(--ui-bg) p-1
            "
    >
      {#each ['oklch', 'rgb', 'hsl'] as m (m)}
        <button
          type="button"
          onclick={() => (color.mode = m as 'oklch' | 'rgb' | 'hsl')}
          class="
                      rounded-sm px-4 py-2 text-xs font-black uppercase
                      transition duration-200
                      will-change-transform
                      {color.mode === m
                        ? 'text-on-current bg-(--current-color)'
                        : 'hover:bg-(--ui-card)'}"
        >
          {m}
        </button>
      {/each}
    </div>
  </div>

  <!-- Main Grid: Sliders & Swatch -->
  <div
    class="
          grid grid-cols-1 gap-8
          md:grid-cols-[1fr_160px]
        "
  >
    <!-- Sliders -->
    <div class="space-y-6">
      {#if color.mode === 'oklch'}
        <OklchSliders />
      {:else if color.mode === 'rgb'}
        <RgbSliders />
      {:else if color.mode === 'hsl'}
        <HslSliders />
      {/if}

      <Slider
        label="Alpha"
        bind:value={color.alpha}
        displayValue={`${(color.alpha * 100).toFixed(0)}%`}
        min={0}
        max={1}
        step={0.01}
        {...getGradient('alpha', color.rgbComp)}
        showCheckerboard
      />
    </div>

    <!-- Large Swatch -->
    <div class="h-32 min-h-50 w-full rounded-lg border border-white/10 shadow-xl md:h-auto">
      <div
        class="
                  checkerboard group relative size-full overflow-hidden rounded-lg
                "
      >
        <div
          class="
                      absolute inset-0 transition-colors
                      [background:var(--swatch-bg)]
                    "
          style:--swatch-bg={color.cssVar}
        ></div>
        <div
          class="
                      absolute inset-0 flex flex-col items-center justify-center
                      gap-2
                      translate-y-8 opacity-0 transition-all duration-300
                      group-hover:translate-y-0 group-hover:opacity-100
                    "
        >
          <button
            type="button"
            onclick={(e) => app.copy(inputVal, e)}
            class="
                          cursor-pointer rounded-full bg-white/30 p-3 text-white
                          shadow-lg backdrop-blur-md
                          transition-transform duration-200
                          will-change-transform hover:scale-110
                          hover:bg-white/40
                        "
            title="Copy {color.mode.toUpperCase()}"
          >
            <Copy class="size-4" />
          </button>
          <button
            type="button"
            onclick={(e) => addToPaintbox(e)}
            class="
                          cursor-pointer rounded-full bg-white/30 p-3 text-white
                          shadow-lg backdrop-blur-md
                          transition-transform duration-200
                          will-change-transform hover:scale-110
                          hover:bg-white/40
                        "
            title="Add to Paintbox"
          >
            <Plus class="size-4" />
          </button>
          <button
            type="button"
            onclick={(e) => copyLink(e)}
            class="
                          cursor-pointer rounded-full bg-white/30 p-3 text-white
                          shadow-lg backdrop-blur-md
                          transition-transform duration-200
                          will-change-transform hover:scale-110
                          hover:bg-white/40
                        "
            title="Copy link"
          >
            <Link class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Output Formats -->
  <div class="flex flex-wrap gap-2 border-t border-(--ui-border) pt-4">
    {#each [{ label: 'OKLCH', value: color.display }, { label: 'HEX', value: color.hexa }, { label: 'RGB', value: color.rgb }, { label: 'HSL', value: color.hsl }, { label: 'OKLAB', value: color.oklab }, { label: 'LAB', value: color.lab }, { label: 'CMYK', value: color.cmyk }] as format (format.label)}
      <button
        type="button"
        onclick={(e) => app.copy(format.value, e)}
        class="
                  group flex cursor-pointer items-center overflow-hidden
                  rounded-full border border-(--ui-border) bg-(--ui-bg)
                  px-4 py-2 text-xs transition-all duration-200
                  hover:bg-(--current-color)
                "
      >
        <span
          class="
                      group-hover:text-on-current mr-2 shrink-0 font-bold
                      text-(--ui-text-muted) whitespace-nowrap transition-colors
                    "
          >{format.label}</span
        >
        <span class="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 group-hover:grid-cols-[1fr]">
          <span
            class="flex items-center gap-1.5 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            <span class="text-on-current font-mono whitespace-nowrap">{format.value}</span>
            <Copy class="text-on-current size-3 shrink-0" />
          </span>
        </span>
      </button>
    {/each}
  </div>
</section>
