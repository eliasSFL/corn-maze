import type { MinigameActionDefinition } from "lib/portal";

/**
 * Example client-side action definitions (same pattern as Chicken Rescue).
 * Wire `postPlayerEconomyAction` when you need server-backed mint/burn.
 */
export const BORING_CLIENT_ACTIONS: Record<
  string,
  MinigameActionDefinition
> = {
  START_ROUND: {
    mint: {
      DEMO_TOKEN: { amount: 1 },
    },
    burn: {
      ENTRY_FEE: { amount: 1 },
    },
  },
  END_ROUND: {
    mint: {
      SCORE: { min: 0, max: 10, dailyCap: 100 },
    },
    burn: {
      DEMO_TOKEN: { amount: 1 },
    },
  },
};
