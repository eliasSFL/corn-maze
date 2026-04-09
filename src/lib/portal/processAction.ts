/**
 * Player-economy action simulation (optimistic updates). Kept in sync with
 * sunflower-land-api minigames domain. {@link MinigameActionDefinition} aliases
 * the full editor rule shape for backward compatibility with examples.
 */

export * from "./playerEconomyTypes";

export {
  processPlayerEconomyAction,
  processPlayerEconomyGeneratorCollect,
  emptyPlayerEconomyState,
  utcCalendarDay,
  rolloverDailyMintedIfNeeded,
  clonePlayerEconomyRuntimeState,
} from "./playerEconomyProcess";

import type {
  PlayerEconomyActionDefinition,
  PlayerEconomyConfig,
  PlayerEconomyRuntimeState,
} from "./playerEconomyTypes";

export type MinigameActionDefinition = PlayerEconomyActionDefinition;
export type MinigameConfig = PlayerEconomyConfig;
export type MinigameRuntimeState = PlayerEconomyRuntimeState;
