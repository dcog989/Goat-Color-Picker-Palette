<script lang="ts">
import { colordx, getFormat } from "@colordx/core";
import ArrowRightLeft from "@lucide/svelte/icons/arrow-right-left";
import Check from "@lucide/svelte/icons/check";
import X from "@lucide/svelte/icons/x";
import { getApp } from "../context";

const { color } = getApp();

type ContrastMode = "white" | "black" | "custom";
type WcagLevel = "AA Large" | "AA" | "AAA";

const modes: ContrastMode[] = ["white", "black", "custom"];

let mode = $state<ContrastMode>("white");
let customColor = $state("#888888");
// Per mode: false = target color as background, true = current color as background
let inverted = $state<Record<ContrastMode, boolean>>({
  white: true,
  black: true,
  custom: true,
});

const isValidColor = (colorStr: string): boolean => {
  return getFormat(colorStr) !== undefined;
};

let customColorError = $derived(mode === "custom" && !isValidColor(customColor));

const getTargetColor = (m: ContrastMode): string => {
  switch (m) {
    case "white":
      return "#ffffff";
    case "black":
      return "#000000";
    case "custom":
      return isValidColor(customColor) ? customColor : "#888888";
  }
};

// Derived Stats
let currentTarget = $derived(getTargetColor(mode));
let isInverted = $derived(inverted[mode]);
let fg = $derived(isInverted ? currentTarget : color.hex);
let bg = $derived(isInverted ? color.hex : currentTarget);

const toggleInvert = (m: ContrastMode) => {
  inverted[m] = !inverted[m];
};

let currentApca = $derived.by((): number => {
  if (mode === "custom" && !isValidColor(customColor)) return 0;
  try {
    return Math.round(Math.abs(colordx(fg).apcaContrast(bg)));
  } catch {
    return 0;
  }
});

let currentWcag = $derived.by((): number => {
  if (mode === "custom" && !isValidColor(customColor)) return 0;
  try {
    const ratio = colordx(fg).contrast(bg);
    return !Number.isNaN(ratio) && Number.isFinite(ratio) ? ratio : 0;
  } catch {
    return 0;
  }
});

const readableAt = (level: WcagLevel): boolean => {
  if (mode === "custom" && !isValidColor(customColor)) return false;
  try {
    const parsed = colordx(fg);
    switch (level) {
      case "AA Large":
        return parsed.isReadable(bg, { size: "large" });
      case "AA":
        return parsed.isReadable(bg);
      case "AAA":
        return parsed.isReadable(bg, { level: "AAA" });
    }
  } catch {
    return false;
  }
};

const getApcaRating = (score: number) => {
  if (score >= 90) return "Excellent for all.";
  if (score >= 75) return "Good for all.";
  if (score >= 60) return "OK for large text + headlines.";
  if (score >= 45) return "Poor for text, OK for large headlines.";
  if (score >= 30) return "'Spot' / disabled text only.";
  return "Fail for all.";
};
</script>

