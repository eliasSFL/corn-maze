# ARCHITECTURE.md

> **Audience:** Developers and agents navigating the repo.  
> **Focus:** Where files live, when to split components, separation of concerns.

## Agent summary

- **`src/components/`** — React UI: `ui/` primitives, `popups/`, `PhaserGame.tsx`.
- **`src/game/`** — Phaser scenes and game objects (`BumpkinContainer`, `MainScene`).
- **`src/examples/`** — **`chickenRescue/`** (default **`ChickenRescueApp`** in **`App.tsx`**); optional **`boring/`**, **`ui-resources/`**, etc.
- **`src/lib/`** — App logic: `api.ts`, `config.ts`, `portal/`, `gameStore.ts`, `popupSingleton.ts`, `popups.ts`, `audio.ts`.
- **`src/config/`** — **`icons.config.ts`**, **`resources.config.ts`**, **`audio.config.ts`** (static imports from sibling **`../images/assets`** via `@sl-assets`).
- **`docs/`** — Design and process markdown (this file, `TECHNICAL.md`, etc.).

## Folder layout

```
src/
  components/
    ui/           # Panel, Button, Label, Input, Icon — reuse before inventing
    popups/       # PopupProvider, modal bodies, popupRegistry
    PhaserGame.tsx
  game/           # Phaser scenes & containers only
  examples/       # Chicken Rescue (default), other samples
  lib/            # API, store, singletons, audio helper
  config/         # icons, resources, audio (URLs + comments)
  assets/         # Small bundled UI chrome only (e.g. input borders)
docs/             # Specs and guidelines
```

## When to create a new React component

- **Create** when the same JSX structure appears **twice** or more, or when a screen chunk has a clear name (e.g. `WinScreen`, `ResourceRow`).
- **Do not create** a component for a one-off unless it clarifies a large file (>~150 lines of JSX).
- **Missing primitive:** if you need a control that is not yet in `components/ui/`, add a **small boilerplate** component there (match `Panel` / `Button` styling patterns) rather than inlining one-off styles across the app.

## When to create a Phaser container / class

- **Create** a dedicated class (or factory) per **meaningful game object** (player, NPC, station) with public methods for behaviors (`playCelebrate`, `setSkin`, etc.).
- **Scene** stays thin: orchestration, groups, and **subscribe** to `$gameState`; delegate behavior to containers.

## Config

- **Environment:** `.env` / `.env.sample` for public endpoints only.
- **Icons/audio:** never commit private packs; use `src/config/*.config.ts` with placeholder URLs and comments.

## State ownership

- **Single source:** `$gameState` (`gameStore.ts`) for anything Phaser and React both need.
- **Local UI state:** `useState` for ephemeral UI (text field draft, open dropdown) if not shared.

## Testing & validation

- Manual ship checklist: `VALIDATION.md`.

## Related docs

- `TECHNICAL.md` — how to wire store and popups.
- `API.md` — stub boundaries.
