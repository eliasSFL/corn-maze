import { postPlayerEconomyAction } from "lib/portal/api";
import { decodePortalToken } from "lib/portal/decodePortalToken";
import { CONFIG } from "lib/config";
import { getJwt } from "lib/portal/url";

const SESSION_GAMEOVER_KEY = "hideSeek.bumpkinHunter.gameOverActionPosted";

/** Cleared when a new round is prepared so win or loss can POST GAMEOVER once per run. */
export function clearBumpkinHunterGameOverSessionFlag(): void {
  try {
    sessionStorage.removeItem(SESSION_GAMEOVER_KEY);
  } catch {
    // ignore
  }
}

/** Returns true if we should POST GAMEOVER (guards duplicate modals / React Strict Mode). */
export function markBumpkinHunterGameOverPosting(): boolean {
  try {
    if (sessionStorage.getItem(SESSION_GAMEOVER_KEY)) return false;
    sessionStorage.setItem(SESSION_GAMEOVER_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

/** Matches minigame editor action id for bumpkin-hunter. */
export const BUMPKIN_HUNTER_GAMEOVER_ACTION = "GAMEOVER";

/** `mainCurrencyToken` / skull item id from minigame config. */
export const BUMPKIN_HUNTER_MAIN_ITEM_ID = "0";

/**
 * Notify the portal API that the run ended so the server can apply GAMEOVER mint rules.
 * No-op without JWT + portal id (e.g. local dev).
 */
export async function postBumpkinHunterGameOver(): Promise<void> {
  const jwt = getJwt();
  if (!jwt) return;

  const { portalId: fromJwt } = decodePortalToken(jwt);
  const portalId = fromJwt ?? (CONFIG.PORTAL_APP ?? "").trim();
  if (!portalId) return;

  await postPlayerEconomyAction({
    portalId,
    token: jwt,
    action: BUMPKIN_HUNTER_GAMEOVER_ACTION,
    itemId: BUMPKIN_HUNTER_MAIN_ITEM_ID,
  });
}
