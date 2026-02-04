<script lang="ts">
    import { Copy, Plus } from 'lucide-svelte';
    import { converter, parse, type Oklch } from 'culori/fn';
    import { getApp } from '../context';

    const { color, paintbox, toast } = getApp();
    const toOklch = converter<Oklch>('oklch');

    interface Props {
        color: string;
        index: number;
        onSelect?: () => void;
        dynamicClass?: boolean;
    }

    let { color: swatchColor, index, onSelect, dynamicClass = true }: Props = $props();

    const copy = (e: MouseEvent) => {
        const formatted = color.formatColor(swatchColor);
        navigator.clipboard.writeText(formatted);
        toast.show('Copied', e);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            color.set(swatchColor);
        }
    };

    const getActionClass = () => {
        if (!dynamicClass) {
            return 'bg-white/30 hover:bg-white/50 text-white';
        }
        const parsed = parse(swatchColor);
        const l = parsed ? (toOklch(parsed)?.l ?? 0) : 0;
        return l > 0.6
            ? 'bg-black/10 hover:bg-black/20 text-black'
            : 'bg-white/20 hover:bg-white/30 text-white';
    };
</script>

<div
    role="button"
    tabindex="0"
    class="
      group relative aspect-square cursor-pointer overflow-hidden rounded-lg
      border border-white/10 shadow-md
      will-change-transform
      [background:var(--swatch-color)]
      hover:scale-105
    "
    style:--swatch-color={swatchColor}
    title={color.formatColor(swatchColor)}
    onclick={() => (onSelect ? onSelect() : color.set(swatchColor))}
    onkeydown={handleKeyDown}
    aria-label="Select swatch {index + 1}">
    <div
        class="
          absolute inset-0 flex items-center justify-center gap-2
          opacity-0 transition-opacity
          group-hover:opacity-100
        ">
        <button
            onclick={(e) => {
                e.stopPropagation();
                paintbox.add(swatchColor);
                toast.show('Added', e);
            }}
            class="{getActionClass()}
              cursor-pointer rounded-full p-3 shadow-sm
              transition-transform duration-200
              will-change-transform
              hover:scale-110
            "
            title="Add to paintbox"
            type="button">
            <Plus class="pointer-events-none size-4" />
        </button>
        <button
            onclick={(e) => {
                e.stopPropagation();
                copy(e);
            }}
            class="{getActionClass()}
              cursor-pointer rounded-full p-3 shadow-sm
              transition-transform duration-200
              will-change-transform
              hover:scale-110
            "
            title="Copy"
            type="button">
            <Copy class="pointer-events-none size-4" />
        </button>
    </div>
</div>
