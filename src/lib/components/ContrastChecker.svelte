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

<div class="flex flex-col gap-6 h-full">
    <!-- 1. Context Switcher Tabs -->
    <div
        class="grid grid-cols-3 gap-2 p-1 bg-[var(--ui-bg)] rounded-xl border border-[var(--ui-border)]">
        {#each ['white', 'black', 'custom'] as m (m)}
            <button
                onclick={() => (mode = m as ContrastMode)}
                class="relative py-3 px-2 rounded-lg transition-all flex flex-col items-center gap-1 {mode ===
                m
                    ? 'bg-[var(--ui-card)] shadow-sm text-[var(--ui-text)]'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100'}">
                <span class="text-[10px] font-black uppercase tracking-wider opacity-50">{m}</span>
                <div class="flex items-baseline gap-1">
                    <span class="text-lg font-black">{stats[m as ContrastMode].apca}</span>
                    <span class="text-[10px] font-mono opacity-50">Lc</span>
                </div>
                <!-- Active Indicator -->
                {#if mode === m}
                    <div class="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--current-color)]">
                    </div>
                {/if}
            </button>
        {/each}
    </div>

    <!-- 2. Controls Row (Custom Input & Swap) -->
    <div class="flex items-center gap-4 min-h-[42px]">
        {#if mode === 'custom'}
            <div class="flex-1 relative">
                <input
                    type="text"
                    bind:value={customColor}
                    class="w-full pl-9 pr-4 py-2 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-[var(--current-color)] transition-all uppercase" />
                <div
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-[var(--ui-border)]"
                    style:background-color={customColor}>
                </div>
            </div>
        {:else}
            <div class="flex-1 text-base font-bold text-[var(--ui-text-muted)] italic pl-2">
                Comparing {isFg ? color.hex : mode} vs {isFg ? mode : color.hex}...
            </div>
        {/if}

        <button
            onclick={() => (isFg = !isFg)}
            class="p-2 hover:bg-[var(--ui-bg)] border border-transparent hover:border-[var(--ui-border)] rounded-lg transition-all text-[var(--ui-text-muted)] hover:text-[var(--current-color)] shrink-0"
            title="Swap Foreground/Background">
            <ArrowRightLeft class="w-4 h-4" />
        </button>
    </div>

    <!-- 3. Preview Area -->
    <div
        class="w-full aspect-[2/1] rounded-xl border border-[var(--ui-border)] flex flex-col items-center justify-center text-center p-6 transition-colors duration-300 relative overflow-hidden group"
        style:background-color={bg}
        style:color={fg}>
        <h3 class="text-3xl md:text-4xl font-black mb-2">Sample Contrast</h3>
        <p class="text-sm md:text-base font-medium max-w-[80%] opacity-90">
            How quickly the cunning brown foxes vexed the daft jumping zebras. 1 2 3 4 5 6 7 8 9 0.
        </p>
    </div>

    <!-- 4. Detailed Metrics -->
    <div class="grid grid-cols-2 gap-4">
        <!-- APCA Details -->
        <div class="p-4 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl space-y-2">
            <div class="flex justify-between items-baseline">
                <span
                    class="text-xs font-black uppercase tracking-wider text-[var(--ui-text-muted)]"
                    >APCA</span>
                <span class="text-xl font-black">{currentApca}</span>
            </div>
            <div
                class="text-xs font-medium opacity-70 border-t border-[var(--ui-border)] pt-2 mt-1">
                {getApcaRating(currentApca)}
            </div>
        </div>

        <!-- WCAG Ratio Details -->
        <div class="p-4 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl space-y-2">
            <div class="flex justify-between items-baseline">
                <span
                    class="text-xs font-black uppercase tracking-wider text-[var(--ui-text-muted)]"
                    >Ratio</span>
                <span class="text-xl font-black">{currentWcag.toFixed(2)}:1</span>
            </div>

            <div class="flex justify-between pt-2 mt-1 border-t border-[var(--ui-border)]">
                <div class="flex flex-col items-center gap-1">
                    <span class="text-[10px] font-bold uppercase opacity-50">AA Lg</span>
                    {#if passes(currentWcag, 'AA Large')}
                        <Check class="w-4 h-4 text-green-500" />
                    {:else}
                        <X class="w-4 h-4 text-red-500 opacity-50" />
                    {/if}
                </div>
                <div class="flex flex-col items-center gap-1">
                    <span class="text-[10px] font-bold uppercase opacity-50">AA</span>
                    {#if passes(currentWcag, 'AA')}
                        <Check class="w-4 h-4 text-green-500" />
                    {:else}
                        <X class="w-4 h-4 text-red-500 opacity-50" />
                    {/if}
                </div>
                <div class="flex flex-col items-center gap-1">
                    <span class="text-[10px] font-bold uppercase opacity-50">AAA</span>
                    {#if passes(currentWcag, 'AAA')}
                        <Check class="w-4 h-4 text-green-500" />
                    {:else}
                        <X class="w-4 h-4 text-red-500 opacity-50" />
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
