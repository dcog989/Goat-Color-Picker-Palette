<script lang="ts">
    import { Moon, RefreshCw, Search, Sun } from 'lucide-svelte';
    import { fade } from 'svelte/transition';
    import Title from '../components/Title.svelte';
    import { getApp } from '../context';

    interface Props {
        onSearch: () => void;
    }

    let { onSearch }: Props = $props();

    const { color, engine, theme } = getApp();
</script>

<button
    onclick={() => theme.toggle()}
    class="fixed top-6 right-6 z-[60] p-3 rounded-full bg-[var(--ui-card)] border border-[var(--ui-border)] hover:bg-[var(--current-color)] transition-all shadow-lg cursor-pointer hover:text-on-current"
    aria-label="Toggle Theme"
    title="Toggle Light/Dark Mode">
    {#if theme.current === 'dark'}
        <Moon class="w-5 h-5" />
    {:else}
        <Sun class="w-5 h-5" />
    {/if}
</button>

<header
    class="sticky top-0 z-50 backdrop-blur-sm bg-[color-mix(in_oklch,var(--current-color)_20%,transparent)] transition-colors duration-500"
    style="mask-image: linear-gradient(to bottom, black 50%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);">
    <div
        class="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 grid grid-cols-[auto_1fr_auto] items-center gap-4 pb-12">
        <button
            onclick={onSearch}
            class="p-2 sm:p-3 rounded-full bg-[var(--ui-card)] border border-[var(--ui-border)] hover:bg-[var(--current-color)] transition-all shadow-lg cursor-pointer hover:text-on-current"
            aria-label="Search colors"
            title="Search color library">
            <Search class="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div class="grid grid-cols-1 place-items-center overflow-hidden">
            {#key engine.closestName}
                <div
                    class="col-start-1 row-start-1 w-full flex justify-center"
                    transition:fade={{ duration: 500 }}>
                    <Title name={engine.closestName} />
                </div>
            {/key}
        </div>

        <button
            onclick={() => color.randomize()}
            class="p-2 sm:p-3 rounded-full bg-[var(--ui-card)] border border-[var(--ui-border)] hover:bg-[var(--current-color)] transition-all shadow-lg cursor-pointer hover:text-on-current"
            aria-label="Random color"
            title="Generate random color">
            <RefreshCw class="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
    </div>
</header>
