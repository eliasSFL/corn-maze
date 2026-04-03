/**
 * Portal login JWT includes top-level `farmId` and `portalId` (see API `portals/login`).
 * Some tokens nest fields under `properties`; merge for compatibility.
 */
export function decodePortalToken(token: string): {
  farmId?: number;
  portalId?: string;
} {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return {};
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = payload.length % 4;
    const padded = pad ? payload + "=".repeat(4 - pad) : payload;
    const json = atob(padded);
    const decoded = JSON.parse(json) as Record<string, unknown> & {
      properties?: Record<string, unknown>;
    };
    const merged = {
      ...decoded,
      ...(typeof decoded.properties === "object" && decoded.properties !== null
        ? decoded.properties
        : {}),
    } as Record<string, unknown>;
    const farmRaw = merged.farmId;
    const farmId =
      typeof farmRaw === "number"
        ? farmRaw
        : typeof farmRaw === "string"
          ? Number(farmRaw)
          : undefined;
    const p = merged.portalId;
    const portalId =
      typeof p === "string" && p.trim().length > 0 ? p.trim() : undefined;
    return {
      farmId: Number.isFinite(farmId) ? farmId : undefined,
      portalId,
    };
  } catch {
    return {};
  }
}
