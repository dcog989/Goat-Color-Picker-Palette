<script lang="ts">
    import { getApp } from '../context';

    const { color: colorStore, paintbox } = getApp();

    interface Props {
        color: string;
        onSelect?: () => void;
        size?: 'sm' | 'md' | 'lg';
        showActions?: boolean;
    }

    let { color, onSelect, size = 'md', showActions = true }: Props = $props();

    const sizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-16 h-16',
        lg: 'aspect-square',
    };

    const handleClick = () => {
        if (onSelect) {
            onSelect();
        } else {
            colorStore.set(color);
        }
    };
</script>

<div class="group relative">
    <button
        onclick={handleClick}
        class="{sizeClasses[size]}
          cursor-pointer rounded-lg border border-white/10 shadow-lg
          transition-transform [background:var(--swatch-color)]
          hover:scale-105
        "
        style:--swatch-color={color}
        aria-label="Color swatch"></button>

    {#if showActions}
        <button
            onclick={(e) => {
                e.stopPropagation();
                paintbox.add(color);
            }}
            class="
              absolute -bottom-2 left-1/2 flex size-8 -translate-x-1/2
              items-center justify-center rounded-full bg-(--current-color)
              text-lg font-bold text-white opacity-0 shadow-lg
              transition-opacity
              group-hover:opacity-100
            "
            title="Add to paintbox">
            +
        </button>
    {/if}
</div>
