<script lang="ts">
    import { getApp } from '../context';
    import { exportCode, strategies, type ExportFormat } from '../utils/export';

    interface Props {
        onClose: () => void;
    }

    let { onClose }: Props = $props();

    const app = getApp();
    const { toast } = app;

    let exportFormat = $state<ExportFormat>('oklch');

    const copy = (text: string, e?: MouseEvent) => {
        navigator.clipboard.writeText(text);
        toast.show('Copied Code to Clipboard', e);
    };

    const exports = $derived.by(() =>
        Object.entries(strategies).map(([key, strategy]) => ({
            name: strategy.name,
            content: exportCode(app, key, exportFormat),
        })),
    );
</script>

<div
    class="
      animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4
      md:p-8
    ">
    <button
        type="button"
        class="absolute inset-0 cursor-default bg-black/70 backdrop-blur-xl"
        onclick={onClose}
        aria-label="Close export dialog"></button>
    <div
        class="
          animate-scale-in relative max-h-[90vh] w-full max-w-3xl space-y-6
          overflow-y-auto rounded-3xl bg-(--ui-card) p-6 shadow-2xl
          md:space-y-8 md:p-12
        "
        role="dialog">
        <header
            class="
              sticky top-0 z-10 flex items-center justify-between bg-(--ui-card)
              pb-4
            ">
            <h2
                class="
                  text-2xl font-black tracking-widest uppercase
                  md:text-3xl
                ">
                Export Code
            </h2>
            <div
                class="
                  flex items-center gap-2
                  md:gap-4
                ">
                <select
                    bind:value={exportFormat}
                    class="
                      cursor-pointer rounded-md border border-(--ui-border)
                      bg-(--ui-bg) px-3 py-2 text-xs font-bold uppercase
                      transition-colors outline-none
                      focus:ring-2 focus:ring-(--current-color)
                      md:px-4
                    ">
                    <option value="oklch">OKLCH</option>
                    <option value="hex">HEX</option>
                    <option value="hsl">HSL</option>
                    <option value="rgb">RGB</option>
                </select>
                <button
                    onclick={onClose}
                    class="
                      cursor-pointer text-3xl opacity-50 transition-opacity
                      hover:opacity-100
                      md:text-4xl
                    "
                    aria-label="Close">
                    ×
                </button>
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
                            ">{exportItem.name}</span>
                        <button
                            onclick={(e) => copy(exportItem.content, e)}
                            class="
                              cursor-pointer rounded-sm px-3 py-1 text-xs
                              font-bold text-brand uppercase transition-colors
                              hover:bg-(--ui-bg) hover:underline
                            ">
                            Copy
                        </button>
                    </div>
                    <pre
                        class="
                          max-h-50 overflow-x-auto overflow-y-auto rounded-2xl
                          border border-(--ui-border) bg-(--ui-bg) p-4 font-mono
                          text-xs
                          md:p-6
                        ">{exportItem.content}</pre>
                </div>
            {/each}
        </div>
    </div>
</div>
