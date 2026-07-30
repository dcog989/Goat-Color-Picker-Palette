# Agent Directives

## Project Context

- Name: goatcolor
- Description: Color picker, palette generator, image extraction, contrast checker SPA
- Tech: Svelte 5 (Runes API), Vite, TypeScript 6 (strict), Tailwind CSS v4, colordx, Biome 2, Vitest 4

## Key Files

- `src/main.ts` — entry point
- `src/lib/stores/root.svelte.ts` — root state
- `src/lib/stores/color.svelte.ts` — color state
- `src/lib/stores/engine.svelte.ts` — engine state
- `src/lib/stores/image.svelte.ts` — image state
- `src/lib/stores/paintbox.svelte.ts` — paintbox state (persisted to localStorage)
- `src/lib/stores/theme.svelte.ts` — theme state
- `src/lib/stores/toast.svelte.ts` — toast state
- `src/lib/workers/color-analysis.ts` — image analysis worker (K-Means)
- `src/lib/workers/color-name-search.ts` — color name search worker
- `src/lib/utils/format.test.ts` — tests

---

## Development Workflow

| Command | Action |
|---------|--------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run preview` | Preview build |
| `bun run check` | Biome lint + svelte-check + tsc |
| `bun run lint` | Biome check only |
| `bun run fix` | Biome auto-fix |
| `bun run format` | Biome format |
| `bun run test` | Vitest |

## File System Access

- Root: `/home/bubba/Projects/Goat-Color-Picker-Palette/`
- Allowed: All subdirectories except disallowed
- Read-Only: `.env*`, `.git/`
- Disallowed: `.assets/`, `.context/`, `.docs/`, `.git/`, `.repomix/`, `.repomixignore`, `node_modules/`, `dist/`, `build/`, `.svelte-kit/`, `bun.lock`, `repomix.*.json`
- Require confirmation: adding/removing dependencies, changes outside `src/`, any operation outside project root

## Rules

- Keep modifications minimal and scoped. Ask before architectural changes.
- Do not delete files or make destructive changes without confirmation.
- Do not create documentation files (README, summary, reference, etc.) unless explicitly requested.
- Prefer incremental improvements over rewrites.
- Use explicit types and named constants (no magic numbers).
- Return explicit error types; do not suppress exceptions.
- Follow standard repository linting and formatting configs (Biome — 4-space indent, single quotes, semicolons always, trailing commas all, bracket same line, 120 line width).
- Decompose files over 500 lines if they mix concerns.
- Never run git mutations (commit, push, reset, rebase, amend) unless explicitly asked.
- Self-documenting code via clear naming. Use comments only for complex workarounds or issues that need noting.
- Modern Svelte 5 Runes API (`$state`, `$derived`, `$effect`), KISS/DRY/YAGNI.

## Communication Style

- Provide concise, precise, actionable responses.
- Do not pretend to understand how the user feels. Do not pretend to be human.
- No analogies.
- Answer the question asked, no unsolicited suggestions.
- Flag potential risks or edge cases proactively.

## Definition of Done

- Logic fully implemented.
- `bun run check` and `bun run test` pass with zero errors.
- New/modified features have tests.
- Existing docs updated if public interfaces changed.
