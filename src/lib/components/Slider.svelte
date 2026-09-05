<script lang="ts">
import type { HTMLInputAttributes } from "svelte/elements";

interface Props {
  label: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step: number;
  gradientClass?: string;
  gradientStyle?: string;
  showCheckerboard?: boolean;
  oninput?: HTMLInputAttributes["oninput"];
}

let {
  label,
  value = $bindable(),
  displayValue,
  min,
  max,
  step,
  gradientClass,
  gradientStyle,
  showCheckerboard = false,
  oninput,
}: Props = $props();
</script>

<div class="space-y-1">
  <div
    class="
          flex justify-between text-xs font-bold
          text-(--ui-text-muted) uppercase
        "
  >
    <span>{label}</span> <span>{displayValue}</span>
  </div>
  <div class="relative h-4 rounded-full">
    {#if showCheckerboard}
      <div class="checkerboard absolute inset-0 overflow-hidden rounded-full"></div>
    {/if}
    {#if gradientClass}
      <div class="absolute inset-0 rounded-full {gradientClass}"></div>
    {/if}
    {#if gradientStyle}
      <div
        class="absolute inset-0 rounded-full [background:var(--slider-grad)] pointer-events-none"
        style:--slider-grad={gradientStyle}
      ></div>
    {/if}
    <input
      type="range"
      {min}
      {max}
      {step}
      bind:value
      {oninput}
      aria-label={label}
      class="
              absolute inset-0 z-10 size-full rounded-full
              bg-transparent
            "
    >
  </div>
</div>