<div class="flex h-full flex-col gap-6">
  <!-- 1. Context Switcher Tabs -->
  <div
    class="
          grid grid-cols-3 gap-2 rounded-xl border border-(--ui-border)
          bg-(--ui-bg) p-1
        "
  >
    {#each modes as m (m)}
      <div class="relative">
        <button
          type="button"
          onclick={() => (mode = m)}
          class="
                    relative flex h-full w-full flex-col items-center gap-1
                    rounded-lg px-2 py-3 transition-all
                    {mode === m
            ? "bg-(--ui-card) text-(--ui-text) shadow-sm"
            : `
                        opacity-70
                        hover:bg-black/5 hover:opacity-100
                        dark:hover:bg-white/5
                      `}"
        >
          <span class="section-heading">{m}</span>
          {#if mode === m}
            <div class="flex items-baseline gap-1">
              {#if m === "custom" && !isValidColor(customColor)}
                <span class="text-lg font-black text-red-500">--</span>
                <span class="font-mono text-xs text-red-500/70">!</span>
              {:else}
                <span class="text-lg font-black">{currentApca}</span>
                <span class="font-mono text-xs opacity-50">Lc</span>
              {/if}
            </div>
          {/if}
          <!-- Active Indicator -->
          {#if mode === m}
            <div
              class="
                            absolute bottom-1 size-1 rounded-full
                            bg-(--current-color)
                          "
            ></div>
          {/if}
        </button>

        <button
          type="button"
          onclick={() => {
            mode = m;
            toggleInvert(m);
          }}
          aria-pressed={inverted[m]}
          aria-label="Invert {m} and current color"
          title={inverted[m]
            ? `Showing ${m} on the current color — click to invert`
            : `Showing the current color on ${m} — click to invert`}
          class="
                    absolute top-1.5 right-1.5 rounded-md p-1
                    transition-colors
                    hover:bg-black/5 dark:hover:bg-white/10
                    {inverted[m] ? `text-(--current-color)` : `text-(--ui-text-muted) opacity-60 hover:opacity-100`}
                  "
        >
          <ArrowRightLeft class="size-[18px]" />
        </button>
      </div>
    {/each}
  </div>

  <!-- 2. Controls Row (Custom Input) -->
  {#if mode === "custom"}
    <div class="relative">
      <input
        id="contrastColor"
        type="text"
        bind:value={customColor}
        class="text-input py-2 pr-4 pl-10 text-sm uppercase {customColorError ? "border-red-500" : ""}"
      >
      <div
        class="
                    absolute top-1/2 left-3 size-5 -translate-y-1/2
                    rounded-full border border-(--ui-border)
                  "
        style:background-color={customColorError ? "transparent" : customColor}
      >
        {#if customColorError}
          <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-red-500">!</span>
        {/if}
      </div>
      {#if customColorError}
        <div class="absolute top-full left-0 mt-1 text-xs font-medium text-red-500">Invalid color format</div>
      {/if}
    </div>
  {/if}

  <!-- 3. Preview Area -->
  <div
    class="
          group relative flex aspect-3/1 w-full flex-col items-center
          justify-center overflow-hidden rounded-xl border border-(--ui-border)
          p-2 text-center transition-colors duration-300
          sm:p-3
          md:p-4
        "
    style:background-color={bg}
    style:color={fg}
    data-axe-ignore
    aria-hidden="true"
  >
    <h3
      class="
              mb-1 font-black
              text-base
              sm:text-lg
              md:text-2xl
            "
    >
      Sample Contrast
    </h3>
    <p
      class="
              max-w-[80%] text-[0.65rem] font-medium leading-tight opacity-90
              sm:text-xs
              md:text-sm
            "
    >
      How quickly the cunning brown foxes vexed the daft jumping zebras. 1 2 3 4 5 6 7 8 9 0.
    </p>
  </div>

  <!-- 4. Detailed Metrics -->
  <div class="grid grid-cols-2 gap-4">
    <!-- APCA Details -->
    <div
      class="
              space-y-2 rounded-xl border border-(--ui-border) bg-(--ui-bg) p-4
            "
    >
      <div class="flex items-baseline justify-between">
        <span class="section-heading">APCA</span>
        <span class="text-xl font-black">{customColorError && mode === "custom" ? "--" : currentApca}</span>
      </div>
      <div
        class="
                  mt-1 border-t border-(--ui-border) pt-2 text-sm font-medium
                  opacity-70
                "
      >
        {customColorError && mode === "custom" ? "Invalid color format" : getApcaRating(currentApca)}
      </div>
    </div>

    <!-- WCAG Ratio Details -->
    <div
      class="
              space-y-2 rounded-xl border border-(--ui-border) bg-(--ui-bg) p-4
            "
    >
      <div class="flex items-baseline justify-between">
        <span class="section-heading">Ratio</span>
        <span class="text-xl font-black"
          >{customColorError && mode === "custom" ? "--" : currentWcag.toFixed(1)}:1</span
        >
      </div>

      <div
        class="
                  mt-1 flex justify-between border-t border-(--ui-border) pt-2
                "
      >
        {#if customColorError && mode === "custom"}
          <div class="flex flex-col items-center gap-1">
            <span class="sub-label">AA Lg</span>
            <X class="size-4 text-gray-400 opacity-70" />
          </div>
          <div class="flex flex-col items-center gap-1">
            <span class="sub-label">AA</span>
            <X class="size-4 text-gray-400 opacity-70" />
          </div>
          <div class="flex flex-col items-center gap-1">
            <span class="sub-label">AAA</span>
            <X class="size-4 text-gray-400 opacity-70" />
          </div>
        {:else}
          <div class="flex flex-col items-center gap-1">
            <span class="sub-label">AA Lg</span>
            {#if readableAt("AA Large")}
              <Check class="size-4 text-green-500" />
            {:else}
              <X class="size-4 text-red-500 opacity-70" />
            {/if}
          </div>
          <div class="flex flex-col items-center gap-1">
            <span class="sub-label">AA</span>
            {#if readableAt("AA")}
              <Check class="size-4 text-green-500" />
            {:else}
              <X class="size-4 text-red-500 opacity-70" />
            {/if}
          </div>
          <div class="flex flex-col items-center gap-1">
            <span class="sub-label">AAA</span>
            {#if readableAt("AAA")}
              <Check class="size-4 text-green-500" />
            {:else}
              <X class="size-4 text-red-500 opacity-70" />
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
