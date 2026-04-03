import type { MinigameSessionResponse, MinigameActionResponse } from "./types";
import { getUrl } from "./url";

export async function getPlayerEconomySession({
  portalId,
  token,
}: {
  portalId: string;
  token: string;
}): Promise<MinigameSessionResponse> {
  const base = getUrl();
  if (!base) {
    throw new Error("No API URL");
  }

  const response = await window.fetch(
    `${base}/portal/${portalId}/player-economy`,
    {
      method: "GET",
      headers: {
        "content-type": "application/json;charset=UTF-8",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.status >= 400) {
    const text = await response.text();
    throw new Error(text || `Minigame session ${response.status}`);
  }

  return response.json();
}

export async function postPlayerEconomyAction({
  portalId,
  token,
  action,
  itemId,
  amounts,
}: {
  portalId: string;
  token: string;
  action: string;
  itemId?: string;
  amounts?: Record<string, number>;
}): Promise<MinigameActionResponse> {
  const base = getUrl();
  if (!base) {
    throw new Error("No API URL");
  }

  const response = await window.fetch(
    `${base}/portal/${portalId}/player-economy/action`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json;charset=UTF-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action,
        ...(itemId !== undefined ? { itemId } : {}),
        ...(amounts !== undefined ? { amounts } : {}),
      }),
    },
  );

  const bodyText = await response.text();
  let data: { error?: string } & Partial<MinigameActionResponse> = {};
  try {
    data = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    throw new Error(bodyText || `Invalid JSON (${response.status})`);
  }

  if (response.status >= 400) {
    throw new Error(data.error || `Action failed (${response.status})`);
  }

  return data as MinigameActionResponse;
}
