# Player economy — builder guide

This doc is for **people building minigames** with this template: how your game lines up with the **in-game economy editor** and the **live session** players get when they open your minigame from Sunflower Land.

You do **not** need access to any private backend codebase. Treat the **editor** as the contract for what you can configure, and this **template** (especially `src/lib/portal/`) as the contract for how your client talks to the hosted Minigames service. For exact JSON and TypeScript shapes of rules and session payloads, use the type files in this repo: [`playerEconomyTypes.ts`](../src/lib/portal/playerEconomyTypes.ts) and [`types.ts`](../src/lib/portal/types.ts).

---

## What you’re wiring together

1. **An economy** you design in the in-game **economy editor** (items, rules, copy). That publish step is your **source of truth** for what players may earn, spend, or unlock.
2. **Your game** (this repo): reads a **session snapshot** (config + that player’s balances and timers), then asks the server to **apply named actions** when something happens in gameplay.

You do **not** invent balance changes in client-only code if you want them to persist: the server only applies transitions that **match rules you published**. The client can **predict** outcomes for snappy UI, but the **authoritative** balances come back after each successful call (or from the refreshed session payload).

---

## What you need as a builder

| Need | Why |
|------|-----|
| **Economy slug** | Must match the **portal id** inside the JWT. If they differ, session load fails (“unknown economy”). |
| **Portal JWT** | Proves farm + player. The main game (or editor “play” flow) opens your URL with `?jwt=…`; your app reads it and sends it on economy calls. |
| **Minigames API base URL** | Set **`VITE_MINIGAMES_API_URL`** in `.env` (see [`.env.sample`](../.env.sample)) to the **Minigames API base URL** you were given for your environment (often supplied when your economy is set up for iframe play). The template uses it for session load and actions. Optional query overrides exist for local testing — see [`src/lib/portal/url.ts`](../src/lib/portal/url.ts). |
| **Action ids** | Every rule you care about in code has an **id** string in the editor. Your game sends that exact string when applying an action (e.g. `START_RUN`, `GAMEOVER`, `buy_sword`). |

---

## Mental model: session vs actions

- **Session** — “Everything I need to render and validate right now”: your **published rules** (`actions`, `items`, …), plus **this farm’s** `playerEconomy` (balances, active generator jobs, daily counters, purchase counts, …). Load once at boot (and refresh after mutations if you want to be simple).
- **Action** — One **allowed transition** you defined (burn/mint/require/generator step, etc.). Your game calls it when the player does the matching thing. The server checks prerequisites, updates state, and returns an updated snapshot (or an error message you can show).

**Generators (timers)** — Starting production creates a **job** with an **id** in `playerEconomy.generating`. Finishing it is a **separate** call from “named actions”: the template maps `postPlayerEconomyAction({ token, itemId })` to the server’s **collect job** flow. You don’t put `generator.collected` in your editor as a custom action id.

---

## What the template already does

Wrap your app (or game route) in **`MinigamePortalProvider`** and supply an **`offlineMinigame`** factory for local work without an API. Examples: [`src/examples/chickenRescue/ChickenRescue.tsx`](../src/examples/chickenRescue/ChickenRescue.tsx), [`src/examples/ui-resources/UiResourcesApp.tsx`](../src/examples/ui-resources/UiResourcesApp.tsx), [`src/examples/hideAndSeek/HideAndSeekApp.tsx`](../src/examples/hideAndSeek/HideAndSeekApp.tsx).

| Goal | Where to look |
|------|----------------|
| Read JWT / API base | [`src/lib/portal/url.ts`](../src/lib/portal/url.ts) — `getJwt`, `getMinigamesApiUrl` |
| Fetch session | [`src/lib/portal/api.ts`](../src/lib/portal/api.ts) — `getPlayerEconomySession` |
| Apply an action or collect a job | [`src/lib/portal/api.ts`](../src/lib/portal/api.ts) — `postPlayerEconomyAction` |
| Hold session in React + optimistic sync | [`src/lib/portal/minigamePortalProvider.tsx`](../src/lib/portal/minigamePortalProvider.tsx), [`src/lib/portal/sessionProvider.tsx`](../src/lib/portal/sessionProvider.tsx) — `useMinigameSession` |
| Type shapes for TS | [`src/lib/portal/types.ts`](../src/lib/portal/types.ts), [`src/lib/portal/playerEconomyTypes.ts`](../src/lib/portal/playerEconomyTypes.ts) |
| Client-side simulation (dashboards) | [`src/lib/portal/runtimeHelpers.ts`](../src/lib/portal/runtimeHelpers.ts) — e.g. `applyOptimisticPortalAction` |

