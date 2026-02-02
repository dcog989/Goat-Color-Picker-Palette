<script lang="ts">
    import { quadOut } from 'svelte/easing';
    import { fade, scale } from 'svelte/transition';

    interface Props {
        title: string;
        content: string;
        onClose: () => void;
    }

    let { title, content, onClose }: Props = $props();
</script>

<div
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
    transition:fade={{ duration: 300, easing: quadOut }}>
    <button
        type="button"
        class="absolute inset-0 bg-black/70 backdrop-blur-xl cursor-default"
        onclick={onClose}
        aria-label="Close modal"></button>
    <div
        class="w-full max-w-2xl max-h-[80vh] bg-[var(--ui-card)] p-6 md:p-8 rounded-xl md:rounded-3xl shadow-2xl relative flex flex-col"
        role="dialog"
        transition:scale={{ duration: 300, easing: quadOut, start: 0.95 }}>
        <header class="flex justify-between items-center mb-6 flex-shrink-0">
            <h2 class="text-xl md:text-2xl font-black uppercase tracking-widest">{title}</h2>
            <button
                onclick={onClose}
                class="text-2xl md:text-3xl opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Close">×</button>
        </header>
        <div class="flex-1 overflow-y-auto text-[var(--ui-text)] leading-relaxed">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- Content is trusted markdown from internal sources -->
            {@html content}
        </div>
    </div>
</div>
