import type { MinigameSessionResponse } from "lib/portal";
import { cloneMinigameSnapshot } from "lib/portal/runtimeHelpers";
import { utcCalendarDay } from "lib/portal/processAction";
import type {
  GeneratorRecipeRule,
  PlayerEconomyActionDefinition,
} from "lib/portal/playerEconomyTypes";
import { resolveProduceDurationMs } from "lib/portal/resolveProduceDuration";

const FREE_WORMS_DAILY_STORAGE_KEY = "chicken-rescue.free-worms-claimed-utc-day";
const FREE_WORMS_TIMER_STARTED_KEY =
  "chicken-rescue.free-worms-timer-started-utc-day";

/** After instant claim (mint or produce+collect with no wait). */
export function markFreeWormsClaimedForUtcDay(): void {
  try {
    sessionStorage.setItem(
      FREE_WORMS_DAILY_STORAGE_KEY,
      utcCalendarDay(Date.now()),
    );
  } catch {
    // ignore
  }
}

/** After starting a delayed produce job (e.g. `collect.seconds` &gt; 0) without `maxUsesPerDay`. */
export function markFreeWormsTimerStartedForUtcDay(): void {
  try {
    sessionStorage.setItem(
      FREE_WORMS_TIMER_STARTED_KEY,
      utcCalendarDay(Date.now()),
    );
  } catch {
    // ignore
  }
}

export function hasClientTrackedFreeWormsClaimToday(): boolean {
  try {
    return (
      sessionStorage.getItem(FREE_WORMS_DAILY_STORAGE_KEY) ===
      utcCalendarDay(Date.now())
    );
  } catch {
    return false;
  }
}

export function hasClientTrackedFreeWormsTimerStartToday(): boolean {
  try {
    return (
      sessionStorage.getItem(FREE_WORMS_TIMER_STARTED_KEY) ===
      utcCalendarDay(Date.now())
    );
  } catch {
    return false;
  }
}

export function resolveClaimFreeWormsDurationMs(
  def: PlayerEconomyActionDefinition | undefined,
): number {
  if (!def?.produce || !def.collect) return 0;
  const entries = Object.entries(def.produce);
  if (entries.length === 0) return 0;
  const [outputToken, produceRule] = entries[0];
  return resolveProduceDurationMs(
    outputToken,
    produceRule as GeneratorRecipeRule,
    def.collect,
  );
}

export function hasPendingFreeWormsJob(
  economy: MinigameSessionResponse["playerEconomy"],
  claimActionId: string,
  now = Date.now(),
): boolean {
  return Object.values(economy.generating).some(
    (j) => j.sourceActionId === claimActionId && now < j.completesAt,
  );
}

/**
 * True when the action mints worm token `"4"` with a fixed `amount` (no ranged rule).
 * Use this for optimistic balances that match server mint-only claims.
 */
export function isMintOnlyWormGrant(
  def: PlayerEconomyActionDefinition | undefined,
): boolean {
  if (!def?.mint) return false;
  const m = def.mint["4"];
  if (!m || typeof m !== "object" || !("amount" in m)) return false;
  if ("min" in m || "max" in m || "dailyCap" in m) return false;
  return typeof (m as { amount: unknown }).amount === "number";
}

export function applyMintOnlyFreeWorms(
  economy: MinigameSessionResponse["playerEconomy"],
  def: PlayerEconomyActionDefinition,
): { ok: true; playerEconomy: MinigameSessionResponse["playerEconomy"] } {
  const m = def.mint?.["4"];
  const add =
    m && typeof m === "object" && "amount" in m && typeof m.amount === "number"
      ? m.amount
      : 0;
  const next = cloneMinigameSnapshot(economy);
  next.balances["4"] = (next.balances["4"] ?? 0) + add;
  return { ok: true, playerEconomy: next };
}

export function canShowFreeWormsClaimModal(input: {
  claimActionId: string;
  actions: Record<string, unknown>;
  playerEconomy: MinigameSessionResponse["playerEconomy"];
  now?: number;
}): boolean {
  const { claimActionId, actions, playerEconomy, now = Date.now() } = input;
  if (!claimActionId || !(claimActionId in actions)) {
    return false;
  }
  if (hasPendingFreeWormsJob(playerEconomy, claimActionId, now)) {
    return false;
  }
  const def = actions[claimActionId] as PlayerEconomyActionDefinition;
  const cap = def?.maxUsesPerDay;
  if (typeof cap === "number" && cap > 0) {
    const bucket = playerEconomy.dailyActionUses;
    const day = utcCalendarDay(now);
    if (!bucket || bucket.utcDay !== day) {
      return true;
    }
    return (bucket.byAction[claimActionId] ?? 0) < cap;
  }
  if (hasClientTrackedFreeWormsTimerStartToday()) {
    return false;
  }
  return !hasClientTrackedFreeWormsClaimToday();
}
