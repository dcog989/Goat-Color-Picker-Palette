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

<div class="grid grid-cols-4 md:grid-cols-6 gap-3">
    {#each items as item (item.id)}
        <div class="aspect-square relative group">
            <button
                class="w-full h-full rounded-full cursor-pointer transition-transform hover:scale-105 border border-white/10 shadow-lg block p-0 [background:var(--paintbox-item)]"
                style:--paintbox-item={item.css}
                onclick={() => color.set(item.css)}
                title={color.formatColor(item.css)}
                aria-label="Select saved color"></button>
            <button
                onclick={(e) => {
                    e.stopPropagation();
                    paintbox.remove(item.id);
                }}
                class="absolute -top-2 -right-2 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg z-10"
                aria-label="Remove color">×</button>
        </div>
    {/each}

    {#each Array(emptySlotsCount) as _, i (i)}
        <div class="aspect-square relative {i >= mobileEmptyLimit ? 'hidden md:block' : 'block'}">
            <div
                class="w-full h-full rounded-full bg-[var(--ui-bg)] border border-[var(--ui-border)] opacity-40 block">
            </div>
        </div>
    {/each}
</div>
