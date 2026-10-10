<script lang="ts">
import Keyboard from "@lucide/svelte/icons/keyboard";
import { onDestroy } from "svelte";
import { version } from "../package.json";
import Toast from "./lib/components/Toast.svelte";
import { setApp } from "./lib/context";
import Header from "./lib/layout/Header.svelte";
import ExportModal from "./lib/modals/ExportModal.svelte";
import InfoModal from "./lib/modals/InfoModal.svelte";
import SearchModal from "./lib/modals/SearchModal.svelte";
import ColorPickerPanel from "./lib/panels/ColorPickerPanel.svelte";
import ContrastPanel from "./lib/panels/ContrastPanel.svelte";
import ImagePanel from "./lib/panels/ImagePanel.svelte";
import PaintboxPanel from "./lib/panels/PaintboxPanel.svelte";
import PalettePanel from "./lib/panels/PalettePanel.svelte";
import { RootStore } from "./lib/stores/root.svelte";
import { usesDarkText } from "./lib/utils/text-contrast";

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

// URL hash color sync — load color from hash, mirror current color to hash.
// sessionStorage persists across reloads (same tab) but not new tabs, so an
// F5 refresh gets a fresh random color while opening a shared link still loads it.
const URL_COLOR_KEY = "color-picker-palette:url-color";

const applyHashColor = () => {
  const stored = sessionStorage.getItem(URL_COLOR_KEY);
  const hash = location.hash;
  if (hash && hash !== stored) {
    color.set(hash);
    sessionStorage.setItem(URL_COLOR_KEY, hash);
  } else {
    sessionStorage.removeItem(URL_COLOR_KEY);
  }
};
applyHashColor();

$effect(() => {
  const hash = color.hexa;
  if (location.hash !== hash) {
    history.replaceState(null, "", hash);
    sessionStorage.setItem(URL_COLOR_KEY, hash);
  }
});

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
  const c = color.c;

  // Cancel pending update
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }

  // Batch DOM writes in next frame
  rafId = requestAnimationFrame(() => {
    const root = document.documentElement;

    // Batch all style changes together to minimize reflows
    root.style.setProperty("--current-color", cssVar);
    root.style.setProperty("--current-ui-chroma-scale", String(Math.min(1, c / 0.06)));
    if (c > 0.001) {
      root.style.setProperty("--current-hue", hStr);
      prevHue = color.h;
      root.removeAttribute("data-achromatic");
    } else {
      root.style.setProperty("--current-hue", prevHue.toString());
      root.setAttribute("data-achromatic", "");
    }

    // Set data attribute for contrast-dependent styling
    const needsDarkText = usesDarkText(cssVar);
    root.setAttribute("data-color-contrast", needsDarkText ? "dark" : "light");

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
    title: "Why the Colors Look Right",
    content: `<div class="space-y-4"><p>Most color pickers use a system called HSL. It is simple, but it doesn't match how our eyes work — at the same "brightness" setting, yellow looks much brighter than blue. This app uses two newer systems that behave the way we actually see color.</p><ul class="list-disc pl-5 space-y-2"><li><strong>OKHSL (the default):</strong> works like the familiar hue, saturation and lightness sliders, but every step looks even. Saturation stops at the brightest your screen can show, so the sliders never slide into dull or broken colors.</li><li><strong>OKLCH:</strong> the same idea, but it swaps saturation for <strong>chroma</strong> — how strong the color is. It gives you finer control and can describe very vivid colors.</li><li><strong>Even brightness:</strong> 50% looks equally bright for every color, so palettes and gradients stay smooth instead of turning muddy in the middle.</li></ul></div>`,
  },
  analysis: {
    title: "How Image Analysis Works",
    content: `<div class="space-y-4"><p>This tool looks at the colors in your picture and picks out a short, useful set that represents it.</p><ol class="list-decimal pl-5 space-y-2"><li><strong>Shrinking:</strong> the image is scaled down so it can be read quickly.</li><li><strong>Grouping:</strong> similar pixels are gathered together so near-identical shades don't count twice.</li><li><strong>Choosing:</strong> the tool finds the color that best stands for each group.</li><li><strong>Ordering:</strong> the results are sorted by how common they are, how vivid they are, or how light or dark they are.</li></ol><p class="opacity-70 mt-4">Everything happens on your own device — your images are never uploaded anywhere.</p></div>`,
  },
  contrast: {
    title: "Checking Readability",
    content: `<div class="space-y-4"><p>Good design means text stays easy to read against its background. Two well-known methods are used to check that.</p><ul class="list-disc pl-5 space-y-2"><li><strong>WCAG (AA and AAA):</strong> the long-standing standard. It gives a simple ratio (for example 4.5:1). It is dependable, though it doesn't always match how readable text looks to a person — it can flag something as unreadable that is actually fine, or the other way around.</li><li><strong>APCA:</strong> a newer method, and a candidate for the next version of the standard. It takes into account how bold or big the text is, and which is darker — the text or the background. Its score tends to line up better with what people can actually read.</li></ul></div>`,
  },
  shortcuts: {
    title: "Keyboard Shortcuts",
    content: `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-4 bg-(--ui-bg) rounded-xl border border-(--ui-border) flex justify-between items-center"><span class="section-heading">Search</span><span class="font-mono font-bold bg-(--ui-card) px-2 py-1 rounded text-sm">⌘ + K</span></div>
                <div class="p-4 bg-(--ui-bg) rounded-xl border border-(--ui-border) flex justify-between items-center"><span class="section-heading">Save Color</span><span class="font-mono font-bold bg-(--ui-card) px-2 py-1 rounded text-sm">⌘ + S</span></div>
                <div class="p-4 bg-(--ui-bg) rounded-xl border border-(--ui-border) flex justify-between items-center"><span class="section-heading">Randomize</span><span class="font-mono font-bold bg-(--ui-card) px-2 py-1 rounded text-sm">⌘ + R</span></div>
                <div class="p-4 bg-(--ui-bg) rounded-xl border border-(--ui-border) flex justify-between items-center"><span class="section-heading">Close Modal</span><span class="font-mono font-bold bg-(--ui-card) px-2 py-1 rounded text-sm">Esc</span></div>
            </div>`,
  },
};

