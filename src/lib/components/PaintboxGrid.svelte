<script lang="ts">
    import { getApp } from '../context';

    const { color, paintbox } = getApp();

    const desktopCols = 6;
    const mobileCols = 4;
    const minRows = 2;

    const items = $derived(paintbox.items);
    const itemCount = $derived(items.length);

    // Calculate total slots needed to fill the desktop grid (min 2 rows)
    const totalSlots = $derived(Math.max(desktopCols * minRows, itemCount));
    const emptySlotsCount = $derived(totalSlots - itemCount);

    // Calculate how many empty slots are needed for mobile (min 2 rows)
    const mobileEmptyLimit = $derived(Math.max(mobileCols * minRows, itemCount) - itemCount);
</script>

<div
    class="
  grid grid-cols-4 gap-3
  md:grid-cols-6
">
    {#each items as item (item.id)}
        <div class="group relative aspect-square">
            <button
                class="
                  block size-full cursor-pointer rounded-full border
                  border-white/10 p-0 shadow-lg transition-transform
                  [background:var(--paintbox-item)]
                  hover:scale-105
                "
                style:--paintbox-item={item.css}
                onclick={() => color.set(item.css)}
                title={color.formatColor(item.css)}
                aria-label="Select saved color"></button>
            <button
                onclick={(e) => {
                    e.stopPropagation();
                    paintbox.remove(item.id);
                }}
                class="
                  absolute -top-2 -right-2 z-10 flex size-6 items-center
                  justify-center rounded-full bg-black/50 text-sm font-bold
                  text-white opacity-0 shadow-lg transition-all
                  group-hover:opacity-100
                  hover:bg-red-500
                "
                aria-label="Remove color">×</button>
        </div>
    {/each}

    {#each Array(emptySlotsCount) as _, i (i)}
        <div
            class="
          relative aspect-square
          {i >= mobileEmptyLimit
                ? `
            hidden
            md:block
          `
                : `block`}">
            <div
                class="
                  block size-full rounded-full border border-(--ui-border)
                  bg-(--ui-bg) opacity-40
                ">
            </div>
        </div>
    {/each}
</div>
