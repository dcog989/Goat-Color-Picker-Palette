<script lang="ts">
import ContrastChecker from "../components/ContrastChecker.svelte";
</script>

<section
  class="
      panel flex h-full flex-col overflow-y-auto
    "
>
  <div class="mb-6">
    <h2
      class="
              text-xs font-black tracking-widest text-(--ui-text-muted)
              uppercase
            "
    >
      Contrast Checker
    </h2>
  </div>

  <div class="flex-1">
    <ContrastChecker />
  </div>
</section>
