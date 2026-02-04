# Goat Color

A modern, perceptually uniform color workspace built for the post-sRGB era.

## Features

- **OKLCH First:** Design with perceptual uniformity using the latest color space.
- **Palette Engine:** Generate harmonies (split-complementary, triadic) and variable scales.
- **Image Analysis:** Extract dominant and vibrant palettes using local K-Means clustering.
- **Accessibility:** Real-time APCA (Lc) and WCAG 2.1 contrast checking.
- **Smart Paintbox:** Persistent storage with multi-format export (Tailwind, CSS, SVG, PDF).
- **Library:** Search 30,000+ named colors.

![Goat Color Picker Palette](/assets/screen-1.png)

## Tech Stack

- **Framework:** Svelte 5 (Runes)
- **Styling:** Tailwind CSS v4
- **Build:** Vite
- **Math:** Culori & APCA-W3

## Development

- Install dependencies: `bun install` + `bun update`
- Start development server: `bun run dev`
- Build for production: `bun run build`
