<script lang="ts">
    import { getApp } from "../context";

    const { color: colorStore, paintbox } = getApp();

    interface Props {
        color: string;
        onSelect?: () => void;
        size?: "sm" | "md" | "lg";
        showActions?: boolean;
    }

    let { color, onSelect, size = "md", showActions = true }: Props = $props();

    const sizeClasses = {
        sm: "w-10 h-10",
        md: "w-16 h-16",
        lg: "aspect-square",
    };

    const handleClick = () => {
        if (onSelect) {
            onSelect();
        } else {
            colorStore.set(color);
        }
    };
</script>

<div class="relative group">
    <button onclick={handleClick} class="{sizeClasses[size]} border border-white/10 shadow-lg hover:scale-105 transition-transform cursor-pointer rounded-lg [background:var(--swatch-color)]" style:--swatch-color={color} aria-label="Color swatch"></button>

    {#if showActions}
        <button
            onclick={(e) => {
                e.stopPropagation();
                paintbox.add(color);
            }}
            class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-[var(--current-color)] text-white rounded-full text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
            title="Add to paintbox"
        >
            +
        </button>
    {/if}
</div>
