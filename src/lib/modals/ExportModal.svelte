<script lang="ts">
    import { getApp } from '../context';
    import { availableStrategies, exportCode, type ExportFormat } from '../utils/export';

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
        availableStrategies.map((strategy) => ({
            name: strategy.name,
            content: exportCode(app, strategy.key, exportFormat),
        })),
    );
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in">
    <button
        type="button"
        class="absolute inset-0 bg-black/70 backdrop-blur-xl cursor-default"
        onclick={onClose}
        aria-label="Close export dialog"></button>
    <div
        class="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--ui-card)] p-6 md:p-12 shadow-2xl space-y-6 md:space-y-8 relative animate-scale-in rounded-3xl"
        role="dialog">
        <header
            class="flex justify-between items-center sticky top-0 bg-[var(--ui-card)] z-10 pb-4">
            <h2 class="text-2xl md:text-3xl font-black uppercase tracking-widest">Export Code</h2>
            <div class="flex items-center gap-2 md:gap-4">
                <select
                    bind:value={exportFormat}
                    class="bg-[var(--ui-bg)] border border-[var(--ui-border)] px-3 md:px-4 py-2 text-xs font-bold uppercase outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-[var(--current-color)] rounded-md">
                    <option value="oklch">OKLCH</option>
                    <option value="hex">HEX</option>
                    <option value="hsl">HSL</option>
                    <option value="rgb">RGB</option>
                </select>
                <button
                    onclick={onClose}
                    class="text-3xl md:text-4xl opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Close">
                    ×
                </button>
            </div>
        </header>
        <div class="space-y-6">
            {#each exports as exportItem (exportItem.name)}
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-bold uppercase tracking-wider opacity-50"
                            >{exportItem.name}</span>
                        <button
                            onclick={(e) => copy(exportItem.content, e)}
                            class="text-xs font-bold uppercase text-brand hover:underline cursor-pointer transition-colors px-3 py-1 hover:bg-[var(--ui-bg)] rounded-sm">
                            Copy
                        </button>
                    </div>
                    <pre
                        class="p-4 md:p-6 bg-[var(--ui-bg)] overflow-x-auto text-xs font-mono border border-[var(--ui-border)] max-h-[200px] overflow-y-auto rounded-2xl">{exportItem.content}</pre>
                </div>
            {/each}
        </div>
    </div>
</div>
