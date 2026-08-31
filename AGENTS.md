# Agent Directives

## Project Specifics

- Name: goatcolor
- Description: Color picker, palette generator, image extraction, contrast checker SPA
- Tech: Svelte 5 (Runes API), Vite, TypeScript 6 (strict), Tailwind CSS v4, colordx, Biome, Vitest
  - TypeScript pinned at `6.0.3` via overrides — `svelte-check` peer deps don't allow TS 7 yet

### Key Files

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

### Workflow

| Command              | Action           |
|----------------------|------------------|
| `bun run dev`        | Start dev server |
| `bun run build`      | Production build |
| `bun run preview`    | Preview build    |
| `bun run check`      | Biome lint + Svelte-check + tsc |
| `bun run lint`       | Biome check only |
| `bun run fix`        | Biome auto-fix   |
| `bun run format`     | Biome format     |
| `bun run test`       | Vitest           |

### Common Patterns

- Add feature: Update store in `<stores-dir>`, add UI in `<components-dir>`, wire with events
- Backend call: Add command in `<backend-commands-dir>`, register in entry point, call from UI via the frontend wrapper
- State access: Import the central state from its store module
- These are examples. Follow only if they apply; otherwise state your approach before implementing.

### File System Access

- Root: `/home/bubba/Projects/Goat-Color-Picker-Palette/`
- Allowed: All subdirectories except disallowed
- Read-Only: `.env*`, `.git/`
- Disallowed: `.assets/`, `.context/`, `.docs/`, `.git/`, `.repomix/`, `.repomixignore`, `node_modules/`, `dist/`, `build/`, `.svelte-kit/`, `bun.lock`, `repomix.*.json`
- Require confirmation: adding/removing dependencies, changes outside `src/`, any operation outside project root

---

## General Guidelines

### Code Changes

- For non-trivial work, propose an approach and confirm before implementing.
- Keep modifications minimal and scoped; prefer incremental improvements over rewrites. Ask before architectural changes.
- Use explicit types and named constants (no magic numbers).
- Return explicit error types; do not suppress exceptions.
- Follow standard repository linting and formatting configs.
- Decompose files over 400 lines if they mix concerns.
- Use clear naming over comments; reserve comments for complex workarounds or non-obvious issues — why, not what.
- Never run git mutations (commit, push, reset, rebase, amend) unless explicitly instructed.
- Do not create documentation files unless explicitly requested.

### Verification

- Do not run test, lint, format, or type-check commands; the user builds, tests, and lints manually.
- Run them only when the user explicitly asks.

### Author Environment

- CachyOS, KDE Plasma 6, Wayland, Btrfs.
- fish shell, Ghostty terminal, Fresh TUI editor, yay package manager, bun npm manager, Firefox, and Zed code editor.

### Testing

- Do not create test files for trivial changes, or for behavior that is not reliably unit-testable in the test environment (e.g. UI layout/click mapping). Prefer no new files; only add a test when the logic is genuinely testable and worth guarding.

### Definition of Done

- Logic fully implemented.
- Existing docs updated if public interfaces changed.
- When required by the `Verification` rules, run the corresponding `Workflow` command.
- On completion of an update or fix, print a concise conventional commit message in a fenced code block.

### Communication Style

- Provide concise, actionable responses.
- Ask clarifying questions when requirements are ambiguous.
- Flag potential risks or edge cases proactively.
- Do not pretend to understand how the user feels.
- Never editorialise your answer. No "to be honest", "honestly", hedging, disclaimers, or meta-commentary — just answer.
