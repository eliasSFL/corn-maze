/**
 * Remote / persistence stubs. Extend with real endpoints for Sunflower Land services.
 * Trade helpers live here (single module — see docs/API.md).
 */

export interface PlayerProfile {
  coins: number;
  skulls?: number;
  anonymous: boolean;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** TODO: replace with GET /player or session bootstrap */
export async function loadPlayerProfile(): Promise<PlayerProfile> {
  await delay(350);
  return {
    coins: 0,
    skulls: 0,
    anonymous: true,
  };
}

/** TODO: POST score / session result */
export async function submitScore(_score: number): Promise<void> {
  await delay(200);
  // TODO: wire API
}

/** TODO: purchase / unlock flow */
export async function purchaseUpgrade(_itemId: string): Promise<void> {
  await delay(200);
  // TODO: wire API + validate balance server-side
}

/** TODO: coins → axe (validate inventory server-side) */
export async function tradeCoinsForAxe(
  _coinsSpent: number,
): Promise<{ ok: boolean }> {
  await delay(250);
  return { ok: true };
}

/** TODO: axe → wood (gameplay or crafting endpoint) */
export async function tradeAxeForWood(
  _axeUses: number,
): Promise<{ wood: number }> {
  await delay(250);
  return { wood: 1 };
}

/** TODO: wood → collectible (rare / tradeable sink) */
export async function tradeWoodForCollectible(
  _woodSpent: number,
): Promise<{ collectibleId: string | null }> {
  await delay(300);
  return { collectibleId: null };
}
