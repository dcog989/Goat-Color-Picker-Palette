<script lang="ts">
    import { getApp } from "../context";

    const { toast } = getApp();

    const isCursor = $derived(toast.active?.x !== undefined && toast.active?.y !== undefined);
</script>

{#if toast.active}
    <!-- Wrapper handles fixed positioning to avoid transform conflicts with inner animation -->
    <div class="fixed z-[100] pointer-events-none {isCursor ? '' : 'bottom-8 left-1/2 -translate-x-1/2'}" style:top={isCursor ? `${toast.active.y}px` : undefined} style:left={isCursor ? `${toast.active.x}px` : undefined} style:transform={isCursor ? "translate(-50%, -100%) translateY(-12px)" : undefined}>
        <div class="px-4 py-4 bg-[var(--ui-card)] border border-[var(--ui-border)] text-[var(--ui-text)] rounded-lg shadow-xl font-bold uppercase tracking-wider text-xs {isCursor ? 'animate-scale-in' : 'animate-slide-up'}">
            {toast.active.message}
        </div>
    </div>
{/if}
