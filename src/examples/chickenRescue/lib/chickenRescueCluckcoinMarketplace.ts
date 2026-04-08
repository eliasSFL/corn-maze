import { CONFIG } from "lib/config";

/**
 * Opens Sunflower Land marketplace for Golden Nugget (minigame tradeable). Set
 * `VITE_CLUCKCOIN_MARKETPLACE_RESOURCE_ID` to the resources collection id when
 * the tradeable exists; otherwise opens the resources marketplace index.
 */
export function openCluckcoinMarketplace(): void {
  const base = CONFIG.PORTAL_GAME_URL.replace(/\/$/, "");
  const resourceId = (
    import.meta.env.VITE_CLUCKCOIN_MARKETPLACE_RESOURCE_ID as string | undefined
  )?.trim();
  const path = resourceId
    ? `/marketplace/resources/${resourceId}`
    : "/marketplace/resources";
  const url = `${base}${path}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
