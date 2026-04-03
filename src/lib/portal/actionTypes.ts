/**
 * Action rule shapes aligned with sunflower-land-api minigames (for client-side defs).
 * Server validates; this file is types only — no reducers.
 */

export type MintRuleFixed = { amount: number };
export type MintRuleFixedDailyCapped = { amount: number; dailyCap: number };
export type MintRuleRanged = { min: number; max: number; dailyCap: number };
export type MintRule =
  | MintRuleFixed
  | MintRuleFixedDailyCapped
  | MintRuleRanged;
export type BurnRule = { amount: number };

/** Minimum balance; tokens are not consumed (unlike {@link BurnRule}). */
export type RequireRule = { amount: number };

export type ProduceRule = {
  msToComplete: number;
  limit?: number;
  requires?: string;
};

export type CollectRule = { amount: number };

export type MinigameActionDefinition = {
  require?: Record<string, RequireRule>;
  requireBelow?: Record<string, number>;
  requireAbsent?: string[];
  mint?: Record<string, MintRule>;
  burn?: Record<string, BurnRule>;
  produce?: Record<string, ProduceRule>;
  collect?: Record<string, CollectRule>;
};
