<script lang="ts">
import Copy from "@lucide/svelte/icons/copy";
import Plus from "@lucide/svelte/icons/plus";
import { getApp } from "../context";
import { usesDarkText } from "../utils/text-contrast";

const { color, paintbox, toast } = getApp();

interface Props {
  color: string;
  index: number;
  onSelect?: () => void;
  dynamicClass?: boolean;
}

let { color: swatchColor, index, onSelect, dynamicClass = true }: Props = $props();

const copy = async (e: MouseEvent) => {
  const formatted = color.formatColor(swatchColor);
  try {
    await navigator.clipboard.writeText(formatted);
    toast.showAt("Copied", e);
  } catch {
    toast.showAt("Copy failed", e);
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    color.set(swatchColor);
  }
};

const getActionClass = () => {
  if (!dynamicClass) return "";
  return usesDarkText(swatchColor)
    ? "bg-black/10 hover:bg-black/20 text-black"
    : "bg-white/20 hover:bg-white/30 text-white";
};
</script>

<div
  role="button"
  tabindex="0"
  class="
      group relative aspect-square cursor-pointer overflow-hidden rounded-lg
      border border-white/10 shadow-md
      [background:var(--swatch-color)]
      hover:scale-105
    "
  style:--swatch-color={swatchColor}
  title={color.formatColor(swatchColor)}
  onclick={() => (onSelect ? onSelect() : color.set(swatchColor))}
  onkeydown={handleKeyDown}
  aria-label="Select swatch {index + 1}"
>
  <div
    class="
          absolute inset-0 flex items-center justify-center
          overflow-hidden
        "
  >
    <div
      class="
              flex items-center justify-center gap-2
              translate-y-8 opacity-0
              transition-all duration-300
              group-hover:translate-y-0 group-hover:opacity-100
            "
    >
      <button
        onclick={(e) => {
          e.stopPropagation();
          paintbox.add(swatchColor);
          toast.showAt("Added", e);
        }}
        class="overlay-button {getActionClass()}"
        title="Add to paintbox"
        type="button"
      >
        <Plus class="pointer-events-none size-4" />
      </button>
      <button
        onclick={(e) => {
          e.stopPropagation();
          copy(e);
        }}
        class="overlay-button {getActionClass()}"
        title="Copy"
        type="button"
      >
        <Copy class="pointer-events-none size-4" />
      </button>
    </div>
  </div>
</div>
