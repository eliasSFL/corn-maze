# Sunflower Land — mini-game template

Starter repo for **browser mini-games** set in the Sunflower Land universe. **Default sample in `App.tsx`:** **`ChickenRescueApp`** (`examples/chickenRescue/`) — Phaser game with portal JWT + Minigames session. Other samples live under **`examples/`** (e.g. **`ui-resources/`** dashboard); swap the import in **`App.tsx`** to try them. Portal helpers in **`src/lib/portal/`** match **Chicken Rescue v2** (`VITE_MINIGAMES_API_URL`, `GET /data?type=session`, `POST /action`). Includes **Nanostores**, **`lib/api.ts`** stubs, and **Howler** audio.

## Quick start

```bash
yarn install
yarn dev
```

Open the URL Vite prints (port **3000** by default). Copy `.env.sample` → `.env` if you need custom animation or image hosts.

### Private `images` repo (icons, resources, SFX)

This template imports art from the **[sunflower-land/images](https://github.com/sunflower-land/images)** (or your fork) checkout **next to** this folder:

```text
workspace/
  images/                    ← asset repo (assets/icons, assets/resources, assets/sfx, …)
  sunflower-land-template/   ← this template
```

`vite.config.ts` maps `@sl-assets` → `../images/assets`. If your clone lives elsewhere, change that path.

## Agents (Cursor, Copilot, etc.)

Short machine-oriented rules: **[AGENTS.md](AGENTS.md)**. Full detail lives in **`docs/`** below.

## What to read next

All contributor and **AI-agent-oriented** guidelines live in **`docs/`**:

| Doc | Purpose |
|-----|---------|
| [docs/README.md](docs/README.md) | Index of every guideline file |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Folder layout, when to split components |
| [docs/TECHNICAL.md](docs/TECHNICAL.md) | React ↔ Phaser, store, popups, Howler, icons |
| [docs/GAME_SPEC.md](docs/GAME_SPEC.md) | **Your** game rules — edit this as you design |
| [docs/DESIGN.md](docs/DESIGN.md) | Sunflower Land tone, loops, economy philosophy |
| [docs/UI_UX_GUIDELINES.md](docs/UI_UX_GUIDELINES.md) | Panels, labels, mobile-first UI |
| [docs/API.md](docs/API.md) | Builder guide: economy + portal usage; `src/lib/portal/`; stub profile (`src/lib/api.ts`) |
| [docs/ART.md](docs/ART.md) | Pixel-art-only rules |
| [docs/AUDIO.md](docs/AUDIO.md) | Sound style + config |
| [docs/VALIDATION.md](docs/VALIDATION.md) | **Manual** pre-ship checklist (win / retry / playable) |

## What to change first

1. **`docs/GAME_SPEC.md`** — win/lose, resources, copy.
2. **`src/lib/api.ts`** — replace stubs with real calls; keep `PlayerProfile` shape or extend it.
3. **`src/config/icons.config.ts`**, **`src/config/resources.config.ts`**, **`src/config/audio.config.ts`** — extend the bundled `@sl-assets` imports (requires sibling **`images`** repo; see above).
4. **`src/lib/popups.ts`** + **`src/components/popups/popupRegistry.tsx`** — add modal ids and bodies.
5. **`src/game/`** — add scenes and containers; keep heavy UI in React per `TECHNICAL.md`.
6. **`src/examples/boring/`** — default **`BoringApp`** in **`App.tsx`** (see `src/examples/README.md`). Replace **`App`** with your own shell when you outgrow the demo.

## Included UI primitives

`src/components/ui/`: **Panel**, **Button**, **Label**, **Input**, **Icon** (URL-driven). If you need another control, add a small primitive alongside these (see `ARCHITECTURE.md`).

## Popups

- **One modal at a time.** `PopupProvider` wraps the app in `src/main.tsx`.
- Open from React: `usePopup().open("welcome")` or `popupSingleton.open("hint", { message: "..." })`.
- Open from Phaser: `import { popupSingleton } from "lib/popupSingleton"` (same API).

Registry: `src/components/popups/popupRegistry.tsx`.

## Build

```bash
yarn build
```

## Licence

This template may diverge from the original Sunflower Land app licence. Check the repository’s `LICENSE` or organisation policy before redistributing.
