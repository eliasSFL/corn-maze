import { tokenUriBuilder } from "lib/utils/tokenUriBuilder";

/**
 * Well-known NPC bumpkin outfits for Golden Crops NPCs.
 */

// Pumpkin Pete
const PUMPKIN_PETE = tokenUriBuilder({
  body: "Beige Farmer Potion",
  hair: "Basic Hair",
  shirt: "Red Farmer Shirt",
  pants: "Farmer Overalls",
  shoes: "Black Farmer Boots",
  tool: "Farmer Pitchfork",
  background: "Farm Background",
});

// Betty
const BETTY = tokenUriBuilder({
  body: "Beige Farmer Potion",
  hair: "Rancher Hair",
  shirt: "Red Farmer Shirt",
  pants: "Farmer Overalls",
  shoes: "Black Farmer Boots",
  tool: "Farmer Pitchfork",
  background: "Farm Background",
});

// Gordy
const GORDY = tokenUriBuilder({
  body: "Light Brown Farmer Potion",
  hair: "Explorer Hair",
  shirt: "Red Farmer Shirt",
  pants: "Farmer Overalls",
  shoes: "Black Farmer Boots",
  tool: "Farmer Pitchfork",
  background: "Farm Background",
});

export const NPC_TOKENS = {
  /** NPC 1: Watering can claimer */
  CLAIM_NPC: PUMPKIN_PETE,
  /** NPC 2: Trophy reward NPC (behind gate) */
  TROPHY_NPC: BETTY,
  /** NPC 3: Gate area watering can NPC */
  GATE_NPC: GORDY,
  /** Shop keeper */
  SHOP_NPC: BETTY,
};

export const OFFLINE_ICONIC_BUMPKIN_TOKENS: readonly string[] = [
  PUMPKIN_PETE,
  BETTY,
  GORDY,
];

const STORAGE_KEY = "goldenCrops_offlinePlayerToken";

export function getOrCreateOfflineGoldenCropsTokenParts(): string {
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing && OFFLINE_ICONIC_BUMPKIN_TOKENS.includes(existing)) {
      return existing;
    }
  } catch {
    // ignore
  }
  const token =
    OFFLINE_ICONIC_BUMPKIN_TOKENS[
      Math.floor(Math.random() * OFFLINE_ICONIC_BUMPKIN_TOKENS.length)
    ];
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // ignore
  }
  return token;
}

export function bumpkinTextureKeyForToken(token: string): string {
  return `bumpkin_${token}`;
}
