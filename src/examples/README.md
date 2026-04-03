# Examples

## Boring (`boring/`) — **default**

Minimal **portal** demo mounted from **`App.tsx`** via **`BoringApp`**.

- **Routes:** **`/`** — welcome screen; loads **`GET /portal/:portalId/player-economy`** when an API base URL and portal JWT are present. **`/game`** — **`PhaserGame`** + **`MainScene`** (arrow keys move **`BumpkinContainer`**).
- **API:** `src/lib/portal/` — `getPlayerEconomySession`, `postPlayerEconomyAction`, `getUrl` / `getJwt` (same behaviour as Chicken Rescue). Example client action defs: **`lib/boringClientActions.ts`** (no server `processAction` in this template).
- **Env / query:** `VITE_API_URL`, `VITE_PORTAL_APP`, or parent iframe params `apiUrl`, `network`, `jwt` (see `lib/portal/url.ts`).
