<script lang="ts">
    import type { ColorName } from 'color-name-list';
    import { AlertCircle } from 'lucide-svelte';
    import { onMount } from 'svelte';
    import { getApp } from '../context';
    import { loadColorNames } from '../data/colors';

    const { color: colorStore } = getApp();

    let searchQuery = $state('');
    let searchInput = $state<HTMLInputElement>();

    // Store as plain array to avoid Proxy overhead on 30k items
    let colorNameList: ColorName[] = [];

    let isLoading = $state(true);
    let loadError = $state<string | null>(null);

    onMount(async () => {
        try {
            colorNameList = await loadColorNames();
        } catch (error) {
            console.error('Failed to load color names:', error);
            loadError = 'Failed to load color library. Please refresh the page.';
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
    let endIndex = $derived(
        Math.min(
            filteredColors.length,
            Math.ceil((throttledScrollTop + viewportHeight) / itemHeight) + buffer,
        ),
    );
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

<div class="flex h-full flex-col">
    {#if !forceExpanded}
        <div class="mb-4 flex items-center justify-between">
            <h3 class="text-xs font-black tracking-widest uppercase opacity-30">Color Library</h3>
            <button
                onclick={() => (isExpanded = !isExpanded)}
                class="
                  text-xs font-bold uppercase opacity-40 transition-opacity
                  hover:opacity-100
                ">
                {isExpanded ? 'Collapse' : 'Expand'}
            </button>
        </div>
    {/if}

    {#if shouldShowContent}
        <div
            class="
              flex flex-1 flex-col overflow-hidden rounded-xl border
              border-(--ui-border) bg-(--ui-bg) p-4
              md:p-6
            ">
            <input
                bind:this={searchInput}
                type="text"
                bind:value={searchQuery}
                placeholder="Search 30,000+ colors..."
                class="
                  mb-4 w-full shrink-0 rounded-md border border-(--ui-border)
                  bg-(--ui-card) p-4 font-mono text-sm shadow-inner outline-none
                  focus:ring-2 focus:ring-brand/20
                " />

            {#if isLoading}
                <div class="flex flex-1 items-center justify-center">
                    <div class="text-center">
                        <div
                            class="
                              mx-auto mb-4 size-12 animate-spin rounded-full
                              border-4 border-(--ui-border)
                              border-t-(--current-color)
                            ">
                        </div>
                        <div class="text-sm opacity-60">Loading color library...</div>
                        <div class="mt-1 text-xs opacity-40">30,000+ colors</div>
                    </div>
                </div>
            {:else if loadError}
                <div class="flex flex-1 items-center justify-center">
                    <div class="text-center text-red-500">
                        <AlertCircle class="mx-auto mb-4 size-12" />
                        <div class="text-sm">{loadError}</div>
                    </div>
                </div>
            {:else}
                <div
                    class="custom-scrollbar relative flex-1 overflow-y-auto"
                    onscroll={handleScroll}
                    bind:clientHeight={viewportHeight}>
                    {#if filteredColors.length > 0}
                        <div
                            style:height="{totalHeight}px"
                            class="
                              pointer-events-none absolute top-0 left-0 w-full
                            ">
                        </div>

                        <div
                            style:transform="translateY({offsetY}px)"
                            class="absolute top-0 left-0 w-full px-1">
                            {#each visibleItems as color (color.hex + color.name)}
                                <button
                                    onclick={() => selectColor(color.hex)}
                                    class="
                                      group mb-1 box-border flex h-14 w-full
                                      items-center gap-4 rounded-md p-2
                                      text-left transition-colors
                                      hover:bg-(--ui-card)
                                    ">
                                    <div
                                        class="
                                          size-10 shrink-0 rounded-sm border
                                          border-white/10 shadow-sm
                                          transition-transform
                                          [background:var(--item-bg)]
                                          group-hover:scale-110
                                        "
                                        style:--item-bg={color.hex}
                                        title={colorStore.formatColor(color.hex)}>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div
                                            class="
                                              truncate text-sm font-bold
                                              text-(--ui-text)
                                            ">
                                            {color.name}
                                        </div>
                                        <div
                                            class="
                                              font-mono text-xs tracking-wider
                                              uppercase opacity-70
                                            ">
                                            {color.hex}
                                        </div>
                                    </div>
                                </button>
                            {/each}
                        </div>
                    {:else}
                        <div
                            class="
                              flex h-full items-center justify-center text-sm
                              opacity-60
                            ">
                            No colors found
                        </div>
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
