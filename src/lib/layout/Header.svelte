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
    class="
      hover:text-on-current
      fixed top-6 right-6 z-60 cursor-pointer rounded-full border
      border-(--ui-border) bg-(--ui-card) p-3 shadow-lg transition-all
      hover:bg-(--current-color)
    "
    aria-label="Toggle Theme"
    title="Toggle Light/Dark Mode">
    {#if theme.current === 'dark'}
        <Moon class="size-5" />
    {:else}
        <Sun class="size-5" />
    {/if}
</button>

<header
    class="
      sticky top-0 z-50
      bg-[color-mix(in_oklch,var(--current-color)_20%,transparent)]
      backdrop-blur-sm transition-colors duration-500
    "
    style="mask-image: linear-gradient(to bottom, black 50%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);">
    <div
        class="
          mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4
          p-4 pb-12
          sm:px-8 sm:py-6
        ">
        <button
            onclick={onSearch}
            class="
              hover:text-on-current
              cursor-pointer rounded-full border border-(--ui-border)
              bg-(--ui-card) p-2 shadow-lg transition-all
              hover:bg-(--current-color)
              sm:p-3
            "
            aria-label="Search colors"
            title="Search color library">
            <Search
                class="
                  size-5
                  sm:size-6
                " />
        </button>

        <div class="grid grid-cols-1 place-items-center overflow-hidden">
            {#key engine.closestName}
                <div
                    class="col-start-1 row-start-1 flex w-full justify-center"
                    transition:fade={{ duration: 500 }}>
                    <Title name={engine.closestName} />
                </div>
            {/key}
        </div>

        <button
            onclick={() => color.randomize()}
            class="
              hover:text-on-current
              cursor-pointer rounded-full border border-(--ui-border)
              bg-(--ui-card) p-2 shadow-lg transition-all
              hover:bg-(--current-color)
              sm:p-3
            "
            aria-label="Random color"
            title="Generate random color">
            <RefreshCw
                class="
                  size-5
                  sm:size-6
                " />
        </button>
    </div>
</header>
