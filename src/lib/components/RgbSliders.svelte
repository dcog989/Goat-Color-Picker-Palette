<script lang="ts">
import { getApp } from '../context';
import { getGradient } from '../utils/gradients';
import Slider from './Slider.svelte';

const { color } = getApp();

let localRgb = $state({ r: 0, g: 0, b: 0 });

$effect(() => {
    if (color.mode === 'rgb') {
        const rgb = color.rgbComp;
        localRgb = { r: rgb.r, g: rgb.g, b: rgb.b };
    }
});

const updateRgbFromLocal = () => color.setRgbValues(localRgb.r, localRgb.g, localRgb.b);
</script>

<Slider label="Red" bind:value={localRgb.r} displayValue={String(localRgb.r)} min={0} max={255} step={1} {...getGradient('r', color.rgbComp)} oninput={updateRgbFromLocal} />
<Slider label="Green" bind:value={localRgb.g} displayValue={String(localRgb.g)} min={0} max={255} step={1} {...getGradient('g', color.rgbComp)} oninput={updateRgbFromLocal} />
<Slider label="Blue" bind:value={localRgb.b} displayValue={String(localRgb.b)} min={0} max={255} step={1} {...getGradient('b', color.rgbComp)} oninput={updateRgbFromLocal} />