const showInfo = (key: keyof typeof infoContent) => {
  activeInfo = infoContent[key];
};
</script>

<svelte:window onkeydown={handleKeyboard} onhashchange={applyHashColor} />

<div
  class="
      flex min-h-screen flex-col pb-20 font-sans antialiased transition-colors
      duration-500
    "
>
  <Header onSearch={() => (showSearch = true)} />

  <main
    class="
          grid w-full flex-1 grid-cols-1 content-start gap-4 p-4
          sm:gap-6 sm:p-6
          md:gap-8 md:p-8
          min-[1920px]:grid-cols-[1fr_500px_500px] min-[1920px]:grid-rows-[auto_auto]
          min-[1920px]:px-16
        "
  >
    <div class="min-h-0 min-w-64 w-full max-h-[48rem] min-[1920px]:col-start-1 min-[1920px]:row-start-1">
      <ColorPickerPanel />
    </div>

    <div
      class="min-h-0 flex flex-col gap-4 items-center justify-center sm:gap-6 md:flex-row md:items-stretch md:gap-8 min-[1920px]:col-start-2 min-[1920px]:col-span-2 min-[1920px]:row-start-1"
    >
      <div class="min-h-0 min-w-0 w-full max-w-[500px] max-h-[48rem]">
        <PalettePanel />
      </div>

      <div class="min-h-0 min-w-0 w-full max-w-[500px] max-h-[48rem]">
        <PaintboxPanel onExport={() => (showExport = true)} />
      </div>
    </div>

    <div
      class="min-h-0 flex flex-col gap-4 items-center justify-center sm:gap-6 md:gap-8 md:flex-row md:items-stretch min-[1920px]:col-span-full min-[1920px]:row-start-2"
    >
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
        "
  >
    <div
      class="
              flex flex-wrap gap-6 text-sm font-bold tracking-widest uppercase
            "
    >
      <button onclick={() => showInfo("oklch")} type="button" class="footer-link">Why Okhsl + Oklch?</button>
      <span class="footer-divider">|</span>
      <button onclick={() => showInfo("analysis")} type="button" class="footer-link">Image Analysis?</button>
      <span class="footer-divider">|</span>
      <button onclick={() => showInfo("contrast")} type="button" class="footer-link">Good Contrast?</button>
      <span class="footer-divider">|</span>
      <a href="https://github.com/dcog989/Color-Picker-Palette" class="footer-link">Github</a>
      <span class="footer-divider">|</span>
      <span class="opacity-30">v{version}</span>
    </div>

    <button
      onclick={() => showInfo("shortcuts")}
      type="button"
      class="
              rounded-lg p-2 transition-colors
              hover:bg-black/10 dark:hover:bg-white/10
            "
      aria-label="Keyboard Shortcuts"
    >
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
    <InfoModal title={activeInfo.title} content={activeInfo.content} onClose={() => (activeInfo = null)} />
  {/if}

  <Toast />
</div>
