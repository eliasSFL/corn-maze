/**
 * World resources & materials for inventories, crafting rows, reward popups.
 * Source: `images` repo → `assets/resources/` (bundled via `@sl-assets` alias).
 */
import acorn from "@sl-assets/resources/acorn.webp";
import beeHive from "@sl-assets/resources/bee_hive.png";
import diamond from "@sl-assets/resources/diamond.png";
import fish from "@sl-assets/resources/fish.png";
import goldSmall from "@sl-assets/resources/gold_small.png";
import ironSmall from "@sl-assets/resources/iron_small.png";
import plot from "@sl-assets/resources/plot.png";
import stoneSmall from "@sl-assets/resources/stone_small.png";
import wildMushroom from "@sl-assets/resources/wild_mushroom.png";
import wood from "@sl-assets/resources/wood.png";

export const RESOURCE_CONFIG = {
  /** Basic building material */
  wood: { url: wood, description: "Wood resource" },
  /** Early stone tier */
  stone: { url: stoneSmall, description: "Small stone / rock chip" },
  /** Smelted metal tier */
  iron: { url: ironSmall, description: "Small iron ingot" },
  /** Premium currency rock */
  gold: { url: goldSmall, description: "Small gold piece" },
  /** Rare gem sink */
  diamond: { url: diamond, description: "Diamond" },
  /** Fishing / food ingredient */
  fish: { url: fish, description: "Fish resource" },
  /** Farm plot / land token */
  plot: { url: plot, description: "Land plot" },
  /** Forage / potion ingredient */
  mushroom: { url: wildMushroom, description: "Wild mushroom" },
  /** Seasonal forage (webp) */
  acorn: { url: acorn, description: "Acorn" },
  /** Bee production building drop */
  beeHive: { url: beeHive, description: "Bee hive" },
} as const;

export type ResourceName = keyof typeof RESOURCE_CONFIG;
