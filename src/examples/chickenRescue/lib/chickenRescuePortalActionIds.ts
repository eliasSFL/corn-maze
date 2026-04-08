import { CONFIG } from "lib/config";
import type { MinigameActionDefinition } from "lib/portal/processAction";

/**
 * Resolved from `session.actions` so the portal works when the editor/API use
 * numeric string keys (e.g. `"12"`) instead of semantic names (`START_GAME`, `GAMEOVER`).
 */
export type ChickenRescuePortalActionIds = {
  startBasic: string;
  /** Basic run end: mint chook count `"1"` (0–100), burn `LIVE_GAME`. */
  gameOverBasic: string;
  startAdvanced: string;
  /** Advanced run end: mint golden `"2"` (optional normal `"1"` in API), burn `ADVANCED_GAME`. */
  gameOverAdvanced: string;
};

const DEFAULT_IDS: ChickenRescuePortalActionIds = {
  startBasic: "START_GAME",
  gameOverBasic: "GAMEOVER",
  startAdvanced: "START_ADVANCED_GAME",
  gameOverAdvanced: "ADVANCED_GAMEOVER",
};

function asDef(raw: unknown): MinigameActionDefinition | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as MinigameActionDefinition;
}

function isFixedAmountMint(rule: unknown): rule is { amount: number } {
  return (
    typeof rule === "object" &&
    rule !== null &&
    "amount" in rule &&
    typeof (rule as { amount: unknown }).amount === "number"
  );
}

function isRangedMint(
  rule: unknown,
): rule is { min: number; max: number; dailyCap: number } {
  const r = rule as Record<string, unknown>;
  return (
    typeof rule === "object" &&
    rule !== null &&
    typeof r.min === "number" &&
    typeof r.max === "number" &&
    typeof r.dailyCap === "number"
  );
}

function recordIsEffectivelyEmpty(
  r: Record<string, unknown> | undefined,
): boolean {
  return r == null || Object.keys(r).length === 0;
}

/** API/editor may send `{}` for unused produce/collect. */
function noProduceCollect(def: MinigameActionDefinition): boolean {
  return (
    recordIsEffectivelyEmpty(
      def.produce as Record<string, unknown> | undefined,
    ) &&
    recordIsEffectivelyEmpty(
      def.collect as Record<string, unknown> | undefined,
    )
  );
}

/** mint LIVE_GAME x1, burn worm `"4"` x1 (subset match; extra mint/burn keys allowed). */
function matchesStartBasic(def: MinigameActionDefinition): boolean {
  if (!noProduceCollect(def)) {
    return false;
  }
  const m = def.mint;
  const b = def.burn;
  if (!m?.LIVE_GAME || !b?.["4"]) {
    return false;
  }
  return (
    isFixedAmountMint(m.LIVE_GAME) &&
    m.LIVE_GAME.amount === 1 &&
    b["4"].amount === 1
  );
}

/** ranged mint `"1"`, burn LIVE_GAME x1, no golden mint `"2"`. */
function matchesGameOverBasic(def: MinigameActionDefinition): boolean {
  if (!noProduceCollect(def)) {
    return false;
  }
  const m = def.mint;
  const b = def.burn;
  if (!m?.["1"] || "2" in m) {
    return false;
  }
  if (!isRangedMint(m["1"]) || !b?.LIVE_GAME) {
    return false;
  }
  return b.LIVE_GAME.amount === 1;
}

/** mint ADVANCED_GAME x1, burn `"3"` x1 */
function matchesStartAdvanced(def: MinigameActionDefinition): boolean {
  if (!noProduceCollect(def)) {
    return false;
  }
  const m = def.mint;
  const b = def.burn;
  if (!m?.ADVANCED_GAME || !b?.["3"]) {
    return false;
  }
  return (
    isFixedAmountMint(m.ADVANCED_GAME) &&
    m.ADVANCED_GAME.amount === 1 &&
    b["3"].amount === 1
  );
}

/** Ranged mint `"2"` (golden), burn ADVANCED_GAME x1. Optional ranged `"1"` if API still lists it. */
function matchesGameOverAdvanced(def: MinigameActionDefinition): boolean {
  if (!noProduceCollect(def)) {
    return false;
  }
  const m = def.mint;
  const b = def.burn;
  if (!m?.["2"] || !b?.ADVANCED_GAME) {
    return false;
  }
  if (!isRangedMint(m["2"]) || b.ADVANCED_GAME.amount !== 1) {
    return false;
  }
  if (m["1"] !== undefined && !isRangedMint(m["1"])) {
    return false;
  }
  return true;
}

function resolveOne(
  actions: Record<string, unknown>,
  canonical: string,
  match: (d: MinigameActionDefinition) => boolean,
): string {
  const byCanonical = asDef(actions[canonical]);
  if (byCanonical && match(byCanonical)) {
    return canonical;
  }
  const ids = Object.keys(actions).sort();
  for (const id of ids) {
    const d = asDef(actions[id]);
    if (d && match(d)) {
      return id;
    }
  }
  return canonical;
}

function trimConfigActionId(raw: string | undefined): string | undefined {
  const t = raw?.trim();
  return t || undefined;
}

function pickExistingActionId(
  actions: Record<string, unknown>,
  resolved: string,
  envOverride?: string,
): string {
  if (resolved in actions) {
    return resolved;
  }
  const fromEnv = trimConfigActionId(envOverride);
  if (fromEnv && fromEnv in actions) {
    return fromEnv;
  }
  return resolved;
}

/**
 * Maps Chicken Rescue run lifecycle actions to the keys present in
 * `MinigameSessionResponse.actions` (semantic or numeric).
 */
export function resolveChickenRescuePortalActionIds(
  actions: Record<string, unknown>,
): ChickenRescuePortalActionIds {
  return {
    startBasic: pickExistingActionId(
      actions,
      resolveOne(actions, DEFAULT_IDS.startBasic, matchesStartBasic),
      CONFIG.PORTAL_CR_ACTION_START_BASIC,
    ),
    gameOverBasic: pickExistingActionId(
      actions,
      resolveOne(actions, DEFAULT_IDS.gameOverBasic, matchesGameOverBasic),
      CONFIG.PORTAL_CR_ACTION_GAME_OVER_BASIC,
    ),
    startAdvanced: pickExistingActionId(
      actions,
      resolveOne(actions, DEFAULT_IDS.startAdvanced, matchesStartAdvanced),
      CONFIG.PORTAL_CR_ACTION_START_ADVANCED,
    ),
    gameOverAdvanced: pickExistingActionId(
      actions,
      resolveOne(
        actions,
        DEFAULT_IDS.gameOverAdvanced,
        matchesGameOverAdvanced,
      ),
      CONFIG.PORTAL_CR_ACTION_GAME_OVER_ADVANCED,
    ),
  };
}
