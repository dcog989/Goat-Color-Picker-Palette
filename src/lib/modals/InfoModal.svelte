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
    class="
      fixed inset-0 z-100 flex items-center justify-center p-4
      md:p-8
    "
    transition:fade={{ duration: 300, easing: quadOut }}>
    <button
        type="button"
        class="absolute inset-0 cursor-default bg-black/70 backdrop-blur-xl"
        onclick={onClose}
        aria-label="Close modal"></button>
    <div
        class="
          relative flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl
          bg-(--ui-card) p-6 shadow-2xl
          md:rounded-3xl md:p-8
        "
        role="dialog"
        transition:scale={{ duration: 300, easing: quadOut, start: 0.95 }}>
        <header class="mb-6 flex shrink-0 items-center justify-between">
            <h2
                class="
                  text-xl font-black tracking-widest uppercase
                  md:text-2xl
                ">
                {title}
            </h2>
            <button
                onclick={onClose}
                class="
                  cursor-pointer text-2xl opacity-50 transition-opacity
                  hover:opacity-100
                  md:text-3xl
                "
                aria-label="Close">×</button>
        </header>
        <div class="flex-1 overflow-y-auto leading-relaxed text-(--ui-text)">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- Content is trusted markdown from internal sources -->
            {@html content}
        </div>
    </div>
</div>
