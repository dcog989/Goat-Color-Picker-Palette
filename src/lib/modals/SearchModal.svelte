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
    class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
    transition:fade={{ duration: 300, easing: quadOut }}>
    <button
        type="button"
        class="absolute inset-0 bg-black/70 backdrop-blur-xl cursor-default"
        onclick={onClose}
        aria-label="Close search"></button>
    <div
        class="w-full max-w-4xl h-[80vh] bg-[var(--ui-card)] p-6 md:p-8 rounded-xl md:rounded-3xl shadow-2xl relative flex flex-col"
        role="dialog"
        transition:scale={{ duration: 300, easing: quadOut, start: 0.95 }}>
        <header class="flex justify-between items-center mb-4 flex-shrink-0 z-10">
            <h2 class="text-xl md:text-2xl font-black uppercase tracking-widest">Color Library</h2>
            <button
                onclick={onClose}
                class="text-2xl md:text-3xl opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Close">
                ×
            </button>
        </header>
        <div class="flex-1 min-h-0 relative">
            <ColorLibrary onSelect={onClose} forceExpanded={true} />
        </div>
    </div>
</div>
