<script lang="ts">
import { Keyboard } from 'lucide-svelte';
import { onDestroy } from 'svelte';
import { version } from '../package.json';
import Toast from './lib/components/Toast.svelte';
import { setApp } from './lib/context';
import Header from './lib/layout/Header.svelte';
import ExportModal from './lib/modals/ExportModal.svelte';
import InfoModal from './lib/modals/InfoModal.svelte';
import SearchModal from './lib/modals/SearchModal.svelte';
import ColorPickerPanel from './lib/panels/ColorPickerPanel.svelte';
import ContrastPanel from './lib/panels/ContrastPanel.svelte';
import ImagePanel from './lib/panels/ImagePanel.svelte';
import PaintboxPanel from './lib/panels/PaintboxPanel.svelte';
import PalettePanel from './lib/panels/PalettePanel.svelte';
import { RootStore } from './lib/stores/root.svelte';

// Create Root Store
const app = new RootStore();

// Provide to Context
setApp(app);

// Initial stores access for root logic
const { color, paintbox, toast } = app;

let showExport = $state(false);
let showSearch = $state(false);
let activeInfo = $state<{ title: string; content: string } | null>(null);

// Initialize logic
app.init();

// Cleanup
onDestroy(() => {
    app.destroy();
});

// Achromatic hue fix — preserve previous hue for near-neutral colors
let prevHue = 0;

// Global CSS variable sync with optimized batching
let rafId: number | null = null;
$effect(() => {
    // Read reactive values
    const cssVar = color.cssVar;
    const hStr = color.h.toString();
    const l = color.l;
    const c = color.c;

    // Cancel pending update
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
    }

    // Batch DOM writes in next frame
    rafId = requestAnimationFrame(() => {
        const root = document.documentElement;
        const body = document.body;

        // Batch all style changes together to minimize reflows
        root.style.setProperty('--current-color', cssVar);
        if (c > 0.001) {
            root.style.setProperty('--current-hue', hStr);
            prevHue = color.h;
            root.removeAttribute('data-achromatic');
        } else {
            root.style.setProperty('--current-hue', prevHue.toString());
            root.setAttribute('data-achromatic', '');
        }
        body.style.backgroundColor = cssVar;

        // Set data attribute for contrast-dependent styling
        const needsDarkText = l > 0.55;
        root.setAttribute('data-color-contrast', needsDarkText ? 'dark' : 'light');

        rafId = null;
    });

    // Cleanup on effect re-run
    return () => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
        }
    };
});

const handleKeyboard = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        showSearch = true;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        paintbox.add(color.hexa);
        toast.show('Added to Paintbox');
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        color.randomize();
    }
    if (e.key === 'Escape') {
        showSearch = false;
        showExport = false;
        activeInfo = null;
    }
};

const infoContent = {
    oklch: {
        title: 'Why OKLCH?',
        content: `<div class="space-y-4"><p>OKLCH is a modern color space designed for how humans actually perceive color. Unlike HSL or RGB, where changing Hue might drastically change the perceived lightness (blue looks darker than yellow at the same 'lightness' value), OKLCH is <strong>perceptually uniform</strong>.</p><ul class="list-disc pl-5 space-y-2"><li><strong>Predictable Lightness:</strong> 50% lightness means the same visual brightness for every hue.</li><li><strong>Wide Gamut:</strong> It supports P3 and Rec.2020 colors that sRGB/Hex cannot display.</li><li><strong>Better Gradients:</strong> Interpolating colors in OKLCH produces smooth, natural transitions without 'gray dead zones'.</li></ul></div>`,
    },
    analysis: {
        title: 'Image Analysis',
        content: `<div class="space-y-4"><p>This tool uses a <strong>K-Means Clustering</strong> algorithm running in a background Web Worker to extract a representative palette from your images.</p><ol class="list-decimal pl-5 space-y-2"><li><strong>Downsampling:</strong> The image is scaled internally to ~65k pixels for performance.</li><li><strong>Quantization:</strong> Pixels are grouped into 4096 bins to reduce noise.</li><li><strong>Clustering:</strong> The algorithm iteratively finds the geometric centers of color density.</li><li><strong>Sorting:</strong> Colors are ranked by dominance, vibrancy, or luminance.</li></ol><p class="text-xs opacity-70 mt-4">All processing happens locally on your device—no images are uploaded to any server.</p></div>`,
    },
    contrast: {
        title: 'Accessibility Standards',
        content: `<div class="space-y-4"><p>We provide two standards for accessibility checking:</p><ul class="list-disc pl-5 space-y-2"><li><strong>WCAG 2.1 (AA/AAA):</strong> The current industry standard. It uses a simple mathematical ratio (e.g. 4.5:1). It is reliable but doesn't always match human perception, sometimes flagging readable pairs as fails or vice versa.</li><li><strong>APCA:</strong> The Advanced Perceptual Contrast Algorithm (WCAG 3.0 candidate). It accounts for font weight, size, and <strong>polarity</strong> (dark-on-light is easier to read than light-on-dark). It provides a more accurate score (Lc) for readability.</li></ul></div>`,
    },
    shortcuts: {
        title: 'Keyboard Shortcuts',
        content: `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-4 bg-[var(--ui-bg)] rounded-xl border border-[var(--ui-border)] flex justify-between items-center"><span class="font-black text-xs uppercase opacity-50">Search</span><span class="font-mono font-bold bg-[var(--ui-card)] px-2 py-1 rounded text-sm">⌘ + K</span></div>
                <div class="p-4 bg-[var(--ui-bg)] rounded-xl border border-[var(--ui-border)] flex justify-between items-center"><span class="font-black text-xs uppercase opacity-50">Save Color</span><span class="font-mono font-bold bg-[var(--ui-card)] px-2 py-1 rounded text-sm">⌘ + S</span></div>
                <div class="p-4 bg-[var(--ui-bg)] rounded-xl border border-[var(--ui-border)] flex justify-between items-center"><span class="font-black text-xs uppercase opacity-50">Randomize</span><span class="font-mono font-bold bg-[var(--ui-card)] px-2 py-1 rounded text-sm">⌘ + R</span></div>
                <div class="p-4 bg-[var(--ui-bg)] rounded-xl border border-[var(--ui-border)] flex justify-between items-center"><span class="font-black text-xs uppercase opacity-50">Close Modal</span><span class="font-mono font-bold bg-[var(--ui-card)] px-2 py-1 rounded text-sm">Esc</span></div>
            </div>`,
    },
};