If **`VITE_MINIGAMES_API_URL`** is unset, the provider stays **offline** and never calls the network — useful for UI work. If it **is** set, you need a **valid JWT** or users see the “session expired” style gate.

---

## Designing your economy (editor → game)

Think in **tokens** (balance keys) and **actions** (named transitions).

- **Items** — Names, art, marketplace flags, trophies, starting balances. Token keys are strings (often `"0"`, `"1"` for simple economies).
- **Shop-style rules** — Burn some tokens, mint others; optional limits per day or lifetime purchases.
- **Generators** — Time-gated outputs; your UI shows timers from `generating` and completes with the **job id**.
- **“Custom” / iframe-only rules** — Same JSON power as other rules; hide from the default dashboard shop with **`showInShop: false`** when you only invoke them from your game.

**Ranged mint/burn** (min/max in the editor) means the client must send the chosen integer in **`amounts`** for those token keys — e.g. a score converted to a mint amount within your configured range.

**Rule field reference** — The editor labels map to JSON fields on each action (`mint`, `burn`, `require`, `collect`, `chance`, daily caps, generator timing, …). For the precise shapes your client code can rely on, read the TypeScript types in this template: [`playerEconomyTypes.ts`](../src/lib/portal/playerEconomyTypes.ts) (and [`processAction.ts`](../src/lib/portal/processAction.ts) if you use optimistic helpers). If something behaves unexpectedly, adjust the rule in the editor first; the server always validates against what you published.

---

## Common build patterns

1. **Hud currency** — Pick the token key your HUD shows; often the same as **`mainCurrencyToken`** or a key you agree on in config.
2. **Run start / run end** — Two (or more) actions: e.g. one burns a “ticket”, one mints reward with **`amounts`** from score. Names must match editor ids.
3. **Shop in your own UI** — Read `actions` + `items` from session and render buttons; on click call **`postPlayerEconomyAction`** with the right `action` (and `amounts` if needed). The **ui-resources** example drives the whole dashboard from session JSON.
4. **Direct POST without React context** — Some samples call `postPlayerEconomyAction` with `getJwt()` only (e.g. game-over). That works, but **won’t** update `useMinigameSession` state unless you refresh or merge yourself.

---

## Local development

- Run the template with **`VITE_MINIGAMES_API_URL`** pointing at your environment’s Minigames API.
- Append **`?jwt=…`** from the economy editor (or main game portal flow) so `getJwt()` succeeds.
- **`VITE_PORTAL_APP`** can help when the token omits portal id in rare local setups — see `minigamePortalProvider` error text.

---

## Gotchas

- **Token keys in `amounts`** must match the keys in your **mint/burn** rules (e.g. another game’s `GAMEOVER` may mint `"1"` while yours mints `"0"` — template env **`VITE_GAMEOVER_MINT_TOKEN_KEY`** exists for that mismatch when testing).
- **Slug / JWT** — Portal id in the token must be the economy **slug** you saved in the editor.
- **Authoritative state** — After `postPlayerEconomyAction`, prefer the returned **economy / playerEconomy** object over guessing deltas, especially with chance-based collects and daily caps.

---

## Demo profile API (separate from the economy)

[`src/lib/api.ts`](../src/lib/api.ts) is a **stub** for generic profile/coins-style demos. It is **not** the player economy pipeline. For art in inventory-style UIs, use **`ResourceImage`** and **`RESOURCE_CONFIG`**.

---

## Related docs

- [`TECHNICAL.md`](./TECHNICAL.md) — React ↔ Phaser, stores, popups.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Where code lives in this repo.
