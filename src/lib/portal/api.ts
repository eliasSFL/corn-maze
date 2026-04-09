import type { MinigameSessionResponse, MinigameActionResponse } from "./types";
import { PLAYER_ECONOMY_GENERATOR_COLLECTED_ACTION } from "./playerEconomyTypes";
import { getMinigamesApiUrl } from "./url";

export async function getPlayerEconomySession({
  token,
}: {
  token: string;
}): Promise<MinigameSessionResponse> {
  const base = getMinigamesApiUrl();
  if (!base) {
    throw new Error(
      "No Minigames API URL (set VITE_MINIGAMES_API_URL or pass minigamesApiUrl=…)",
    );
  }

  const url = new URL("/data", `${base}/`);
  url.searchParams.set("type", "session");

  const response = await window.fetch(url.toString(), {
    method: "GET",
    headers: {
      "content-type": "application/json;charset=UTF-8",
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const bodyText = await response.text();
  let parsed: { data?: MinigameSessionResponse; error?: string } = {};
  try {
    parsed = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    throw new Error(bodyText || `Invalid JSON (${response.status})`);
  }

  if (response.status >= 400) {
    throw new Error(
      typeof parsed.error === "string"
        ? parsed.error
        : bodyText || `Minigame session ${response.status}`,
    );
  }

  if (!parsed.data) {
    throw new Error("Invalid session response (missing data)");
  }

  return parsed.data;
}

/**
 * Minigames `POST /action`:
 * - `{ itemId }` → `{ "type": "generator.collected", "itemId" }` (finish a generator job).
 * - `{ action, amounts? }` → `{ "type": "minigame.action", "action", "amounts"? }` (named economy action).
 */
export async function postPlayerEconomyAction(
  params:
    | { token: string; itemId: string }
    | { token: string; action: string; amounts?: Record<string, number> },
): Promise<MinigameActionResponse> {
  const base = getMinigamesApiUrl();
  if (!base) {
    throw new Error(
      "No Minigames API URL (set VITE_MINIGAMES_API_URL or pass minigamesApiUrl=…)",
    );
  }

  const { token, ...rest } = params;
  const body =
    "itemId" in rest
      ? (() => {
          const itemId = rest.itemId.trim();
          if (!itemId) {
            throw new Error("itemId is required for generator.collected");
          }
          return {
            type: PLAYER_ECONOMY_GENERATOR_COLLECTED_ACTION,
            itemId,
          };
        })()
      : {
          type: "minigame.action" as const,
          action: rest.action,
          ...(rest.amounts !== undefined ? { amounts: rest.amounts } : {}),
        };

  const response = await window.fetch(`${base}/action`, {
    method: "POST",
    headers: {
      "content-type": "application/json;charset=UTF-8",
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const bodyText = await response.text();
  let envelope: {
    data?: MinigameActionResponse;
    error?: string;
  } = {};
  try {
    envelope = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    throw new Error(bodyText || `Invalid JSON (${response.status})`);
  }

  if (response.status >= 400) {
    throw new Error(envelope.error || `Action failed (${response.status})`);
  }

  if (!envelope.data) {
    throw new Error("Invalid action response (missing data)");
  }

  return envelope.data;
}
