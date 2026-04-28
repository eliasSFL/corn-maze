/**
 * Golden Crops economy configuration.
 *
 * All actions are watering-based. The loop:
 *  1. Claim Watering Cans from NPC 1 (or NPC 3 if you get past the gate).
 *  2. Water Giant/Golden crops for instant Coins.
 *  3. Water a plot → wait for growth → come back and harvest for Coins.
 *  4. Spend Coins at the shop on a Trophy.
 *  5. Show the Trophy to the gated NPC for a cache of Watering Cans.
 */

import type { EconomyActionDefinition } from "lib/portal/playerEconomyTypes";
import type { PlayerEconomyBalanceItem } from "lib/portal/playerEconomyTypes";

// ── Items ────────────────────────────────────────────────────────────────────

export const GOLDEN_CROPS_ITEMS: Record<string, PlayerEconomyBalanceItem> = {
  "watering-can": {
    name: "Watering Can",
    description: "Used to water crops and plots. Claim from the NPC daily.",
    initialBalance: 5,
  },
  coin: {
    name: "Coin",
    description: "Earned by watering crops. Spend at the shop.",
    tradeable: true,
    id: 0,
    initialBalance: 0,
  },
  /**
   * Grown in plots via the `water.plot` generator.
   * One "wet plot" job produces one Coin after the grow timer.
   */
  "wet-plot": {
    name: "Wet Plot",
    description: "A plot you've watered. Comes back later to harvest coins.",
    generator: true,
    initialBalance: 0,
  },
  trophy: {
    name: "Crop Master Trophy",
    description: "A prestigious award for dedicated farmers.",
    initialBalance: 0,
  },
};

// ── Actions ──────────────────────────────────────────────────────────────────

const HOUR = 3600;

export const GOLDEN_CROPS_ACTIONS: Record<string, EconomyActionDefinition> = {
  /**
   * NPC 1: Claim 5 Watering Cans (24h cooldown).
   */
  "claim.watering-cans": {
    type: "custom",
    cooldownSeconds: 24 * HOUR,
    mint: {
      "watering-can": { amount: 5 },
    },
  },

  /**
   * Golden Cauliflower: 1 Watering Can → 1 Coin (instant).
   */
  "water.cauliflower": {
    type: "custom",
    burn: {
      "watering-can": { amount: 1 },
    },
    mint: {
      coin: { amount: 1 },
    },
  },

  /**
   * Giant Kale (loot box): 1 Watering Can → 0 or 5 Coins.
   * Ranged mint — the client passes `amounts: { coin: N }`.
   */
  "water.kale": {
    type: "custom",
    burn: {
      "watering-can": { amount: 1 },
    },
    mint: {
      coin: { min: 0, max: 5, dailyCap: 1000 },
    },
  },

  /**
   * Plot: 1 Watering Can → starts a 10s generator that produces 5 Coins.
   * Short duration + chunky payout so the loop is snappy for the demo.
   */
  "water.plot": {
    type: "generator",
    burn: {
      "watering-can": { amount: 1 },
    },
    produce: {
      "wet-plot": { limit: 3 }, // max 3 concurrent plots
    },
    collect: {
      coin: { amount: 5, seconds: 10 },
    },
  },

  /**
   * Shop: buy a Trophy for 10 Coins.
   */
  "buy.trophy": {
    type: "shop",
    showInShop: true,
    burn: {
      coin: { amount: 10 },
    },
    mint: {
      trophy: { amount: 1 },
    },
  },

};
