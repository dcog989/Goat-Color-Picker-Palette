<script lang="ts">
    import ContrastChecker from '../components/ContrastChecker.svelte';
</script>

<section
    class="
      flex h-full flex-col rounded-xl border border-(--ui-border) bg-(--ui-card)
      p-8 shadow-xl
    ">
    <div class="mb-6">
        <h2
            class="
              text-xs font-black tracking-widest text-(--ui-text-muted)
              uppercase
            ">
            Contrast Checker
        </h2>
    </div>

    <div class="flex-1">
        <ContrastChecker />
    </div>
</section>
