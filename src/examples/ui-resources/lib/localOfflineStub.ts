import type { MinigameSessionEconomyMeta } from "lib/portal/types";
import type { MinigameSessionResponse } from "lib/portal/types";
import { emptySessionMinigame } from "lib/portal/runtimeHelpers";
import { uiResourcesDemoItemImages } from "./cdnItemImages";

/** Editor-ready single JSON: `examples/ui-resources/ui-resources-editor-sample.json` */

const day = () => new Date().toISOString().slice(0, 10);

function demoItems(): MinigameSessionEconomyMeta["items"] {
  const img = uiResourcesDemoItemImages();
  return {
    COIN: {
      name: "Coins",
      description: "Spend in the shop.",
      tradeable: true,
      id: 0,
      image: img.COIN,
    },
    SEED: {
      name: "Seeds",
      description: "Buy here, then plant at the plot.",
      image: img.SEED,
    },
    PLOT: {
      name: "Crop plot",
      description: "Your field slot — one active grow job per plot you own.",
      generator: true,
      image: img.PLOT,
    },
    CROP: {
      name: "Harvest",
      description: "Collect when the timer finishes.",
      image: img.CROP,
    },
  };
}

/** Tiny offline economy so the dashboard renders without a Minigames API. */
export function buildUiResourcesOfflineEconomyMeta(): MinigameSessionEconomyMeta {
  return {
    descriptions: {
      title: "UI Resources (demo)",
      subtitle: "Buy seeds → plant → collect. Set VITE_MINIGAMES_API_URL for a live session.",
      welcome:
        "You start with coins and one crop plot. Open the shop, buy seeds, tap the plot to plant, wait for the timer, then collect your harvest. Icons load from your image CDN (VITE_PRIVATE_IMAGE_URL / VITE_IMAGE_BASE_URL).",
    },
    items: demoItems(),
  };
}

export const UI_RESOURCES_OFFLINE_ACTIONS: Record<string, unknown> = {
  buy_seed: {
    type: "shop",
    showInShop: true,
    burn: { COIN: { amount: 2 } },
    mint: { SEED: { amount: 3 } },
  },
  plant: {
    type: "generator",
    showInShop: false,
    burn: { SEED: { amount: 1 } },
    produce: {
      CROP: {
        msToComplete: 10_000,
        requires: "PLOT",
      },
    },
    collect: {
      CROP: { amount: 2, seconds: 10 },
    },
  },
};

export function createUiResourcesOfflinePlayerEconomy(): MinigameSessionResponse["playerEconomy"] {
  const base = emptySessionMinigame();
  return {
    ...base,
    balances: { COIN: 30, PLOT: 1, SEED: 0, CROP: 0 },
    activity: 1,
    dailyActivity: { date: day(), count: 0 },
  };
}
