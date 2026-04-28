import type { MinigameSessionResponse } from "./types";
import {
  emptyPlayerEconomyState,
  processPlayerEconomyAction,
  type MinigameActionDefinition,
  type MinigameConfig,
  type MinigameRuntimeState,
  type PlayerEconomyConfig,
  utcCalendarDay,
} from "./processAction";

export function cloneMinigameSnapshot(
  m: MinigameSessionResponse["playerEconomy"],
): MinigameSessionResponse["playerEconomy"] {
  const day = utcCalendarDay(Date.now());
  const dm = m.dailyMinted ?? { utcDay: day, minted: {} };
  const base: MinigameSessionResponse["playerEconomy"] = {
    balances: { ...m.balances },
    generating: Object.fromEntries(
      Object.entries(m.generating).map(([k, v]) => [k, { ...v }]),
    ),
    activity: m.activity,
    dailyActivity: { ...m.dailyActivity },
    dailyMinted: { utcDay: dm.utcDay, minted: { ...dm.minted } },
  };
  if (m.rules && Object.keys(m.rules).length > 0) {
    base.rules = Object.fromEntries(
      Object.entries(m.rules).map(([id, rec]) => [id, { ranAt: rec.ranAt }]),
    );
  }
  if (m.purchaseCounts != null) {
    base.purchaseCounts = { ...m.purchaseCounts };
  }
  return base;
}

export function minigameSessionToRuntime(
  m: MinigameSessionResponse["playerEconomy"],
  nowMs: number,
): MinigameRuntimeState {
  const day = utcCalendarDay(nowMs);
  const dm = m.dailyMinted ?? { utcDay: day, minted: {} };
  return {
    balances: { ...m.balances },
    generating: Object.fromEntries(
      Object.entries(m.generating).map(([k, v]) => [k, { ...v }]),
    ),
    activity: m.activity,
    dailyActivity: { ...m.dailyActivity },
    dailyMinted: { utcDay: dm.utcDay, minted: { ...dm.minted } },
    ...(m.rules && Object.keys(m.rules).length > 0
      ? {
          rules: Object.fromEntries(
            Object.entries(m.rules).map(([id, rec]) => [
              id,
              { ranAt: rec.ranAt },
            ]),
          ),
        }
      : {}),
    ...(m.purchaseCounts != null
      ? { purchaseCounts: { ...m.purchaseCounts } }
      : {}),
  };
}

export function runtimeToMinigameSession(
  r: MinigameRuntimeState,
): MinigameSessionResponse["playerEconomy"] {
  const base: MinigameSessionResponse["playerEconomy"] = {
    balances: { ...r.balances },
    generating: Object.fromEntries(
      Object.entries(r.generating).map(([k, v]) => [k, { ...v }]),
    ),
    activity: r.activity,
    dailyActivity: { ...r.dailyActivity },
    dailyMinted: {
      utcDay: r.dailyMinted.utcDay,
      minted: { ...r.dailyMinted.minted },
    },
  };
  if (r.rules && Object.keys(r.rules).length > 0) {
    base.rules = Object.fromEntries(
      Object.entries(r.rules).map(([id, rec]) => [id, { ranAt: rec.ranAt }]),
    );
  }
  if (r.purchaseCounts != null) {
    base.purchaseCounts = { ...r.purchaseCounts };
  }
  return base;
}

export function normalizeMinigameFromApi(
  raw: MinigameSessionResponse["playerEconomy"],
): MinigameSessionResponse["playerEconomy"] {
  const day = utcCalendarDay(Date.now());
  const dm = raw.dailyMinted ?? { utcDay: day, minted: {} };
  const base: MinigameSessionResponse["playerEconomy"] = {
    balances: { ...raw.balances },
    generating: Object.fromEntries(
      Object.entries(raw.generating).map(([k, v]) => [k, { ...v }]),
    ),
    activity: raw.activity,
    dailyActivity: { ...raw.dailyActivity },
    dailyMinted: { utcDay: dm.utcDay, minted: { ...dm.minted } },
  };
  if (raw.rules && Object.keys(raw.rules).length > 0) {
    base.rules = Object.fromEntries(
      Object.entries(raw.rules).map(([id, rec]) => [id, { ranAt: rec.ranAt }]),
    );
  }
  if (raw.purchaseCounts != null) {
    base.purchaseCounts = { ...raw.purchaseCounts };
  }
  return base;
}

const RUN_SESSION_BALANCE_KEYS = ["LIVE_GAME", "ADVANCED_GAME"] as const;

/**
 * Some portal action responses return a partial `balances` map. If `LIVE_GAME` /
 * `ADVANCED_GAME` are omitted, keep the values from `prev` so an in-progress run
 * is not cleared before GAMEOVER.
 */
export function mergeMinigameEconomyFromApi(
  prev: MinigameSessionResponse["playerEconomy"],
  raw: MinigameSessionResponse["playerEconomy"],
): MinigameSessionResponse["playerEconomy"] {
  const next = normalizeMinigameFromApi(raw);
  const balances = { ...next.balances };
  for (const key of RUN_SESSION_BALANCE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(balances, key)) {
      const v = prev.balances[key];
      if (v !== undefined) {
        balances[key] = v;
      }
    }
  }
  return {
    ...next,
    balances,
    rules: next.rules !== undefined ? next.rules : prev.rules,
    purchaseCounts:
      next.purchaseCounts !== undefined
        ? next.purchaseCounts
        : prev.purchaseCounts,
  };
}

export function applyOptimisticPortalAction(
  actions: Record<string, unknown>,
  minigame: MinigameSessionResponse["playerEconomy"],
  input: {
    actionId: string;
    amounts?: Record<string, number>;
    itemId?: string;
    now?: number;
  },
  economyItems?: PlayerEconomyConfig["items"],
):
  | {
      ok: true;
      playerEconomy: MinigameSessionResponse["playerEconomy"];
      collectGrants?: { token: string; amount: number }[];
      generatorJobId?: string;
    }
  | { ok: false; error: string } {
  const now = input.now ?? Date.now();
  const config: MinigameConfig = {
    actions: actions as Record<string, MinigameActionDefinition>,
    ...(economyItems != null ? { items: economyItems } : {}),
  };
  const runtime = minigameSessionToRuntime(minigame, now);
  const result = processPlayerEconomyAction(config, runtime, {
    actionId: input.actionId,
    amounts: input.amounts,
    itemId: input.itemId,
    now,
  });
  if (!result.ok) {
    return result;
  }
  return {
    ok: true,
    playerEconomy: runtimeToMinigameSession(result.state),
    ...(result.collectGrants !== undefined
      ? { collectGrants: result.collectGrants }
      : {}),
    ...(result.generatorJobId !== undefined
      ? { generatorJobId: result.generatorJobId }
      : {}),
  };
}

export function emptySessionMinigame(
  now = Date.now(),
): MinigameSessionResponse["playerEconomy"] {
  return runtimeToMinigameSession(emptyPlayerEconomyState(now));
}
