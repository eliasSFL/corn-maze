# GAME_SPEC.md

> **Living document.** Clone maintainers edit this file as the single source for **numbers**, **rules**, and **content** specific to **their** mini-game.

## Agent summary

Before changing code, update this spec when you alter: **starting resources**, **win/lose conditions**, **timers**, **costs**, **enemy counts**, or **progression tiers**. Agents should read this file when implementing balance or UI copy tied to rules.

**Default shell:** `App` renders **`ChickenRescueApp`** (Phaser + portal session). Swap in **`UiResourcesApp`** or another example from **`src/examples/`** in **`App.tsx`** when building a different mini-game.

When changing **Phaser visuals**, read **`ART.md`** and keep gameplay art mapped to **`icons.config.ts` / `resources.config.ts`** (`@sl-assets`) where possible — avoid one-off URLs or vector-drawn gameplay tiles where pixel assets exist.

---

## Game identity (your fork)

- **Working title:** _[your game name]_
- **One-line pitch:** _[what the player does in one sentence]_

## Core loop (fill in)

1. _[Step 1]_
2. _[Step 2]_
3. _[Step 3]_

## Win / lose (your fork)

- **Win condition:** _[e.g. reach score X, survive Y seconds]_
- **Lose condition:** _[e.g. run out of lives]_
- **Retry:** _[what resets vs what persists]_

## Resources (your fork)

| Resource | Type | Notes |
|----------|------|-------|
| Coins | profile (stub) | `$gameState.coins` from `loadPlayerProfile` in `lib/api.ts` |
| _[add rows]_ | | |

---

## Boring (`src/examples/boring/`)

> Optional sample (mount **`BoringApp`** from **`App.tsx`** if present in your fork). Session fetch: portal helpers + **`getPlayerEconomySession`**. Example action **definitions** (not wired to POST yet): **`boring/lib/boringClientActions.ts`**.

### Pitch

Welcome screen → **Start** → simple Phaser field with a bumpkin moved by arrow keys.

### Routes

| Path | Role |
|------|------|
| `/` | Welcome; session fetch when `getMinigamesApiUrl()` + `getJwt()` succeed |
| `/game` | **`MainScene`** inside **`PhaserGame`** |

---

## Out of scope (this file)

- Does **not** replace `DESIGN.md` (philosophy) or `TECHNICAL.md` (implementation).

## Related docs

- `DESIGN.md`, `VALIDATION.md`, `API.md`, `ART.md`, `TECHNICAL.md`, `../src/examples/README.md`
