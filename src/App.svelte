<script lang="ts">
    import { Keyboard } from "lucide-svelte";
    import { onDestroy } from "svelte";
    import Toast from "./lib/components/Toast.svelte";
    import { setApp } from "./lib/context";
    import Header from "./lib/layout/Header.svelte";
    import ExportModal from "./lib/modals/ExportModal.svelte";
    import InfoModal from "./lib/modals/InfoModal.svelte";
    import SearchModal from "./lib/modals/SearchModal.svelte";
    import ContrastPanel from "./lib/panels/ContrastPanel.svelte";
    import ImagePanel from "./lib/panels/ImagePanel.svelte";
    import PaintboxPanel from "./lib/panels/PaintboxPanel.svelte";
    import PalettePanel from "./lib/panels/PalettePanel.svelte";
    import PickerPanel from "./lib/panels/PickerPanel.svelte";
    import { RootStore } from "./lib/stores/root.svelte";

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

    // Global CSS variable sync
    $effect(() => {
        document.documentElement.style.setProperty("--current-color", color.cssVar);
        document.documentElement.style.setProperty("--current-hue", color.h.toString());
        document.body.style.backgroundColor = color.cssVar;

        // Set data attribute for contrast-dependent styling
        // Use threshold at L=0.55 for optimal readability
        const needsDarkText = color.l > 0.55;
        document.documentElement.setAttribute("data-color-contrast", needsDarkText ? "dark" : "light");
    });

    // Set initial CSS (prevents FOUC in SPA)
    if (typeof document !== "undefined") {
        document.documentElement.style.setProperty("--current-color", color.cssVar);
        document.documentElement.style.setProperty("--current-hue", color.h.toString());
        document.body.style.backgroundColor = color.cssVar;
        const needsDarkText = color.l > 0.55;
        document.documentElement.setAttribute("data-color-contrast", needsDarkText ? "dark" : "light");
    }

    const handleKeyboard = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
            e.preventDefault();
            showSearch = true;
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "s") {
            e.preventDefault();
            paintbox.add(color.hexa);
            toast.show("Added to Paintbox");
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "r") {
            e.preventDefault();
            color.randomize();
        }
        if (e.key === "Escape") {
            showSearch = false;
            showExport = false;
            activeInfo = null;
        }
    };

    const infoContent = {
        oklch: {
            title: "Why OKLCH?",
            content: `<div class="space-y-4"><p>OKLCH is a modern color space designed for how humans actually perceive color. Unlike HSL or RGB, where changing Hue might drastically change the perceived lightness (blue looks darker than yellow at the same 'lightness' value), OKLCH is <strong>perceptually uniform</strong>.</p><ul class="list-disc pl-5 space-y-2"><li><strong>Predictable Lightness:</strong> 50% lightness means the same visual brightness for every hue.</li><li><strong>Wide Gamut:</strong> It supports P3 and Rec.2020 colors that sRGB/Hex cannot display.</li><li><strong>Better Gradients:</strong> Interpolating colors in OKLCH produces smooth, natural transitions without 'gray dead zones'.</li></ul></div>`,
        },
        analysis: {
            title: "Image Analysis",
            content: `<div class="space-y-4"><p>This tool uses a <strong>K-Means Clustering</strong> algorithm running in a background Web Worker to extract a representative palette from your images.</p><ol class="list-decimal pl-5 space-y-2"><li><strong>Downsampling:</strong> The image is scaled internally to ~65k pixels for performance.</li><li><strong>Quantization:</strong> Pixels are grouped into 4096 bins to reduce noise.</li><li><strong>Clustering:</strong> The algorithm iteratively finds the geometric centers of color density.</li><li><strong>Sorting:</strong> Colors are ranked by dominance, vibrancy, or luminance.</li></ol><p class="text-xs opacity-70 mt-4">All processing happens locally on your device—no images are uploaded to any server.</p></div>`,
        },
        contrast: {
            title: "Accessibility Standards",
            content: `<div class="space-y-4"><p>We provide two standards for accessibility checking:</p><ul class="list-disc pl-5 space-y-2"><li><strong>WCAG 2.1 (AA/AAA):</strong> The current industry standard. It uses a simple mathematical ratio (e.g. 4.5:1). It is reliable but doesn't always match human perception, sometimes flagging readable pairs as fails or vice versa.</li><li><strong>APCA:</strong> The Advanced Perceptual Contrast Algorithm (WCAG 3.0 candidate). It accounts for font weight, size, and <strong>polarity</strong> (dark-on-light is easier to read than light-on-dark). It provides a more accurate score (Lc) for readability.</li></ul></div>`,
        },
        shortcuts: {
            title: "Keyboard Shortcuts",
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

<div class="min-h-screen transition-colors duration-500 font-sans antialiased pb-20 flex flex-col">
    <Header onSearch={() => (showSearch = true)} />

    <main class="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 w-full flex-1">
        <div class="lg:col-span-2">
            <PickerPanel />
        </div>

        <PalettePanel />
        <PaintboxPanel onExport={() => (showExport = true)} />

        <ImagePanel />
        <ContrastPanel />
    </main>

    <footer class="max-w-7xl mx-auto px-8 py-6 w-full flex flex-wrap justify-between items-center gap-4 text-on-current opacity-80 hover:opacity-100 transition-opacity">
        <div class="flex flex-wrap gap-6 text-sm font-bold uppercase tracking-widest">
            <button onclick={() => showInfo("oklch")} class="hover:underline cursor-pointer">Why OKLCH?</button>
            <span class="opacity-30 hidden sm:inline">|</span>
            <button onclick={() => showInfo("analysis")} class="hover:underline cursor-pointer">Image Analysis?</button>
            <span class="opacity-30 hidden sm:inline">|</span>
            <button onclick={() => showInfo("contrast")} class="hover:underline cursor-pointer">Good Contrast?</button>
        </div>

        <button onclick={() => showInfo("shortcuts")} class="p-2 rounded-lg hover:bg-black/10 transition-colors" aria-label="Keyboard Shortcuts">
            <Keyboard class="w-5 h-5" />
        </button>
    </footer>

    {#if showSearch}
        <SearchModal onClose={() => (showSearch = false)} />
    {/if}

    {#if showExport}
        <ExportModal onClose={() => (showExport = false)} />
    {/if}

    {#if activeInfo}
        <InfoModal title={activeInfo.title} content={activeInfo.content} onClose={() => (activeInfo = null)} />
    {/if}

    <Toast />
</div>
