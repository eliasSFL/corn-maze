/**
 * Minimal economy actions for offline Chicken Rescue (no Minigames API).
 * `CLAIM_FREE_WORMS` uses `seconds: 0` so claim + collect runs in one flow; live API
 * configs may use a longer delay (e.g. 28800) — the home screen copy reflects that.
 */
export const CHICKEN_RESCUE_OFFLINE_ACTIONS: Record<string, unknown> = {
  CLAIM_FREE_WORMS: {
    showInShop: false,
    maxUsesPerDay: 1,
    produce: { "4": {} },
    collect: { "4": { amount: 3, seconds: 0 } },
    type: "custom",
  },
};
