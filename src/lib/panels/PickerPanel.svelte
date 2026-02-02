<script lang="ts">
    import {
        AlertTriangle,
        Copy,
        DecimalsArrowLeft,
        DecimalsArrowRight,
        Plus,
    } from 'lucide-svelte';
    import { getApp } from '../context';

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

    const copy = (text: string, e?: MouseEvent) => {
        navigator.clipboard.writeText(text);
        toast.show('Copied', e);
    };

    const addToPaintbox = (e?: MouseEvent) => {
        paintbox.add(color.hexa);
        toast.show('Added to Paintbox', e);
    };

    const togglePrecision = () => {
        app.precision = app.precision === 'scientific' ? 'sensible' : 'scientific';
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

    const getGradient = (type: string) => {
        const { r, g, b } = color.rgbComp;
        const hex = color.hex;
        const l = color.l;
        const c = color.c;
        const h = color.h;

        switch (type) {
            case 'r':
                return `linear-gradient(to right, rgb(0,${g},${b}), rgb(255,${g},${b}))`;
            case 'g':
                return `linear-gradient(to right, rgb(${r},0,${b}), rgb(${r},255,${b}))`;
            case 'b':
                return `linear-gradient(to right, rgb(${r},${g},0), rgb(${r},${g},255))`;

            case 'h':
                return `linear-gradient(to right, oklch(${l} ${c} 0), oklch(${l} ${c} 90), oklch(${l} ${c} 180), oklch(${l} ${c} 270), oklch(${l} ${c} 360))`;
            case 'l':
                return `linear-gradient(to right, oklch(0 ${c} ${h}), oklch(1 ${c} ${h}))`;
            case 'c':
                return `linear-gradient(to right, oklch(${l} 0 ${h}), oklch(${l} 0.4 ${h}))`;

            case 'hsl-h':
                return `linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))`;
            case 'hsl-s': {
                const hsl = color.hslComp;
                return `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`;
            }
            case 'hsl-l': {
                const hsl = color.hslComp;
                return `linear-gradient(to right, hsl(${hsl.h}, ${hsl.s}%, 0%), hsl(${hsl.h}, ${hsl.s}%, 50%), hsl(${hsl.h}, ${hsl.s}%, 100%))`;
            }

            case 'alpha':
                return `linear-gradient(to right, transparent, ${hex})`;
            default:
                return 'transparent';
        }
    };
</script>

<section
    class="p-8 rounded-xl bg-[var(--ui-card)] border border-[var(--ui-border)] shadow-xl space-y-8">
    <!-- Top Row: Input and Mode Switch -->
    <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div class="flex items-center gap-4 w-full md:w-auto flex-1">
            <h2
                class="text-xs font-black uppercase tracking-widest text-[var(--ui-text-muted)] whitespace-nowrap">
                Color Picker
            </h2>
            <div class="relative w-full z-50">
                <input
                    type="text"
                    value={inputVal}
                    onchange={handleInput}
                    class="w-full bg-[var(--ui-bg)] border rounded-md pl-3 pr-8 py-2 font-mono text-base focus:ring-2 focus:ring-[var(--current-color)] outline-none transition-all uppercase {hasError
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : 'border-[var(--ui-border)]'}"
                    placeholder="Paste color..." />
                {#if color.isOutOfGamut}
                    <div class="group absolute right-2 top-1/2 -translate-y-1/2">
                        <AlertTriangle class="w-4 h-4 text-amber-500 cursor-help" />
                        <div
                            class="absolute right-0 top-full mt-2 w-48 p-2 bg-[var(--ui-card)] border border-amber-500/20 text-amber-500 text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                            Color is outside sRGB gamut. Converted color values are approximate.
                        </div>
                    </div>
                {/if}
            </div>
            <button
                onclick={togglePrecision}
                class="group relative shrink-0 p-2 bg-[var(--ui-bg)] hover:bg-[var(--current-color)] border border-[var(--ui-border)] rounded-md transition-all">
                {#if app.precision === 'scientific'}
                    <DecimalsArrowRight
                        class="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                {:else}
                    <DecimalsArrowLeft
                        class="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                {/if}
                <div
                    class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-[var(--ui-card)] border border-[var(--ui-border)] text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl whitespace-nowrap z-50">
                    {app.precision === 'scientific'
                        ? 'Scientific ↔ Sensible'
                        : 'Sensible ↔ Scientific'}
                </div>
            </button>
        </div>

        <div
            class="flex gap-1 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-md p-1 shrink-0">
            {#each ['oklch', 'rgb', 'hsl'] as m (m)}
                <button
                    onclick={() => (color.mode = m as 'oklch' | 'rgb' | 'hsl')}
                    class="px-4 py-2 text-xs font-black uppercase rounded-sm transition-all {color.mode ===
                    m
                        ? 'bg-[var(--current-color)] text-on-current'
                        : 'hover:bg-[var(--ui-card)]'}">
                    {m}
                </button>
            {/each}
        </div>
    </div>

    <!-- Main Grid: Sliders & Swatch -->
    <div class="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-8">
        <!-- Sliders -->
        <div class="space-y-6">
            {#if color.mode === 'oklch'}
                <div class="space-y-1">
                    <div
                        class="flex justify-between text-xs font-bold uppercase text-[var(--ui-text-muted)]">
                        <span>Lightness</span> <span>{(color.l * 100).toFixed(0)}%</span>
                    </div>
                    <div class="h-4 rounded-full relative">
                        <div
                            class="absolute inset-0 rounded-full [background:var(--slider-grad)]"
                            style:--slider-grad={getGradient('l')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            bind:value={color.l}
                            class="w-full h-full rounded-full absolute inset-0 bg-transparent z-10" />
                    </div>
                </div>
                <div class="space-y-1">
                    <div
                        class="flex justify-between text-xs font-bold uppercase text-[var(--ui-text-muted)]">
                        <span>Chroma</span> <span>{color.c.toFixed(3)}</span>
                    </div>
                    <div class="h-4 rounded-full relative">
                        <div
                            class="absolute inset-0 rounded-full [background:var(--slider-grad)]"
                            style:--slider-grad={getGradient('c')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="0.37"
                            step="0.001"
                            bind:value={color.c}
                            class="w-full h-full rounded-full absolute inset-0 bg-transparent z-10" />
                    </div>
                </div>
                <div class="space-y-1">
                    <div
                        class="flex justify-between text-xs font-bold uppercase text-[var(--ui-text-muted)]">
                        <span>Hue</span> <span>{color.h.toFixed(0)}°</span>
                    </div>
                    <div class="h-4 rounded-full relative">
                        <div
                            class="absolute inset-0 rounded-full [background:var(--slider-grad)]"
                            style:--slider-grad={getGradient('h')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            step="0.1"
                            bind:value={color.h}
                            class="w-full h-full rounded-full absolute inset-0 bg-transparent z-10" />
                    </div>
                </div>
            {:else if color.mode === 'rgb'}
                {@const rgb = color.rgbComp}
                <div class="space-y-1">
                    <div
                        class="flex justify-between text-xs font-bold uppercase text-[var(--ui-text-muted)]">
                        <span>Red</span> <span>{rgb.r}</span>
                    </div>
                    <div class="h-4 rounded-full relative">
                        <div
                            class="absolute inset-0 rounded-full [background:var(--slider-grad)]"
                            style:--slider-grad={getGradient('r')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="255"
                            value={rgb.r}
                            oninput={(e) => color.setRgb('r', +e.currentTarget.value)}
                            class="w-full h-full rounded-full absolute inset-0 bg-transparent z-10" />
                    </div>
                </div>
                <div class="space-y-1">
                    <div
                        class="flex justify-between text-xs font-bold uppercase text-[var(--ui-text-muted)]">
                        <span>Green</span> <span>{rgb.g}</span>
                    </div>
                    <div class="h-4 rounded-full relative">
                        <div
                            class="absolute inset-0 rounded-full [background:var(--slider-grad)]"
                            style:--slider-grad={getGradient('g')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="255"
                            value={rgb.g}
                            oninput={(e) => color.setRgb('g', +e.currentTarget.value)}
                            class="w-full h-full rounded-full absolute inset-0 bg-transparent z-10" />
                    </div>
                </div>
                <div class="space-y-1">
                    <div
                        class="flex justify-between text-xs font-bold uppercase text-[var(--ui-text-muted)]">
                        <span>Blue</span> <span>{rgb.b}</span>
                    </div>
                    <div class="h-4 rounded-full relative">
                        <div
                            class="absolute inset-0 rounded-full [background:var(--slider-grad)]"
                            style:--slider-grad={getGradient('b')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="255"
                            value={rgb.b}
                            oninput={(e) => color.setRgb('b', +e.currentTarget.value)}
                            class="w-full h-full rounded-full absolute inset-0 bg-transparent z-10" />
                    </div>
                </div>
            {:else if color.mode === 'hsl'}
                {@const hsl = color.hslComp}
                <div class="space-y-1">
                    <div
                        class="flex justify-between text-xs font-bold uppercase text-[var(--ui-text-muted)]">
                        <span>Hue</span> <span>{hsl.h.toFixed(0)}°</span>
                    </div>
                    <div class="h-4 rounded-full relative">
                        <div
                            class="absolute inset-0 rounded-full [background:var(--slider-grad)]"
                            style:--slider-grad={getGradient('hsl-h')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={hsl.h}
                            oninput={(e) => color.setHsl('h', +e.currentTarget.value)}
                            class="w-full h-full rounded-full absolute inset-0 bg-transparent z-10" />
                    </div>
                </div>
                <div class="space-y-1">
                    <div
                        class="flex justify-between text-xs font-bold uppercase text-[var(--ui-text-muted)]">
                        <span>Saturation</span> <span>{hsl.s.toFixed(0)}%</span>
                    </div>
                    <div class="h-4 rounded-full relative">
                        <div
                            class="absolute inset-0 rounded-full [background:var(--slider-grad)]"
                            style:--slider-grad={getGradient('hsl-s')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={hsl.s}
                            oninput={(e) => color.setHsl('s', +e.currentTarget.value)}
                            class="w-full h-full rounded-full absolute inset-0 bg-transparent z-10" />
                    </div>
                </div>
                <div class="space-y-1">
                    <div
                        class="flex justify-between text-xs font-bold uppercase text-[var(--ui-text-muted)]">
                        <span>Lightness</span> <span>{hsl.l.toFixed(0)}%</span>
                    </div>
                    <div class="h-4 rounded-full relative">
                        <div
                            class="absolute inset-0 rounded-full [background:var(--slider-grad)]"
                            style:--slider-grad={getGradient('hsl-l')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={hsl.l}
                            oninput={(e) => color.setHsl('l', +e.currentTarget.value)}
                            class="w-full h-full rounded-full absolute inset-0 bg-transparent z-10" />
                    </div>
                </div>
            {/if}

            <!-- Alpha (Shared) -->
            <div class="space-y-1">
                <div
                    class="flex justify-between text-xs font-bold uppercase text-[var(--ui-text-muted)]">
                    <span>Alpha</span> <span>{(color.alpha * 100).toFixed(0)}%</span>
                </div>
                <div class="relative h-4">
                    <div
                        class="absolute inset-0 rounded-full overflow-hidden checkerboard pointer-events-none">
                        <div
                            class="w-full h-full [background:var(--alpha-grad)]"
                            style:--alpha-grad={getGradient('alpha')}>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        bind:value={color.alpha}
                        class="w-full h-full rounded-full cursor-ew-resize absolute inset-0 z-10 bg-transparent" />
                </div>
            </div>
        </div>

        <!-- Large Swatch -->
        <div
            class="w-full h-32 md:h-auto rounded-xl shadow-xl border border-white/10 relative checkerboard overflow-hidden group min-h-[200px]">
            <div
                class="absolute inset-0 transition-colors [background:var(--swatch-bg)]"
                style:--swatch-bg={color.cssVar}>
            </div>
            <div
                class="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 backdrop-blur-[2px]">
                <button
                    onclick={(e) => copy(inputVal, e)}
                    class="bg-white/30 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/40 transition-all hover:scale-115 shadow-lg cursor-pointer"
                    title="Copy {color.mode.toUpperCase()}">
                    <Copy class="w-4 h-4" />
                </button>
                <button
                    onclick={(e) => addToPaintbox(e)}
                    class="bg-white/30 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/40 transition-all hover:scale-115 shadow-lg cursor-pointer"
                    title="Add to Paintbox">
                    <Plus class="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>

    <!-- Output Formats -->
    <div class="flex flex-wrap gap-2 pt-4 border-t border-[var(--ui-border)]">
        {#each [{ label: 'OKLCH', value: color.display }, { label: 'HEX', value: color.hex }, { label: 'RGB', value: color.rgb }, { label: 'HSL', value: color.hsl }, { label: 'OKLAB', value: color.oklab }, { label: 'LAB', value: color.lab }, { label: 'CMYK', value: color.cmyk }] as format (format.label)}
            <button
                onclick={(e) => copy(format.value, e)}
                class="group flex items-center bg-[var(--ui-bg)] hover:bg-[var(--current-color)] border border-[var(--ui-border)] rounded-full px-4 py-2 text-xs transition-colors overflow-hidden max-w-[100px] hover:max-w-[300px] cursor-pointer">
                <span
                    class="font-bold text-[var(--ui-text-muted)] group-hover:text-on-current transition-colors mr-2"
                    >{format.label}</span>
                <span
                    class="whitespace-nowrap opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto transition-all duration-300 font-mono text-on-current"
                    >{format.value}</span>
                <Copy
                    class="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-on-current" />
            </button>
        {/each}
    </div>
</section>
