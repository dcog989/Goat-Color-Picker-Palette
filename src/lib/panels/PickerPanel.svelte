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

    // Local state for RGB sliders to prevent jitter from round-trip conversion
    let localRgb = $state({ r: 0, g: 0, b: 0 });
    // Local state for HSL sliders to prevent jitter from round-trip conversion
    let localHsl = $state({ h: 0, s: 0, l: 0 });

    // Sync local RGB state from store when RGB mode is active or values change externally
    $effect(() => {
        if (color.mode === 'rgb') {
            const rgb = color.rgbComp;
            localRgb = { r: rgb.r, g: rgb.g, b: rgb.b };
        }
    });

    // Sync local HSL state from store when HSL mode is active or values change externally
    $effect(() => {
        if (color.mode === 'hsl') {
            const hsl = color.hslComp;
            localHsl = { h: hsl.h, s: hsl.s, l: hsl.l };
        }
    });

    // Update store from local RGB state (called on change event)
    const updateRgbFromLocal = () => {
        color.setRgb('r', localRgb.r);
        color.setRgb('g', localRgb.g);
        color.setRgb('b', localRgb.b);
    };

    // Update store from local HSL state (called on change event)
    const updateHslFromLocal = () => {
        color.setHsl('h', localHsl.h);
        color.setHsl('s', localHsl.s);
        color.setHsl('l', localHsl.l);
    };

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
    class="
      space-y-8 rounded-xl border border-(--ui-border) bg-(--ui-card) p-8
      shadow-xl
    ">
    <!-- Top Row: Input and Mode Switch -->
    <div
        class="
          flex flex-col items-center justify-between gap-4
          md:flex-row
        ">
        <div
            class="
              flex w-full flex-1 items-center gap-4
              md:w-auto
            ">
            <h2
                class="
                  text-xs font-black tracking-widest whitespace-nowrap
                  text-(--ui-text-muted) uppercase
                ">
                Color Picker
            </h2>
            <div class="relative z-50 w-full">
                <input
                    type="text"
                    value={inputVal}
                    onchange={handleInput}
                    class="
                      w-full rounded-md border bg-(--ui-bg) py-2 pr-8 pl-3
                      font-mono text-base uppercase transition-all outline-none
                      focus:ring-2 focus:ring-(--current-color)
                      {hasError ? 'border-red-500 ring-2 ring-red-500/20' : `border-(--ui-border)`}"
                    placeholder="Paste color..." />
                {#if color.isOutOfGamut}
                    <div
                        class="
                      group absolute top-1/2 right-2 -translate-y-1/2
                    ">
                        <AlertTriangle
                            class="
                          size-4 cursor-help text-amber-500
                        " />
                        <div
                            class="
                              pointer-events-none absolute top-full right-0 mt-2
                              w-48 rounded-md border border-amber-500/20
                              bg-(--ui-card) p-2 text-sm text-amber-500
                              opacity-0 shadow-xl transition-opacity
                              group-hover:opacity-100
                            ">
                            Color is outside sRGB gamut. Converted color values are approximate.
                        </div>
                    </div>
                {/if}
            </div>
            <button
                onclick={togglePrecision}
                class="
                  group relative shrink-0 rounded-md border border-(--ui-border)
                  bg-(--ui-bg) p-2 transition-all
                  hover:bg-(--current-color)
                ">
                {#if app.precision === 'precise'}
                    <DecimalsArrowRight
                        class="
                          size-5 opacity-60 transition-opacity
                          group-hover:opacity-100
                        " />
                {:else}
                    <DecimalsArrowLeft
                        class="
                          size-5 opacity-60 transition-opacity
                          group-hover:opacity-100
                        " />
                {/if}
                <div
                    class="
                      pointer-events-none absolute bottom-full left-1/2 z-50
                      mb-2 -translate-x-1/2 rounded-md border
                      border-(--ui-border) bg-(--ui-card) px-3 py-2 text-xs
                      whitespace-nowrap opacity-0 shadow-xl transition-opacity
                      group-hover:opacity-100
                    ">
                    {app.precision === 'precise' ? 'Precise ↔ Practical' : 'Practical ↔ Precise'}
                </div>
            </button>
        </div>

        <div
            class="
              flex shrink-0 gap-1 rounded-md border border-(--ui-border)
              bg-(--ui-bg) p-1
            ">
            {#each ['oklch', 'rgb', 'hsl'] as m (m)}
                <button
                    onclick={() => (color.mode = m as 'oklch' | 'rgb' | 'hsl')}
                    class="
                      rounded-sm px-4 py-2 text-xs font-black uppercase
                      transition-all
                      {color.mode === m
                        ? 'text-on-current bg-(--current-color)'
                        : 'hover:bg-(--ui-card)'}">
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
        ">
        <!-- Sliders -->
        <div class="space-y-6">
            {#if color.mode === 'oklch'}
                <div class="space-y-1">
                    <div
                        class="
                          flex justify-between text-xs font-bold
                          text-(--ui-text-muted) uppercase
                        ">
                        <span>Lightness</span> <span>{(color.l * 100).toFixed(0)}%</span>
                    </div>
                    <div class="relative h-4 rounded-full">
                        <div
                            class="
                              absolute inset-0 rounded-full
                              [background:var(--slider-grad)]
                            "
                            style:--slider-grad={getGradient('l')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            bind:value={color.l}
                            class="
                              absolute inset-0 z-10 size-full rounded-full
                              bg-transparent
                            " />
                    </div>
                </div>
                <div class="space-y-1">
                    <div
                        class="
                          flex justify-between text-xs font-bold
                          text-(--ui-text-muted) uppercase
                        ">
                        <span>Chroma</span> <span>{color.c.toFixed(3)}</span>
                    </div>
                    <div class="relative h-4 rounded-full">
                        <div
                            class="
                              absolute inset-0 rounded-full
                              [background:var(--slider-grad)]
                            "
                            style:--slider-grad={getGradient('c')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="0.37"
                            step="0.001"
                            bind:value={color.c}
                            class="
                              absolute inset-0 z-10 size-full rounded-full
                              bg-transparent
                            " />
                    </div>
                </div>
                <div class="space-y-1">
                    <div
                        class="
                          flex justify-between text-xs font-bold
                          text-(--ui-text-muted) uppercase
                        ">
                        <span>Hue</span> <span>{color.h.toFixed(0)}°</span>
                    </div>
                    <div class="relative h-4 rounded-full">
                        <div
                            class="
                              absolute inset-0 rounded-full
                              [background:var(--slider-grad)]
                            "
                            style:--slider-grad={getGradient('h')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            step="0.1"
                            bind:value={color.h}
                            class="
                              absolute inset-0 z-10 size-full rounded-full
                              bg-transparent
                            " />
                    </div>
                </div>
            {:else if color.mode === 'rgb'}
                <div class="space-y-1">
                    <div
                        class="
                          flex justify-between text-xs font-bold
                          text-(--ui-text-muted) uppercase
                        ">
                        <span>Red</span> <span>{localRgb.r}</span>
                    </div>
                    <div class="relative h-4 rounded-full">
                        <div
                            class="
                              absolute inset-0 rounded-full
                              [background:var(--slider-grad)]
                            "
                            style:--slider-grad={getGradient('r')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="255"
                            bind:value={localRgb.r}
                            onchange={updateRgbFromLocal}
                            class="
                              absolute inset-0 z-10 size-full rounded-full
                              bg-transparent
                            " />
                    </div>
                </div>
                <div class="space-y-1">
                    <div
                        class="
                          flex justify-between text-xs font-bold
                          text-(--ui-text-muted) uppercase
                        ">
                        <span>Green</span> <span>{localRgb.g}</span>
                    </div>
                    <div class="relative h-4 rounded-full">
                        <div
                            class="
                              absolute inset-0 rounded-full
                              [background:var(--slider-grad)]
                            "
                            style:--slider-grad={getGradient('g')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="255"
                            bind:value={localRgb.g}
                            onchange={updateRgbFromLocal}
                            class="
                              absolute inset-0 z-10 size-full rounded-full
                              bg-transparent
                            " />
                    </div>
                </div>
                <div class="space-y-1">
                    <div
                        class="
                          flex justify-between text-xs font-bold
                          text-(--ui-text-muted) uppercase
                        ">
                        <span>Blue</span> <span>{localRgb.b}</span>
                    </div>
                    <div class="relative h-4 rounded-full">
                        <div
                            class="
                              absolute inset-0 rounded-full
                              [background:var(--slider-grad)]
                            "
                            style:--slider-grad={getGradient('b')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="255"
                            bind:value={localRgb.b}
                            onchange={updateRgbFromLocal}
                            class="
                              absolute inset-0 z-10 size-full rounded-full
                              bg-transparent
                            " />
                    </div>
                </div>
            {:else if color.mode === 'hsl'}
                <div class="space-y-1">
                    <div
                        class="
                          flex justify-between text-xs font-bold
                          text-(--ui-text-muted) uppercase
                        ">
                        <span>Hue</span> <span>{localHsl.h.toFixed(0)}°</span>
                    </div>
                    <div class="relative h-4 rounded-full">
                        <div
                            class="
                              absolute inset-0 rounded-full
                              [background:var(--slider-grad)]
                            "
                            style:--slider-grad={getGradient('hsl-h')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            bind:value={localHsl.h}
                            onchange={updateHslFromLocal}
                            class="
                              absolute inset-0 z-10 size-full rounded-full
                              bg-transparent
                            " />
                    </div>
                </div>
                <div class="space-y-1">
                    <div
                        class="
                          flex justify-between text-xs font-bold
                          text-(--ui-text-muted) uppercase
                        ">
                        <span>Saturation</span> <span>{localHsl.s.toFixed(0)}%</span>
                    </div>
                    <div class="relative h-4 rounded-full">
                        <div
                            class="
                              absolute inset-0 rounded-full
                              [background:var(--slider-grad)]
                            "
                            style:--slider-grad={getGradient('hsl-s')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            bind:value={localHsl.s}
                            onchange={updateHslFromLocal}
                            class="
                              absolute inset-0 z-10 size-full rounded-full
                              bg-transparent
                            " />
                    </div>
                </div>
                <div class="space-y-1">
                    <div
                        class="
                          flex justify-between text-xs font-bold
                          text-(--ui-text-muted) uppercase
                        ">
                        <span>Lightness</span> <span>{localHsl.l.toFixed(0)}%</span>
                    </div>
                    <div class="relative h-4 rounded-full">
                        <div
                            class="
                              absolute inset-0 rounded-full
                              [background:var(--slider-grad)]
                            "
                            style:--slider-grad={getGradient('hsl-l')}>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            bind:value={localHsl.l}
                            onchange={updateHslFromLocal}
                            class="
                              absolute inset-0 z-10 size-full rounded-full
                              bg-transparent
                            " />
                    </div>
                </div>
            {/if}

            <!-- Alpha (Shared) -->
            <div class="space-y-1">
                <div
                    class="
                      flex justify-between text-xs font-bold
                      text-(--ui-text-muted) uppercase
                    ">
                    <span>Alpha</span> <span>{(color.alpha * 100).toFixed(0)}%</span>
                </div>
                <div class="relative h-4">
                    <div
                        class="
                          checkerboard pointer-events-none absolute inset-0
                          overflow-hidden rounded-full
                        ">
                        <div
                            class="size-full [background:var(--alpha-grad)]"
                            style:--alpha-grad={getGradient('alpha')}>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        bind:value={color.alpha}
                        class="
                          absolute inset-0 z-10 size-full cursor-ew-resize
                          rounded-full bg-transparent
                        " />
                </div>
            </div>
        </div>

        <!-- Large Swatch -->
        <div
            class="
              checkerboard group relative h-32 min-h-50 w-full overflow-hidden
              rounded-xl border border-white/10 shadow-xl
              md:h-auto
            ">
            <div
                class="
                  absolute inset-0 transition-colors
                  [background:var(--swatch-bg)]
                "
                style:--swatch-bg={color.cssVar}>
            </div>
            <div
                class="
                  absolute inset-0 flex flex-col items-center justify-center
                  gap-2 bg-black/10 opacity-0 backdrop-blur-[2px]
                  transition-opacity
                  group-hover:opacity-100
                ">
                <button
                    onclick={(e) => copy(inputVal, e)}
                    class="
                      cursor-pointer rounded-full bg-white/30 p-3 text-white
                      shadow-lg backdrop-blur-md transition-all
                      hover:scale-115 hover:bg-white/40
                    "
                    title="Copy {color.mode.toUpperCase()}">
                    <Copy class="size-4" />
                </button>
                <button
                    onclick={(e) => addToPaintbox(e)}
                    class="
                      cursor-pointer rounded-full bg-white/30 p-3 text-white
                      shadow-lg backdrop-blur-md transition-all
                      hover:scale-115 hover:bg-white/40
                    "
                    title="Add to Paintbox">
                    <Plus class="size-4" />
                </button>
            </div>
        </div>
    </div>

    <!-- Output Formats -->
    <div class="flex flex-wrap gap-2 border-t border-(--ui-border) pt-4">
        {#each [{ label: 'OKLCH', value: color.display }, { label: 'HEX', value: color.hex }, { label: 'RGB', value: color.rgb }, { label: 'HSL', value: color.hsl }, { label: 'OKLAB', value: color.oklab }, { label: 'LAB', value: color.lab }, { label: 'CMYK', value: color.cmyk }] as format (format.label)}
            <button
                onclick={(e) => copy(format.value, e)}
                class="
                  group flex max-w-25 cursor-pointer items-center
                  overflow-hidden rounded-full border border-(--ui-border)
                  bg-(--ui-bg) px-4 py-2 text-xs transition-colors
                  hover:max-w-75 hover:bg-(--current-color)
                ">
                <span
                    class="
                      group-hover:text-on-current
                      mr-2 font-bold text-(--ui-text-muted) transition-colors
                    ">{format.label}</span>
                <span
                    class="
                      text-on-current w-0 font-mono whitespace-nowrap opacity-0
                      transition-all duration-300
                      group-hover:w-auto group-hover:opacity-100
                    ">{format.value}</span>
                <Copy
                    class="
                      text-on-current ml-2 size-3 opacity-0 transition-opacity
                      group-hover:opacity-100
                    " />
            </button>
        {/each}
    </div>
</section>
