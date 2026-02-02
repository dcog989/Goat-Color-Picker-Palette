# Goat Color - Project Guidelines

## Project Overview

Goat Color is a modern, perceptually uniform color workspace built for the post-sRGB era. It's a sophisticated color picker and palette management tool that prioritizes OKLCH color space for perceptual uniformity.

## Tech Stack

- **Framework:** Svelte 5 (using Runes API)
- **Build Tool:** Vite 7.3
- **Styling:** Tailwind CSS v4
- **TypeScript:** v5.9
- **Color Libraries:**
  - `culori` v4.0 - Color manipulation and conversion
  - `apca-w3` v0.1.9 - APCA contrast calculation
  - `color-name-list` v14.17 - Named color database (30,000+ colors)
- **UI Icons:** lucide-svelte v0.562.0
- **PDF Export:** jspdf v4.0

## Key Features

1. **OKLCH-First Color Picker** - Design with perceptual uniformity
2. **Palette Engine** - Generate harmonies (split-complementary, triadic) and variable scales
3. **Image Analysis** - Extract dominant and vibrant palettes using local K-Means clustering
4. **Accessibility Tools** - Real-time APCA (Lc) and WCAG 2.1 contrast checking
5. **Smart Paintbox** - Persistent storage with multi-format export
6. **Color Library** - Search 30,000+ named colors
7. **Export Formats** - Tailwind, CSS, SVG, PDF

## Project Structure

```
src/
├── App.svelte                 # Main application component
├── main.ts                    # Application entry point
├── app.css                    # Global styles
├── ambient.d.ts               # TypeScript ambient declarations
│
├── lib/
│   ├── components/            # Reusable UI components
│   │   ├── ColorLibrary.svelte
│   │   ├── ContrastChecker.svelte
│   │   ├── PaintboxGrid.svelte
│   │   ├── Swatch.svelte
│   │   ├── Title.svelte
│   │   └── Toast.svelte
│   │
│   ├── panels/                # Main feature panels
│   │   ├── PickerPanel.svelte      # Color picker interface
│   │   ├── PalettePanel.svelte     # Palette generation
│   │   ├── ContrastPanel.svelte    # Accessibility checking
│   │   ├── ImagePanel.svelte       # Image color extraction
│   │   └── PaintboxPanel.svelte    # Color collection management
│   │
│   ├── modals/                # Modal dialogs
│   │   ├── ExportModal.svelte      # Export functionality
│   │   ├── InfoModal.svelte        # Information/help
│   │   └── SearchModal.svelte      # Color name search
│   │
│   ├── layout/
│   │   └── Header.svelte           # Application header
│   │
│   ├── stores/                # Svelte 5 state stores (using runes)
│   │   ├── color.svelte.ts         # Current color state
│   │   ├── engine.svelte.ts        # Palette generation engine
│   │   ├── image.svelte.ts         # Image analysis state
│   │   ├── paintbox.svelte.ts      # Saved colors collection
│   │   ├── root.svelte.ts          # Root application state
│   │   ├── theme.svelte.ts         # Theme management
│   │   └── toast.svelte.ts         # Toast notifications
│   │
│   ├── utils/                 # Utility functions
│   │   ├── export.ts              # Export format generators
│   │   ├── format.ts              # Color formatting utilities
│   │   └── harmonies.ts           # Color harmony calculations
│   │
│   ├── workers/               # Web Workers
│   │   ├── color-analysis.ts      # K-Means clustering for images
│   │   └── color-name-search.ts   # Color name lookup
│   │
│   ├── data/
│   │   └── colors.ts              # Color data/constants
│   │
│   ├── constants.ts           # Application constants
│   └── context.ts             # Svelte context utilities
```

## Development Commands

- `bun install` - Install dependencies
- `bun update` - Update dependencies
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run check` - Run type checking

## Architecture Notes

### State Management

- Uses Svelte 5's Runes API (`$state`, `$derived`, `$effect`)
- State organized in separate store files under `lib/stores/`
- Each store manages a specific domain (colors, palettes, images, etc.)

### Color Processing

- Primary color space: OKLCH (perceptually uniform)
- Supports conversion between multiple color spaces via Culori
- Web Workers handle computationally intensive tasks (image analysis, search)

### Accessibility

- Implements APCA (Accessible Perceptual Contrast Algorithm)
- Also supports WCAG 2.1 contrast ratios
- Real-time contrast checking against background colors

### Data Persistence

- Paintbox (saved colors) persists to localStorage
- Export functionality generates multiple format outputs

## Key Dependencies Explained

- **culori** - Comprehensive color library supporting multiple color spaces and conversions
- **apca-w3** - Modern contrast algorithm more accurate than WCAG 2.1
- **color-name-list** - Database of named colors with metadata
- **lucide-svelte** - Icon library with Svelte components
- **jspdf** - PDF generation for color palette exports

## Development Notes

This project leverages modern web APIs and the latest Svelte features. Key considerations:

1. **Svelte 5 Runes** - Uses the new reactivity system instead of stores
2. **Tailwind v4** - Latest version with Vite plugin
3. **Web Workers** - Offloads heavy computation to prevent UI blocking
4. **OKLCH Color Space** - Modern, perceptually uniform alternative to HSL/RGB

## Future Enhancement Ideas

- [ ] Color blindness simulation modes
- [ ] Additional harmony algorithms
- [ ] Gradient generator
- [ ] Color palette sharing/import
- [ ] Browser extension version
- [ ] Mobile app version
