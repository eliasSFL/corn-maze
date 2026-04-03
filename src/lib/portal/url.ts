import { CONFIG } from "lib/config";

const PORTAL_JWT_STORAGE_KEY = "sunflower_land_portal_jwt";
const PORTAL_API_ORIGIN_STORAGE_KEY = "sunflower_land_portal_api_origin";

function normalizeApiBase(url: string): string {
  return url.replace(/\/$/, "");
}

function isAllowedApiHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h.endsWith(".sunflower-land.com") ||
    h === "sunflower-land.com"
  );
}

/** Validates `apiUrl` query value; returns normalised origin only (no path). */
function parseApiUrlParam(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    if (!isAllowedApiHostname(parsed.hostname)) {
      return undefined;
    }
    return normalizeApiBase(parsed.origin);
  } catch {
    return undefined;
  }
}

function readPersistedApiOrigin(): string | undefined {
  try {
    const stored = sessionStorage.getItem(PORTAL_API_ORIGIN_STORAGE_KEY);
    if (!stored?.trim()) return undefined;
    return parseApiUrlParam(stored);
  } catch {
    return undefined;
  }
}

function persistPortalApiOrigin(origin: string) {
  try {
    sessionStorage.setItem(
      PORTAL_API_ORIGIN_STORAGE_KEY,
      normalizeApiBase(origin),
    );
  } catch {
    // private mode / quota
  }
}

/**
 * Resolves the Sunflower Land API base URL for portal/minigame requests.
 * 1. `apiUrl` query param (from parent iframe) when valid — persisted in sessionStorage
 *    under `sunflower_land_portal_api_origin`.
 * 2. Previously persisted origin from an earlier load.
 * 3. `network` query param (`mainnet` → prod API, else dev) — also persisted so SPA
 *    navigations match JWT behaviour (parent always sends `network`; may omit `apiUrl`).
 * 4. Build-time `CONFIG.API_URL` fallback.
 */
export const getUrl = () => {
  const params = new URLSearchParams(window.location.search);

  if (params.has("apiUrl")) {
    const raw = params.get("apiUrl") ?? "";
    const fromQuery = parseApiUrlParam(raw);
    if (fromQuery) {
      persistPortalApiOrigin(fromQuery);
      return fromQuery;
    }
    if (raw.trim() === "") {
      try {
        sessionStorage.removeItem(PORTAL_API_ORIGIN_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }

  const persisted = readPersistedApiOrigin();
  if (persisted) {
    return persisted;
  }

  const network = params.get("network")?.toLowerCase() ?? "";

  if (network === "mainnet") {
    const base = "https://api.sunflower-land.com";
    persistPortalApiOrigin(base);
    return base;
  }

  if (network) {
    const base = "https://api-dev.sunflower-land.com";
    persistPortalApiOrigin(base);
    return base;
  }

  return typeof CONFIG.API_URL === "string"
    ? normalizeApiBase(CONFIG.API_URL)
    : CONFIG.API_URL;
};

/**
 * Portal JWT: read from `?jwt=` when present (and persist to sessionStorage),
 * otherwise reuse the last token from this tab so refresh and client-side
 * navigation without the query string stay authorised.
 */
export const getJwt = (): string | null => {
  const params = new URLSearchParams(window.location.search);

  if (params.has("jwt")) {
    const fromUrl = params.get("jwt") ?? "";
    try {
      if (fromUrl) {
        sessionStorage.setItem(PORTAL_JWT_STORAGE_KEY, fromUrl);
      } else {
        sessionStorage.removeItem(PORTAL_JWT_STORAGE_KEY);
      }
    } catch {
      // private mode / quota
    }
    return fromUrl || null;
  }

  try {
    const stored = sessionStorage.getItem(PORTAL_JWT_STORAGE_KEY);
    return stored && stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
};

/** Clears the tab-scoped API origin from `?apiUrl=` (e.g. with `?apiUrl=` empty). */
export const clearPersistedPortalApiOrigin = () => {
  try {
    sessionStorage.removeItem(PORTAL_API_ORIGIN_STORAGE_KEY);
  } catch {
    // ignore
  }
};

/** Clears the tab-scoped portal JWT (e.g. after explicit logout or `?jwt=`). */
export const clearPersistedPortalJwt = () => {
  try {
    sessionStorage.removeItem(PORTAL_JWT_STORAGE_KEY);
  } catch {
    // ignore
  }
};
