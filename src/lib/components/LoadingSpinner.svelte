<script lang="ts">
interface Props {
    message: string;
    subtitle?: string;
}

let { message, subtitle }: Props = $props();
</script>

<div class="flex flex-1 items-center justify-center">
    <div class="text-center">
        <div
            class="
              mx-auto mb-4 size-12 animate-spin rounded-full
              border-4 border-(--ui-border)
              border-t-(--current-color)
            "
        ></div>
        <div class="text-sm opacity-60">{message}</div>
        {#if subtitle}
            <div class="mt-1 text-xs opacity-40">{subtitle}</div>
        {/if}
    </div>
</div>
