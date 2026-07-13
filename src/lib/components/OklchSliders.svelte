<script lang="ts">
import { getApp } from '../context';
import { getGradient } from '../utils/gradients';
import Slider from './Slider.svelte';

const { color } = getApp();
</script>

<Slider label="Lightness" bind:value={color.l} displayValue={`${(color.l * 100).toFixed(0)}%`} min={0} max={1} step={0.01} {...getGradient('l', color.rgbComp)} />
<Slider label="Chroma" bind:value={color.c} displayValue={color.c.toFixed(3)} min={0} max={0.33} step={0.001} {...getGradient('c', color.rgbComp)} />
<Slider label="Hue" bind:value={color.h} displayValue={`${color.h.toFixed(0)}°`} min={0} max={360} step={0.1} {...getGradient('h', color.rgbComp)} />