const showInfo = (key: keyof typeof infoContent) => {
    activeInfo = infoContent[key];
};
</script>

<svelte:window onkeydown={handleKeyboard} />

<div
    class="
      flex min-h-screen flex-col pb-20 font-sans antialiased transition-colors
      duration-500
    ">
    <Header onSearch={() => (showSearch = true)} />

    <main
        class="
          main-grid grid w-full flex-1 grid-cols-1 gap-4 p-4
          sm:gap-6 sm:p-6
          md:gap-8 md:p-8
          min-[1920px]:px-16
        ">
        <div class="picker min-h-0 min-w-64 w-full max-h-[48rem]">
            <ColorPickerPanel />
        </div>

        <div class="mid-group min-h-0 flex flex-col gap-4 items-center justify-center sm:gap-6 md:flex-row md:items-stretch md:gap-8">
            <div class="min-h-0 min-w-0 w-full max-w-[500px] max-h-[48rem]">
                <PalettePanel />
            </div>

            <div class="min-h-0 min-w-0 w-full max-w-[500px] max-h-[48rem]">
                <PaintboxPanel onExport={() => (showExport = true)} />
            </div>
        </div>

        <div class="full-row min-h-0 flex flex-col gap-4 items-center justify-center sm:gap-6 md:gap-8 md:flex-row md:items-stretch">
            <div class="min-h-0 min-w-0 w-full max-w-2xl max-h-[42.5rem] flex-1">
                <ImagePanel />
            </div>

            <div class="min-h-0 min-w-0 w-full max-w-2xl max-h-[42.5rem] flex-1">
                <ContrastPanel />
            </div>
        </div>
    </main>

    <footer
        class="
          text-on-current mx-auto flex w-full flex-wrap items-center
          justify-between gap-4 px-4 py-6 opacity-80 transition-opacity
          hover:opacity-100
          sm:px-8
        ">
        <div
            class="
              flex flex-wrap gap-6 text-sm font-bold tracking-widest uppercase
            ">
            <button
                onclick={() => showInfo('oklch')}
                class="
                  cursor-pointer
                  hover:underline
                ">Why OKLCH?</button>
            <span
                class="
                  hidden opacity-30
                  sm:inline
                ">|</span>
            <button
                onclick={() => showInfo('analysis')}
                class="
                  cursor-pointer
                  hover:underline
                ">Image Analysis?</button>
            <span
                class="
                  hidden opacity-30
                  sm:inline
                ">|</span>
            <button
                onclick={() => showInfo('contrast')}
                class="
                  cursor-pointer
                  hover:underline
                ">Good Contrast?</button>
            <span
                class="
                  hidden opacity-30
                  sm:inline
                ">|</span>
            <a href="https://github.com/dcog989/Goat-Color-Picker-Palette">Github</a>
            <span
                class="
                  hidden opacity-30
                  sm:inline
                ">|</span>
            <span class="opacity-30">v{version}</span>
        </div>

        <button
            onclick={() => showInfo('shortcuts')}
            class="
              rounded-lg p-2 transition-colors
              hover:bg-black/10
            "
            aria-label="Keyboard Shortcuts">
            <Keyboard class="size-5" />
        </button>
    </footer>

    {#if showSearch}
        <SearchModal onClose={() => (showSearch = false)} />
    {/if}

    {#if showExport}
        <ExportModal onClose={() => (showExport = false)} />
    {/if}

    {#if activeInfo}
        <InfoModal
            title={activeInfo.title}
            content={activeInfo.content}
            onClose={() => (activeInfo = null)} />
    {/if}

    <Toast />
</div>
