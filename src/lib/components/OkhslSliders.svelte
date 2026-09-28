<script lang="ts">
import { untrack } from "svelte";
import { getApp } from "../context";
import { okhslGradient } from "../utils/gradients";
import Slider from "./Slider.svelte";

const { color } = getApp();

const ACHROMATIC_S_THRESHOLD = 0.05;
const EDGE_L_THRESHOLD = 0.1;

let local = $state(
  untrack(() => ({
    h: color.h,
    s: color.okhslComp.s,
    l: color.okhslComp.l,
  })),
);

$effect(() => {
  if (color.mode !== "okhsl") return;
  const { h, s, l } = color.okhslComp;
  const prev = untrack(() => local);
  const hasHue = s > ACHROMATIC_S_THRESHOLD && l > EDGE_L_THRESHOLD && l < 100 - EDGE_L_THRESHOLD;
  local = {
    h: hasHue ? h : prev.h,
    s: l > EDGE_L_THRESHOLD && l < 100 - EDGE_L_THRESHOLD ? s : prev.s,
    l,
  };
});

const update = () => color.setOkhslValues(local.h, local.s, local.l);
</script>

<Slider
  label="Hue"
  bind:value={local.h}
  displayValue={`${local.h.toFixed(0)}°`}
  min={0}
  max={360}
  step={1}
  {...okhslGradient("h", local)}
  oninput={update}
/>
<Slider
  label="Saturation"
  bind:value={local.s}
  displayValue={`${local.s.toFixed(0)}%`}
  min={0}
  max={100}
  step={1}
  {...okhslGradient("s", local)}
  oninput={update}
/>
<Slider
  label="Lightness"
  bind:value={local.l}
  displayValue={`${local.l.toFixed(0)}%`}
  min={0}
  max={100}
  step={1}
  {...okhslGradient("l", local)}
  oninput={update}
/>
