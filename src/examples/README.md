# Examples

## Chicken Rescue (`chickenRescue/`) — **default in `App.tsx`**

Phaser mini-game with **MemoryRouter** routes (`/home`, `/game`), **MinigamePortalProvider**, and Chicken Rescue–specific economy actions (start run, GAMEOVER mints, etc.). Offline stub: **`lib/chickenRescueMachine.ts`**.

## Boring (`boring/`)

Minimal **portal** demo (if included in your fork): **`BoringApp`**.

- **Routes:** **`/`** — welcome; **`/game`** — Phaser + bumpkin.
- **API:** `src/lib/portal/` — `getPlayerEconomySession`, `postPlayerEconomyAction`, `getMinigamesApiUrl` / `getUrl` / `getJwt`. Example client action defs: **`lib/boringClientActions.ts`**.

## UI Resources (`ui-resources/`)

Player-economy **dashboard** minigame (shop, generators, inventory) driven by the Minigames session payload (`actions` plus optional `items`, `descriptions`, `visualTheme`, …). Mount **`UiResourcesApp`** from **`App.tsx`** to try it. Without **`VITE_MINIGAMES_API_URL`**, **`UiResourcesApp`** uses a small offline stub (`lib/localOfflineStub.ts`).

**Editor-ready JSON (single object):** copy or upload [`ui-resources/ui-resources-editor-sample.json`](./ui-resources/ui-resources-editor-sample.json) into the portal editor JSON tab, then Save.
