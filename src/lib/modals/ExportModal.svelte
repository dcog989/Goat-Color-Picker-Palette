<script lang="ts">
import { getApp } from "../context";
import type { ExportFormat } from "../utils/formatters";
import { exportCode, exportCodeFile, strategies } from "../utils/strategies";

interface Props {
  onClose: () => void;
}

let { onClose }: Props = $props();

const app = getApp();

let exportFormat = $state<ExportFormat>("oklch");

const exports = $derived.by(() =>
  Object.entries(strategies).map(([key, strategy]) => ({
    key,
    name: strategy.name,
    extension: strategy.extension,
    content: exportCode(app, key, exportFormat),
  })),
);
</script>

<div
  class="
      animate-fade-in fixed inset-0 z-50 flex items-start justify-center
      p-4 pt-12 md:p-8 md:pt-16
    "
>
  <button type="button" class="modal-scrim" onclick={onClose} aria-label="Close export dialog"></button>
  <div
    class="
          animate-scale-in relative max-h-[90vh] w-full max-w-3xl space-y-6
          overflow-y-auto rounded-3xl bg-(--ui-card) p-6 shadow-2xl
          md:space-y-8 md:p-12
        "
    role="dialog"
  >
    <header
      class="
              sticky top-0 z-10 flex items-center justify-between bg-(--ui-card)
              pb-4
            "
    >
      <h2
        class="
                  text-2xl font-black tracking-widest uppercase
                  md:text-3xl
                "
      >
        Export Code
      </h2>
      <div
        class="
                  flex items-center gap-2
                  md:gap-4
                "
      >
        <select bind:value={exportFormat} class="select-control">
          <option value="oklch">OKLCH</option>
          <option value="hex">HEX</option>
          <option value="hsl">HSL</option>
          <option value="rgb">RGB</option>
        </select>
        <button type="button" onclick={onClose} class="modal-close" aria-label="Close">×</button>
      </div>
    </header>
    <div class="space-y-6">
      {#each exports as exportItem (exportItem.name)}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span
              class="
                              text-xs font-bold tracking-wider uppercase
                              opacity-50
                            "
              >{exportItem.name}</span
            >
            <button
              type="button"
              onclick={(e) => app.copy(exportItem.content, e)}
              class="
                              group flex cursor-pointer items-center overflow-hidden
                              rounded-md border border-transparent px-3 py-1
                              text-xs font-bold uppercase transition-all
                              duration-200
                              hover:border-(--ui-border) hover:bg-(--ui-bg)
                            "
            >
              <span class="shrink-0 text-brand">Copy</span>
              <span
                class="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 group-hover:grid-cols-[1fr]"
              >
                <span class="overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span class="ml-2 max-w-40 truncate text-(--ui-text-muted) font-mono font-normal normal-case"
                    >{exportItem.content}</span
                  >
                </span>
              </span>
            </button>
            {#if exportItem.extension}
              <button
                type="button"
                onclick={() => exportCodeFile(app, exportItem.key, exportFormat)}
                class="
                                shrink-0 cursor-pointer rounded-md border
                                border-(--ui-border) px-3 py-1 text-xs font-bold
                                uppercase transition-all duration-200
                                hover:border-(--current-color)
                                hover:bg-(--current-color) hover:text-on-current
                              "
              >
                Download
              </button>
            {/if}
          </div>
          <pre
            class="
                          max-h-50 overflow-auto rounded-2xl
                          border border-(--ui-border) bg-(--ui-bg) p-4 font-mono
                          text-xs
                          md:p-6
                        "
          >{exportItem.content}</pre>
        </div>
      {/each}
    </div>
  </div>
</div>
