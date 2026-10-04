# Color Picker Palette

A color picker with palette, image analyser, contrast checker, and export format options. Pick colors using Okhsl (default, gamut-aware), or Oklch (wide gamut), or RGB. Copy or export to a wide range of formats.

![Color Picker Palette](/assets/screen-1.webp)

## Features

- **Perceptual Pickers:** Author in Okhsl (default, gamut-aware) or Oklch (wide gamut), with an RGB fallback.
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
- **Test:** Vitest 5

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

## License

[MIT License](LICENSE).
