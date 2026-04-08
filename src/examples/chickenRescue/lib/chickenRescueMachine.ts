import type { MinigameSessionResponse } from "lib/portal";
import { emptyPlayerEconomyState } from "lib/portal/processAction";
import { runtimeToMinigameSession } from "lib/portal/runtimeHelpers";

/** Must match sunflower-land-api `CHICKEN_RESCUE_BOOTSTRAP_WORMS_JOB_ID`. */
export const CHICKEN_RESCUE_BOOTSTRAP_WORMS_JOB_ID =
  "bootstrap-wormery-worms-0" as const;

/** Offline dev: generous balances for local testing (no API). */
const CHICKEN_RESCUE_OFFLINE_TEST_BALANCE = 1000;

/** Item keys `"0"`…`"8"` match chicken-rescue-v2 economy config. */
const CHICKEN_RESCUE_OFFLINE_TEST_BALANCE_KEYS = [
  "4",
  "0",
  "1",
  "3",
  "2",
  "LIVE_GAME",
  "ADVANCED_GAME",
  "6",
  "7",
  "8",
] as const;

export function wormsFromMinigame(
  economy: MinigameSessionResponse["playerEconomy"],
): number {
  return economy.balances["4"] ?? 0;
}

export function wormeriesFromMinigame(
  economy: MinigameSessionResponse["playerEconomy"],
): number {
  return economy.balances["5"] ?? 0;
}

/** Initial session for offline Chicken Rescue (mirrors server bootstrap). */
export function createChickenRescueOfflineMinigame(
  now = Date.now(),
): MinigameSessionResponse["playerEconomy"] {
  const base = emptyPlayerEconomyState(now);
  for (const key of CHICKEN_RESCUE_OFFLINE_TEST_BALANCE_KEYS) {
    base.balances[key] = CHICKEN_RESCUE_OFFLINE_TEST_BALANCE;
  }
  base.balances["5"] = 1;
  base.generating[CHICKEN_RESCUE_BOOTSTRAP_WORMS_JOB_ID] = {
    outputToken: "4",
    startedAt: now - 1,
    completesAt: now,
    requires: "5",
  };
  return runtimeToMinigameSession(base);
}

/** Chooks minted on GAMEOVER; matches server ranged mint max (100). */
export function chooksForScore(score: number): number {
  return Math.min(100, Math.max(0, Math.floor(score)));
}

/** @deprecated Use `chooksForScore` */
export const grubsForScore = chooksForScore;

export function hasLiveGame(
  economy: MinigameSessionResponse["playerEconomy"],
): boolean {
  return (
    (economy.balances.LIVE_GAME ?? 0) > 0 ||
    (economy.balances.ADVANCED_GAME ?? 0) > 0
  );
}

/** Run length on /game after START_GAME (seconds). */
export const GAME_SECONDS = 60;
