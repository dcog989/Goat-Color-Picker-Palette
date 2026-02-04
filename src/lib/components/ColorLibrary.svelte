<script lang="ts">
    import type { ColorName } from 'color-name-list';
    import { CircleAlert } from 'lucide-svelte';
    import { onDestroy, onMount } from 'svelte';
    import { getApp } from '../context';
    import { loadColorNames } from '../data/colors';
    import ColorNameSearchWorker from '../workers/color-name-search.ts?worker';

    const { color: colorStore } = getApp();

    let searchQuery = $state('');
    let searchInput = $state<HTMLInputElement>();

    let colorNameList: ColorName[] = [];
    let workerFilteredColors: Array<{ name: string; hex: string }> = $state([]);

    let isLoading = $state(true);
    let isFiltering = $state(false);
    let loadError = $state<string | null>(null);

    let filterWorker: Worker | null = null;

    const INITIAL_DISPLAY_LIMIT = 100;
    let displayedColors = $state<Array<{ name: string; hex: string }>>([]);

    onMount(async () => {
        filterWorker = new ColorNameSearchWorker();

        filterWorker.onmessage = (e) => {
            if (e.data.type === 'filterResult') {
                workerFilteredColors = e.data.colors || [];
                isFiltering = false;
            }
        };

        try {
            colorNameList = await loadColorNames();
            displayedColors = colorNameList.slice(0, INITIAL_DISPLAY_LIMIT);
        } catch (error) {
            console.error('Failed to load color names:', error);
            loadError = 'Failed to load color library. Please refresh the page.';
        } finally {
            isLoading = false;
        }
    });

    onDestroy(() => {
        filterWorker?.terminate();
    });

    $effect(() => {
        if (filterWorker && searchQuery.trim()) {
            isFiltering = true;
            filterWorker.postMessage({
                type: 'filter',
                query: searchQuery,
                limit: 500,
            });
        } else if (!searchQuery.trim() && !isLoading) {
            displayedColors = colorNameList.slice(0, INITIAL_DISPLAY_LIMIT);
        }
    });

    let filteredColors = $derived.by((): Array<{ name: string; hex: string }> => {
        if (isLoading) return [];
        return searchQuery.trim() ? workerFilteredColors : displayedColors;
    });

    let _scrollTop = $state(0);
    let throttledScrollTop = $state(0);
    let viewportHeight = $state(400);
    const itemHeight = 56;
    const buffer = 5;
    let scrollThrottleTimeout: number | null = null;

    function handleScroll(e: Event) {
        const target = e.target as HTMLElement;
        _scrollTop = target.scrollTop;

        if (scrollThrottleTimeout !== null) {
            return;
        }

        scrollThrottleTimeout = window.setTimeout(() => {
            throttledScrollTop = _scrollTop;
            scrollThrottleTimeout = null;

            if (!searchQuery.trim() && !isLoading) {
                const scrolledNearBottom =
                    _scrollTop + viewportHeight > displayedColors.length * itemHeight - 500;
                if (scrolledNearBottom && displayedColors.length < colorNameList.length) {
                    const nextBatch = colorNameList.slice(
                        displayedColors.length,
                        displayedColors.length + 100,
                    );
                    displayedColors = [...displayedColors, ...nextBatch];
                }
            }
        }, 16);
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
                id="searchInput"
                bind:this={searchInput}
                type="text"
                bind:value={searchQuery}
                placeholder="Search 30,000+ colors..."
                class="
                  focus:ring-brand/20 mb-4 w-full shrink-0 rounded-md border
                  border-(--ui-border) bg-(--ui-card) p-4 font-mono text-sm shadow-inner
                  outline-none focus:ring-2
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
            {:else if isFiltering}
                <div class="flex flex-1 items-center justify-center">
                    <div class="text-center">
                        <div
                            class="
                              mx-auto mb-4 size-12 animate-spin rounded-full
                              border-4 border-(--ui-border)
                              border-t-(--current-color)
                            ">
                        </div>
                        <div class="text-sm opacity-60">Searching...</div>
                    </div>
                </div>
            {:else if loadError}
                <div class="flex flex-1 items-center justify-center">
                    <div class="text-center text-red-500">
                        <CircleAlert class="mx-auto mb-4 size-12" />
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
                            class="pointer-events-none absolute top-0 left-0 w-full">
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
