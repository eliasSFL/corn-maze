# TECHNICAL.md

> **Audience:** Developers and agents implementing features.  
> **Focus:** How pieces connect — React, Phaser, store, popups, API — not folder taxonomy (see `ARCHITECTURE.md`).

## Agent summary

- **React** owns HUD, modals, win/lose, loading, rules, and **anonymous nudges**.
- **Phaser** owns simulation and rendering; **minimal** in-world UI (e.g. small meters) only when necessary.
- **State:** one **Nanostores** atom (`$gameState` in `src/lib/gameStore.ts`). **React** uses `@nanostores/react`; **Phaser** may **`import` and `subscribe`** to the same store — no indirection required for template simplicity.
- **Popups:** imperative API via **`popupSingleton`** (`src/lib/popupSingleton.ts`), bound once inside **`PopupProvider`**. **One popup at a time.** Phaser can call `popupSingleton.open("welcome")` after import; React uses the same API or context.
- **API:** `src/lib/api.ts` stubs; hydrate store after `loadPlayerProfile()`.

## Stack reference

| Layer | Package / file |
|-------|----------------|
| UI | React 19, Tailwind, `src/components/ui/*` |
| Routing | `react-router-dom` (default: Boring in `src/examples/boring/BoringApp.tsx`) |
| Game canvas | Phaser 3, `src/game/*`, `src/components/PhaserGame.tsx`, example scenes under `src/examples/*` |
| Global state | `nanostores`, `src/lib/gameStore.ts` |
| Popups | `PopupProvider`, `popupSingleton`, `src/lib/popups.ts`, `src/components/popups/*` |
| Audio | `howler`, `src/lib/audio.ts`, `src/config/audio.config.ts` |
| Icons | URL config only, `src/config/icons.config.ts`, `src/components/ui/Icon.tsx` |
| Backend (stub) | `src/lib/api.ts` |
| Portal / player economy | `src/lib/portal/` (`getPlayerEconomySession`, `postPlayerEconomyAction`) |

## Phaser × React boundaries

### DO in React

- Loading overlay, welcome, rules, win/lose, shop shells, settings.
- Anything that needs rich layout, forms, or many labels (see `UI_UX_GUIDELINES.md`).

### DO in Phaser

- World movement, collisions, timers tied to simulation, spawning entities.
- Optional tiny HUD elements that must stick to world space (use sparingly).

### Sync pattern

1. **Initial load:** `App` calls `loadPlayerProfile()` → `hydrateGameState(profile)` (or equivalent).
2. **Ongoing play:** gameplay code updates `$gameState` (e.g. coins); React re-renders via `useStore($gameState)`.
3. **Phaser reactions:** `MainScene` (or containers) **`$gameState.subscribe(handler)`** (Nanostores); unsubscribe on **`shutdown`**. Use handlers for difficulty, pausing, or audio — template includes a no-op subscription as a pattern.

## Popups (implementation)

1. **Registry:** Add an id to `PopupId` in `src/lib/popups.ts` and map it in `src/components/popups/popupRegistry.tsx`.
2. **Content:** New component under `src/components/popups/`; receives `onClose` and optional `payload`.
3. **Open from React:** `popupSingleton.open("welcome")` or `usePopup()` if you add a thin hook.
4. **Open from Phaser:** `import { popupSingleton } from "lib/popupSingleton"` then `popupSingleton.open("hint", { message: "..." })` — ensure payload type matches.
5. **Close:** `popupSingleton.close()` or a `Button` in the popup that calls `onClose`.

**Constraint:** Only **one** popup visible; opening a new id replaces the current one.

## Anonymous mode

- `PlayerProfile.anonymous` and store flag drive copy (“Sign up to save progress”).
- No auth in template; keep checks as `if (anonymous) { … }` in UI.

## Audio

- Define keys in `src/config/audio.config.ts` (URLs point off-repo).
- Play via `playSfx("key")` from `src/lib/audio.ts` (Howler).

## Icons & resources

- Pixel icons and resources are **imported** from the private **`images`** repo (sibling folder `../images`), Vite alias **`@sl-assets`** → `../images/assets` (see `vite.config.ts`).
- UI icons: `src/config/icons.config.ts` → `<Icon name="disc" />` (10 examples included).
- Materials: `src/config/resources.config.ts` → `<ResourceImage name="wood" />` (10 examples included).

### Default sample: Boring (`src/examples/boring/`)

- **`/`** — `BoringSessionContext` calls **`getPlayerEconomySession`** when API base URL + portal JWT are available.
- **`/game`** — **`PhaserGame`** + **`MainScene`**; bumpkin uses bundled silhouette assets under `public/game/`.

## Agent checklist (before editing)

1. Read `GAME_SPEC.md` for numbers/copy tied to your change.
2. Prefer updating **store** over ad-hoc `useState` for data shared with Phaser.
3. New modal → registry + provider (no stacked modals).
4. New portal call → extend `src/lib/portal/api.ts` or add a typed helper next to it; generic profile stubs → `api.ts`.

## Related docs

- `ARCHITECTURE.md`, `API.md`, `UI_UX_GUIDELINES.md`
