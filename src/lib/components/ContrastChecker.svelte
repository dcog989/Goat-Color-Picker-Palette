<script lang="ts">
    import { calcAPCA } from 'apca-w3';
    import { parse, type Rgb } from 'culori/fn';
    import { ArrowRightLeft, Check, X } from 'lucide-svelte';
    import { getApp } from '../context';

    const { color } = getApp();

    type ContrastMode = 'white' | 'black' | 'custom';
    type WcagLevel = 'AA Large' | 'AA' | 'AAA';

    let mode = $state<ContrastMode>('white');
    let customColor = $state('#888888');
    let isFg = $state(true); // Is Color0 the foreground?

    // ------------------------------------------------------------------------
    // Comparison Logic
    // ------------------------------------------------------------------------

    const getTargetColor = (m: ContrastMode): string => {
        switch (m) {
            case 'white':
                return '#ffffff';
            case 'black':
                return '#000000';
            case 'custom':
                return customColor;
        }
    };

    // Calculate Relative Luminance for WCAG 2.1
    const getLuminance = (hex: string): number => {
        const rgb = parse(hex) as Rgb;
        if (!rgb || rgb.mode !== 'rgb') return 0;

        const channel = (c: number) => {
            const v = Math.max(0, Math.min(1, c));
            return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };

        return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
    };

    const getWcagRatio = (c1: string, c2: string): number => {
        const l1 = getLuminance(c1);
        const l2 = getLuminance(c2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    };

    // Derived Stats
    let currentTarget = $derived(getTargetColor(mode));
    let fg = $derived(isFg ? color.hex : currentTarget);
    let bg = $derived(isFg ? currentTarget : color.hex);

    // Calculate stats for ALL modes to show in tabs
    let stats = $derived.by(() => {
        const targets: Record<ContrastMode, string> = {
            white: '#ffffff',
            black: '#000000',
            custom: customColor,
        };

        const result: Record<ContrastMode, { apca: number; wcag: number }> = {
            white: { apca: 0, wcag: 0 },
            black: { apca: 0, wcag: 0 },
            custom: { apca: 0, wcag: 0 },
        };

        (Object.keys(targets) as ContrastMode[]).forEach((m) => {
            const t = targets[m];
            const f = isFg ? color.hex : t;
            const b = isFg ? t : color.hex;

            const rawApca = calcAPCA(f, b);
            result[m].apca = typeof rawApca === 'number' ? Math.round(Math.abs(rawApca)) : 0;
            result[m].wcag = getWcagRatio(f, b);
        });

        return result;
    });

    // Current Context Stats
    let currentWcag = $derived(stats[mode].wcag);
    let currentApca = $derived(stats[mode].apca);

    // Pass/Fail Logic
    const passes = (ratio: number, level: WcagLevel): boolean => {
        switch (level) {
            case 'AA Large':
                return ratio >= 3.0;
            case 'AA':
                return ratio >= 4.5;
            case 'AAA':
                return ratio >= 7.0;
        }
    };

    // Apca Rating Text
    const getApcaRating = (score: number) => {
        if (score >= 90) return 'Excellent for all.';
        if (score >= 75) return 'Good for all.';
        if (score >= 60) return 'OK for large text + headlines.';
        if (score >= 45) return 'Poor for text, OK for large headlines.';
        if (score >= 30) return "'Spot' / disabled text only.";
        return 'Fail for all.';
    };
</script>

<div class="flex h-full flex-col gap-6">
    <!-- 1. Context Switcher Tabs -->
    <div
        class="
          grid grid-cols-3 gap-2 rounded-xl border border-(--ui-border)
          bg-(--ui-bg) p-1
        ">
        {#each ['white', 'black', 'custom'] as m (m)}
            <button
                onclick={() => (mode = m as ContrastMode)}
                class="
                  relative flex flex-col items-center gap-1 rounded-lg px-2 py-3
                  transition-all
                  {mode === m
                    ? 'bg-(--ui-card) text-(--ui-text) shadow-sm'
                    : `
                      opacity-60
                      hover:bg-black/5 hover:opacity-100
                      dark:hover:bg-white/5
                    `}">
                <span
                    class="
                      text-[10px] font-black tracking-wider uppercase opacity-50
                    ">{m}</span>
                <div class="flex items-baseline gap-1">
                    <span class="text-lg font-black">{stats[m as ContrastMode].apca}</span>
                    <span class="font-mono text-[10px] opacity-50">Lc</span>
                </div>
                <!-- Active Indicator -->
                {#if mode === m}
                    <div
                        class="
                          absolute bottom-1 size-1 rounded-full
                          bg-(--current-color)
                        ">
                    </div>
                {/if}
            </button>
        {/each}
    </div>

    <!-- 2. Controls Row (Custom Input & Swap) -->
    <div class="flex min-h-10.5 items-center gap-4">
        {#if mode === 'custom'}
            <div class="relative flex-1">
                <input
                    type="text"
                    bind:value={customColor}
                    class="
                      w-full rounded-lg border border-(--ui-border) bg-(--ui-bg)
                      py-2 pr-4 pl-9 font-mono text-sm uppercase transition-all
                      outline-none
                      focus:ring-2 focus:ring-(--current-color)
                    " />
                <div
                    class="
                      absolute top-1/2 left-3 size-4 -translate-y-1/2
                      rounded-full border border-(--ui-border)
                    "
                    style:background-color={customColor}>
                </div>
            </div>
        {:else}
            <div
                class="
                  flex-1 pl-2 text-base font-bold text-(--ui-text-muted) italic
                ">
                Comparing {isFg ? color.hex : mode} vs {isFg ? mode : color.hex}...
            </div>
        {/if}

        <button
            onclick={() => (isFg = !isFg)}
            class="
              shrink-0 rounded-lg border border-transparent p-2
              text-(--ui-text-muted) transition-all
              hover:border-(--ui-border) hover:bg-(--ui-bg)
              hover:text-(--current-color)
            "
            title="Swap Foreground/Background">
            <ArrowRightLeft class="size-4" />
        </button>
    </div>

    <!-- 3. Preview Area -->
    <div
        class="
          group relative flex aspect-2/1 w-full flex-col items-center
          justify-center overflow-hidden rounded-xl border border-(--ui-border)
          p-6 text-center transition-colors duration-300
        "
        style:background-color={bg}
        style:color={fg}>
        <h3
            class="
              mb-2 text-3xl font-black
              md:text-4xl
            ">
            Sample Contrast
        </h3>
        <p
            class="
              max-w-[80%] text-sm font-medium opacity-90
              md:text-base
            ">
            How quickly the cunning brown foxes vexed the daft jumping zebras. 1 2 3 4 5 6 7 8 9 0.
        </p>
    </div>

    <!-- 4. Detailed Metrics -->
    <div class="grid grid-cols-2 gap-4">
        <!-- APCA Details -->
        <div
            class="
              space-y-2 rounded-xl border border-(--ui-border) bg-(--ui-bg) p-4
            ">
            <div class="flex items-baseline justify-between">
                <span
                    class="
                      text-xs font-black tracking-wider text-(--ui-text-muted)
                      uppercase
                    ">APCA</span>
                <span class="text-xl font-black">{currentApca}</span>
            </div>
            <div
                class="
                  mt-1 border-t border-(--ui-border) pt-2 text-xs font-medium
                  opacity-70
                ">
                {getApcaRating(currentApca)}
            </div>
        </div>

        <!-- WCAG Ratio Details -->
        <div
            class="
              space-y-2 rounded-xl border border-(--ui-border) bg-(--ui-bg) p-4
            ">
            <div class="flex items-baseline justify-between">
                <span
                    class="
                      text-xs font-black tracking-wider text-(--ui-text-muted)
                      uppercase
                    ">Ratio</span>
                <span class="text-xl font-black">{currentWcag.toFixed(2)}:1</span>
            </div>

            <div
                class="
                  mt-1 flex justify-between border-t border-(--ui-border) pt-2
                ">
                <div class="flex flex-col items-center gap-1">
                    <span class="text-[10px] font-bold uppercase opacity-50">AA Lg</span>
                    {#if passes(currentWcag, 'AA Large')}
                        <Check class="size-4 text-green-500" />
                    {:else}
                        <X class="size-4 text-red-500 opacity-50" />
                    {/if}
                </div>
                <div class="flex flex-col items-center gap-1">
                    <span class="text-[10px] font-bold uppercase opacity-50">AA</span>
                    {#if passes(currentWcag, 'AA')}
                        <Check class="size-4 text-green-500" />
                    {:else}
                        <X class="size-4 text-red-500 opacity-50" />
                    {/if}
                </div>
                <div class="flex flex-col items-center gap-1">
                    <span class="text-[10px] font-bold uppercase opacity-50">AAA</span>
                    {#if passes(currentWcag, 'AAA')}
                        <Check class="size-4 text-green-500" />
                    {:else}
                        <X class="size-4 text-red-500 opacity-50" />
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
