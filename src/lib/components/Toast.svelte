<script lang="ts">
    import { getApp } from '../context';

    const { toast } = getApp();

    const isCursor = $derived(toast.active?.x !== undefined && toast.active?.y !== undefined);
</script>

{#if toast.active}
    <!-- Wrapper handles fixed positioning to avoid transform conflicts with inner animation -->
    <div
        class="
          pointer-events-none fixed z-100
          {isCursor ? '' : 'bottom-8 left-1/2 -translate-x-1/2'}"
        style:top={isCursor ? `${toast.active.y}px` : undefined}
        style:left={isCursor ? `${toast.active.x}px` : undefined}
        style:transform={isCursor ? 'translate(-50%, -100%) translateY(-12px)' : undefined}>
        <div
            class="
              rounded-lg border border-(--ui-border) bg-(--ui-card) p-4 text-xs
              font-bold tracking-wider text-(--ui-text) uppercase shadow-xl
              {isCursor ? 'animate-scale-in' : 'animate-slide-up'}">
            {toast.active.message}
        </div>
    </div>
{/if}
