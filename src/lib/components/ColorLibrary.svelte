<script lang="ts">
    import type { ColorName } from "color-name-list";
    import { onMount } from "svelte";
    import { getApp } from "../context";
    import { loadColorNames } from "../data/colors";
    import { AlertCircle } from "lucide-svelte";

    const { color: colorStore } = getApp();

    let searchQuery = $state("");
    let searchInput = $state<HTMLInputElement>();

    // Store as plain array to avoid Proxy overhead on 30k items
    let colorNameList: ColorName[] = [];

    let isLoading = $state(true);
    let loadError = $state<string | null>(null);

    onMount(async () => {
        try {
            colorNameList = await loadColorNames();
        } catch (error) {
            console.error("Failed to load color names:", error);
            loadError = "Failed to load color library. Please refresh the page.";
        } finally {
            isLoading = false;
        }
    });

    let filteredColors = $derived.by(() => {
        // Track isLoading to ensure we update when data arrives
        if (isLoading) return [];

        if (!colorNameList || colorNameList.length === 0) return [];
        if (!searchQuery.trim()) return colorNameList;

        const q = searchQuery.toLowerCase();
        // Fast native filter on non-proxied array
        return colorNameList.filter((c) => c.name.toLowerCase().includes(q));
    });

    let _scrollTop = $state(0);
    let throttledScrollTop = $state(0);
    let viewportHeight = $state(400);
    const itemHeight = 56;
    const buffer = 10;
    let animationFrameId: number | null = null;

    function handleScroll(e: Event) {
        const target = e.target as HTMLElement;
        _scrollTop = target.scrollTop;

        if (animationFrameId === null) {
            animationFrameId = requestAnimationFrame(() => {
                throttledScrollTop = _scrollTop;
                animationFrameId = null;
            });
        }
    }

    let totalHeight = $derived(filteredColors.length * itemHeight);
    let startIndex = $derived(Math.max(0, Math.floor(throttledScrollTop / itemHeight) - buffer));
    let endIndex = $derived(Math.min(filteredColors.length, Math.ceil((throttledScrollTop + viewportHeight) / itemHeight) + buffer));
    let visibleItems = $derived(filteredColors.slice(startIndex, endIndex));
    let offsetY = $derived(startIndex * itemHeight);

    interface Props {
        onSelect?: () => void;
        forceExpanded?: boolean;
    }

    let { onSelect, forceExpanded = false }: Props = $props();

    function selectColor(hex: string) {
        colorStore.set(hex);
        onSelect?.();
    }

    let isExpanded = $state(false);
    let shouldShowContent = $derived(forceExpanded || isExpanded);

    $effect(() => {
        if (shouldShowContent && searchInput) {
            searchInput.focus();
        }
    });
</script>

<div class="h-full flex flex-col">
    {#if !forceExpanded}
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-xs font-black uppercase tracking-widest opacity-30">Color Library</h3>
            <button onclick={() => (isExpanded = !isExpanded)} class="text-xs font-bold uppercase opacity-40 hover:opacity-100 transition-opacity">
                {isExpanded ? "Collapse" : "Expand"}
            </button>
        </div>
    {/if}

    {#if shouldShowContent}
        <div class="flex-1 flex flex-col bg-[var(--ui-bg)] border border-[var(--ui-border)] p-4 md:p-6 overflow-hidden rounded-xl">
            <input bind:this={searchInput} type="text" bind:value={searchQuery} placeholder="Search 30,000+ colors..." class="w-full p-4 mb-4 bg-[var(--ui-card)] border border-[var(--ui-border)] font-mono text-sm outline-none focus:ring-2 focus:ring-brand/20 flex-shrink-0 shadow-inner rounded-md" />

            {#if isLoading}
                <div class="flex-1 flex items-center justify-center">
                    <div class="text-center">
                        <div class="w-12 h-12 border-4 border-[var(--ui-border)] border-t-[var(--current-color)] rounded-full animate-spin mx-auto mb-4"></div>
                        <div class="text-sm opacity-60">Loading color library...</div>
                        <div class="text-xs opacity-40 mt-1">30,000+ colors</div>
                    </div>
                </div>
            {:else if loadError}
                <div class="flex-1 flex items-center justify-center">
                    <div class="text-center text-red-500">
                        <AlertCircle class="w-12 h-12 mx-auto mb-4" />
                        <div class="text-sm">{loadError}</div>
                    </div>
                </div>
            {:else}
                <div class="flex-1 overflow-y-auto custom-scrollbar relative" onscroll={handleScroll} bind:clientHeight={viewportHeight}>
                    {#if filteredColors.length > 0}
                        <div style:height="{totalHeight}px" class="w-full absolute top-0 left-0 pointer-events-none"></div>

                        <div style:transform="translateY({offsetY}px)" class="absolute top-0 left-0 w-full px-1">
                            {#each visibleItems as color (color.hex + color.name)}
                                <button onclick={() => selectColor(color.hex)} class="w-full flex items-center gap-4 p-2 h-[56px] hover:bg-[var(--ui-card)] transition-colors group box-border mb-1 text-left rounded-md">
                                    <div class="w-10 h-10 border border-white/10 shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 rounded-sm [background:var(--item-bg)]" style:--item-bg={color.hex} title={colorStore.formatColor(color.hex)}></div>
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-bold truncate text-[var(--ui-text)]">{color.name}</div>
                                        <div class="text-xs font-mono opacity-70 uppercase tracking-wider">{color.hex}</div>
                                    </div>
                                </button>
                            {/each}
                        </div>
                    {:else}
                        <div class="flex h-full items-center justify-center text-sm opacity-60">No colors found</div>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: var(--ui-border);
        border-radius: 9999px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: oklch(from var(--current-color) l c h / 0.7);
    }

    @media (prefers-color-scheme: dark) {
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: oklch(from var(--current-color) calc(l * 0.6) calc(c * 1.2) h / 0.9);
        }
    }
</style>
