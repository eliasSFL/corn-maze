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
      }
    >;
    activity: number;
    dailyActivity: { date: string; count: number };
    /** Present when API returns the extended player economy payload. */
    dailyMinted?: { utcDay: string; minted: Record<string, number> };
  };
  actions: Record<string, unknown>;
};

export type MinigameActionResponse = {
  playerEconomy: MinigameSessionResponse["playerEconomy"];
  generatorJobId?: string;
};

export type BootstrapContext = {
  id: number;
  jwt: string;
  /**
   * Must match `portalId` inside the portal JWT — used for
   * `GET/POST /portal/:portalId/player-economy`.
   */
  portalId: string;
  farm: MinigameSessionResponse["farm"];
  playerEconomy: MinigameSessionResponse["playerEconomy"];
  actions: Record<string, unknown>;
};
