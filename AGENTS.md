# Instructions for coding agents

This repository is a **Sunflower Land mini-game template**. Prefer **small, spec-driven** changes.

## Read first

1. `docs/ARCHITECTURE.md` — where code belongs.
2. `docs/TECHNICAL.md` — React ↔ Phaser, store, popups, audio, icons.
3. `docs/GAME_SPEC.md` — fork-specific rules (balance, win/lose, copy).

## Hard constraints (template)

- **One popup at a time** — use `popupSingleton` + `POPUP_REGISTRY` (see `src/components/popups/`).
- **Shared game state** — `src/lib/gameStore.ts` (`$gameState`); Phaser uses `$gameState.subscribe(...)`, React uses `useStore($gameState)`.
- **Private art** — sibling `images` repo, imported via `@sl-assets` (`icons.config.ts`, `resources.config.ts`, `audio.config.ts`). Default app is **Boring** (`src/examples/boring/`). **Bumpkins** use `BumpkinContainer`, not vector placeholders.
- **Portal API** — `src/lib/portal/` (`getPlayerEconomySession`, `postPlayerEconomyAction`, `getUrl` / `getJwt`). **Trade / profile stubs** — `src/lib/api.ts` (no separate `trade.ts`).
- **New UI control** — add a minimal primitive under `src/components/ui/` (match existing pixel panel style).

## Ship quality

Before claiming a feature is production-ready, align with `docs/VALIDATION.md` (manual checklist).
