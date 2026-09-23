<script lang="ts">
import { untrack } from "svelte";
import { getApp } from "../context";
import { getGradient } from "../utils/gradients";
import Slider from "./Slider.svelte";

const { color } = getApp();

let localHsl = $state({ h: 0, s: 0, l: 0 });

$effect(() => {
  if (color.mode === "hsl") {
    const hsl = color.hslComp;
    if (hsl.l <= 0 || hsl.l >= 100) {
      // Black/white carry no hue or saturation, so retain the current slider
      // values; otherwise raising lightness would reset the color to grey.
      const prev = untrack(() => localHsl);
      localHsl = { h: prev.h, s: prev.s, l: hsl.l };
    } else {
      localHsl = { h: hsl.h, s: hsl.s, l: hsl.l };
    }
  }
});

const updateHslFromLocal = () => color.setHslValues(localHsl.h, localHsl.s, localHsl.l);
</script>

<Slider
  label="Hue"
  bind:value={localHsl.h}
  displayValue={`${localHsl.h.toFixed(0)}°`}
  min={0}
  max={360}
  step={1}
  {...getGradient("hsl-h", color.rgbComp)}
  oninput={updateHslFromLocal}
/>
<Slider
  label="Saturation"
  bind:value={localHsl.s}
  displayValue={`${localHsl.s.toFixed(0)}%`}
  min={0}
  max={100}
  step={1}
  {...getGradient("hsl-s", color.rgbComp)}
  oninput={updateHslFromLocal}
/>
<Slider
  label="Lightness"
  bind:value={localHsl.l}
  displayValue={`${localHsl.l.toFixed(0)}%`}
  min={0}
  max={100}
  step={1}
  {...getGradient("hsl-l", color.rgbComp)}
  oninput={updateHslFromLocal}
/>
