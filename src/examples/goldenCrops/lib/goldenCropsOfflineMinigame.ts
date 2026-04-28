import type { MinigameSessionResponse } from "lib/portal";
import { emptySessionMinigame } from "lib/portal/runtimeHelpers";
import type { MinigameSessionEconomyMeta } from "lib/portal/types";
import {
  GOLDEN_CROPS_ACTIONS,
  GOLDEN_CROPS_ITEMS,
} from "./goldenCropsEconomyConfig";

/**
 * Offline economy: starts with initial balances from item config.
 */
export function createGoldenCropsOfflineMinigame(
  now = Date.now(),
): MinigameSessionResponse["playerEconomy"] {
  const base = emptySessionMinigame(now);

  // Apply initial balances from item definitions
  for (const [token, item] of Object.entries(GOLDEN_CROPS_ITEMS)) {
    if (item.initialBalance && item.initialBalance > 0) {
      base.balances[token] = item.initialBalance;
    }
  }

  return base;
}

/**
 * Offline economy meta: items + descriptions for the dashboard.
 */
export const GOLDEN_CROPS_OFFLINE_ECONOMY_META: MinigameSessionEconomyMeta = {
  items: GOLDEN_CROPS_ITEMS,
  mainCurrencyToken: "coin",
};

/**
 * Action definitions used by the portal provider for optimistic updates.
 */
export const GOLDEN_CROPS_OFFLINE_ACTIONS: Record<string, unknown> =
  GOLDEN_CROPS_ACTIONS;
