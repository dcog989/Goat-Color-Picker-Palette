# Goat Color - Project Guidelines

## Dev Environment

Linux CachyOS, Limine boot loader, KDE Plasma 6, Wayland, Btrfs. Firefox, Kate text editor, Zed code editor, fish shell with Ghostty + Fresh editor. paru and bun package managers. All software is updated as of today.

## Tech Stack

- **Framework:** Svelte 5 (Runes API)
- **Build:** Vite 8, TypeScript 6 (strict), Tailwind CSS v4
- **Color:** `colorjs.io` ^0.6.1 (conversion, manipulation, APCA contrast)
- **Data:** `color-name-list` ^14.37.0 (short version - 3000+ named colors)
- **UI:** `lucide-svelte` ^1.0.1, `jspdf` ^4.2.1 (PDF export)
- **Lint/Format:** Biome 2 (lefthook pre-commit hook)
- **Test:** Vitest 4 + Testing Library (jsdom)

## Scripts

| Command             | Action                          |
|---------------------|---------------------------------|
| `bun run dev`       | Start dev server                |
| `bun run build`     | Production build                |
| `bun run preview`   | Preview build                   |
| `bun run check`     | Biome lint + svelte-check + tsc |
| `bun run lint`      | Biome check only                |
| `bun run fix`       | Biome auto-fix                  |
| `bun run format`    | Biome format                    |
| `bun run test`      | Vitest                          |

## Architecture

- **State:** Svelte 5 runes (`$state`, `$derived`, `$effect`) in `src/lib/stores/` (7 stores: color, engine, image, paintbox, root, theme, toast)
- **Workers:** `src/lib/workers/` — color name search, image analysis (K-Means)
- **Color:** OKLCH primary; `colorjs.io` handles all conversions and APCA (`contrastAPCA()`) + WCAG 2.1
- **Persistence:** Paintbox saves to localStorage

## Coding Principles

- Modern Svelte 5 runes, strict TS, KISS/DRY/YAGNI
- Self-documenting code via clear naming; comments only for workarounds/complex logic
- 4-space indent, single quotes, semicolons always, trailing commas all, bracket same line
- Split files >400 lines into separate concerns
- No magic numbers
- **Do not create docs files** (README, summary, reference, etc.) unless requested

## File System Access

Root: `/home/bubba/Projects/Goat-Color-Picker-Palette/`

### Disallowed

- `.agents/`, `.archive/`, `.assets/`, `.context/`, `.docs/`, `.git/`, `.repomix/`, `.repomixignore`
- `node_modules/`, `dist/`, `build/`, `.svelte-kit/`, `bun.lock`, `repomix.*.json`

## Interaction Style

- do not pretend to understand how the user feels. no "You're right to be frustrated." etc.
- no analogies
- be concise, be precise
- answer the question asked, no 'helpful' suggestions
