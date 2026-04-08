import type { MinigameSessionResponse } from "lib/portal";
import { cloneMinigameSnapshot } from "lib/portal/runtimeHelpers";

export type ChickenRescueLifecycleActionName =
  | "START_GAME"
  | "GAMEOVER"
  | "START_ADVANCED_GAME"
  | "ADVANCED_GAMEOVER";

type Economy = MinigameSessionResponse["playerEconomy"];

type ApplyResult =
  | { ok: true; playerEconomy: Economy }
  | { ok: false; error: string };

export function applyChickenRescueStartBasic(
  economy: Economy,
): ApplyResult {
  const worms = economy.balances["4"] ?? 0;
  if (worms < 1) {
    return { ok: false, error: "insufficient_worms" };
  }
  const next = cloneMinigameSnapshot(economy);
  next.balances["4"] = worms - 1;
  next.balances.LIVE_GAME = (next.balances.LIVE_GAME ?? 0) + 1;
  return { ok: true, playerEconomy: next };
}

export function applyChickenRescueStartAdvanced(
  economy: Economy,
): ApplyResult {
  const feet = economy.balances["3"] ?? 0;
  if (feet < 1) {
    return { ok: false, error: "insufficient_chicken_feet" };
  }
  const next = cloneMinigameSnapshot(economy);
  next.balances["3"] = feet - 1;
  next.balances.ADVANCED_GAME = (next.balances.ADVANCED_GAME ?? 0) + 1;
  return { ok: true, playerEconomy: next };
}

export function applyChickenRescueGameOverBasic(
  economy: Economy,
  chooks: number,
): ApplyResult {
  const next = cloneMinigameSnapshot(economy);
  const live = next.balances.LIVE_GAME ?? 0;
  /** Server may still hold the run if the client lost `LIVE_GAME` after a partial API payload. */
  if (live >= 1) {
    next.balances.LIVE_GAME = live - 1;
  } else {
    next.balances.LIVE_GAME = 0;
  }
  next.balances["1"] = (next.balances["1"] ?? 0) + chooks;
  return { ok: true, playerEconomy: next };
}

/** Advanced runs pay out golden chooks (`"2"`) only — no normal chooks (`"1"`). */
export function applyChickenRescueGameOverAdvanced(
  economy: Economy,
  goldenChooks: number,
): ApplyResult {
  const next = cloneMinigameSnapshot(economy);
  const adv = next.balances.ADVANCED_GAME ?? 0;
  if (adv >= 1) {
    next.balances.ADVANCED_GAME = adv - 1;
  } else {
    next.balances.ADVANCED_GAME = 0;
  }
  next.balances["2"] = (next.balances["2"] ?? 0) + goldenChooks;
  return { ok: true, playerEconomy: next };
}
