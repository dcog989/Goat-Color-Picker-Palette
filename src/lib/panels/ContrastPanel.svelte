<script lang="ts">
    import ContrastChecker from '../components/ContrastChecker.svelte';
</script>

<section
    class="p-8 rounded-xl bg-[var(--ui-card)] border border-[var(--ui-border)] shadow-xl h-full flex flex-col">
    <div class="mb-6">
        <h2 class="text-xs font-black uppercase tracking-widest text-[var(--ui-text-muted)]">
            Contrast Checker
        </h2>
    </div>

    <div class="flex-1">
        <ContrastChecker />
    </div>
</section>
