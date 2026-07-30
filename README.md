# Goat Color Picker Palette

A color picker with palette, image analyser, and export format options. Utilises various color formats for input or output.

If you find a better color picker, let us know.

![Goat Color Picker Palette](/assets/screen-1.png)

## Features

- **OKLCH First:** Design with perceptual uniformity using the latest color space.
- **Palette Engine:** Generate harmonies (split-complementary, triadic) and variable scales.
- **Image Analysis:** Extract dominant and vibrant palettes using local K-Means clustering.
- **Accessibility:** Real-time APCA (Lc) and WCAG 2.1 contrast checking.
- **Smart Paintbox:** Persistent storage with multi-format export (Tailwind, CSS, SVG, PDF).
- **Library:** Search 30,000+ named colors.

## Tech Stack

- **Framework:** Svelte 5 (Runes)
- **Language:** TypeScript 6 (strict)
- **Styling:** Tailwind CSS v4
- **Build:** Vite
- **Color:** colordx
- **Lint/Format:** Biome 2
- **Test:** Vitest 4

## Development

| Command | Action |
|---------|--------|
| `bun install` | Install dependencies |
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run preview` | Preview build |
| `bun run check` | Biome lint + typecheck |
| `bun run lint` | Biome check only |
| `bun run fix` | Biome auto-fix |
| `bun run format` | Biome format |
| `bun run test` | Run tests |
