import type { NavigateFunction } from "react-router-dom";
import { CONFIG } from "lib/config";

/**
 * Close the portal/minigame. Posts a message to the parent frame when embedded,
 * navigates in-app when a `navigate` function is supplied, or falls back to a
 * full-page redirect to `VITE_PORTAL_GAME_URL`.
 */
export function closePortal(navigate?: NavigateFunction) {
  if (window.self !== window.top) {
    window.parent.postMessage({ event: "closePortal" }, "*");
    return;
  }

  if (navigate) {
    navigate("/home", { replace: true });
    return;
  }

  const url = CONFIG.PORTAL_GAME_URL?.replace(/\/$/, "") || "https://sunflower-land.com";
  window.location.href = url;
}
