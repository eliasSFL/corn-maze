import type {
  PlayerEconomyBalanceItem,
  PlayerEconomyDescriptions,
} from "./playerEconomyTypes";

/** Top-level + legacy dashboard fields merged into {@link PlayerEconomyConfig}. */
export type MinigameSessionEconomyMeta = {
  items?: Record<string, PlayerEconomyBalanceItem>;
  descriptions?: PlayerEconomyDescriptions;
  visualTheme?: string;
  playUrl?: string;
  mainCurrencyToken?: string;
  initialBalances?: Record<string, number>;
  productionCollectByStartId?: Record<string, string>;
  dashboard?: {
    productionCollectByStartId?: Record<string, string>;
    visualTheme?: string;
  };
};

export type MinigameSessionResponse = {
  farm: {
    balance: string;
    bumpkin?: unknown;
  };
  playerEconomy: {
    balances: Record<string, number>;
    generating: Record<
      string,
      {
        outputToken: string;
        startedAt: number;
        completesAt: number;
        requires?: string;
        sourceActionId?: string;
      }
    >;
    activity: number;
    dailyActivity: { date: string; count: number };
    /** Present when API returns the extended player economy payload. */
    dailyMinted?: { utcDay: string; minted: Record<string, number> };
    dailyActionUses?: { utcDay: string; byAction: Record<string, number> };
    purchaseCounts?: Record<string, number>;
    /** Some APIs mirror `items` inside `playerEconomy`. */
    items?: Record<string, PlayerEconomyBalanceItem>;
  };
  actions: Record<string, unknown>;
  items?: Record<string, PlayerEconomyBalanceItem>;
  descriptions?: PlayerEconomyDescriptions;
  visualTheme?: string;
  playUrl?: string;
  mainCurrencyToken?: string;
  initialBalances?: Record<string, number>;
  productionCollectByStartId?: Record<string, string>;
  dashboard?: MinigameSessionEconomyMeta["dashboard"];
};

export type MinigameActionResponse = {
  /** Full session-shaped payload after the action (same shape as GET session `data`). */
  economy: MinigameSessionResponse;
  /** Per-token balance deltas (after − before); non-zero entries only. */
  changeset: { balances: Record<string, number> };
  playerEconomy: MinigameSessionResponse["playerEconomy"];
  generatorJobId?: string;
  collectGrants?: { token: string; amount: number }[];
};

export type BootstrapContext = {
  id: number;
  jwt: string;
  /**
   * Must match `portalId` inside the portal JWT (client-side; Minigames API reads
   * portal id from the Bearer token for session + actions).
   */
  portalId: string;
  farm: MinigameSessionResponse["farm"];
  playerEconomy: MinigameSessionResponse["playerEconomy"];
  actions: Record<string, unknown>;
  /** Session fields used to build player-economy dashboard / editor config. */
  economyMeta?: MinigameSessionEconomyMeta;
};

export function resolvePlayerEconomySessionItems(
  raw: MinigameSessionResponse,
): Record<string, PlayerEconomyBalanceItem> | undefined {
  if (raw.items != null) return raw.items;
  const pe = raw.playerEconomy;
  if (
    pe &&
    typeof pe === "object" &&
    "items" in pe &&
    (pe as { items?: Record<string, PlayerEconomyBalanceItem> }).items != null
  ) {
    return (pe as { items: Record<string, PlayerEconomyBalanceItem> }).items;
  }
  return undefined;
}

export function buildEconomyMetaFromSession(
  raw: MinigameSessionResponse,
): MinigameSessionEconomyMeta {
  return {
    items: resolvePlayerEconomySessionItems(raw),
    descriptions: raw.descriptions,
    visualTheme: raw.visualTheme ?? raw.dashboard?.visualTheme,
    playUrl: raw.playUrl,
    mainCurrencyToken: raw.mainCurrencyToken,
    initialBalances: raw.initialBalances,
    productionCollectByStartId:
      raw.productionCollectByStartId ??
      raw.dashboard?.productionCollectByStartId,
    dashboard: raw.dashboard,
  };
}
