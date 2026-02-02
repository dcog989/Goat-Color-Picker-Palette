<script lang="ts">
    import { quadOut } from 'svelte/easing';
    import { fade, scale } from 'svelte/transition';
    import ColorLibrary from '../components/ColorLibrary.svelte';

    interface Props {
        onClose: () => void;
    }

    let { onClose }: Props = $props();
</script>

<div
    class="
      fixed inset-0 z-50 flex items-center justify-center p-4
      md:p-8
    "
    transition:fade={{ duration: 300, easing: quadOut }}>
    <button
        type="button"
        class="absolute inset-0 cursor-default bg-black/70 backdrop-blur-xl"
        onclick={onClose}
        aria-label="Close search"></button>
    <div
        class="
          relative flex h-[80vh] w-full max-w-4xl flex-col rounded-xl
          bg-(--ui-card) p-6 shadow-2xl
          md:rounded-3xl md:p-8
        "
        role="dialog"
        transition:scale={{ duration: 300, easing: quadOut, start: 0.95 }}>
        <header class="z-10 mb-4 flex shrink-0 items-center justify-between">
            <h2
                class="
                  text-xl font-black tracking-widest uppercase
                  md:text-2xl
                ">
                Color Library
            </h2>
            <button
                onclick={onClose}
                class="
                  cursor-pointer text-2xl opacity-50 transition-opacity
                  hover:opacity-100
                  md:text-3xl
                "
                aria-label="Close">
                ×
            </button>
        </header>
        <div class="relative min-h-0 flex-1">
            <ColorLibrary onSelect={onClose} forceExpanded={true} />
        </div>
    </div>
</div>
