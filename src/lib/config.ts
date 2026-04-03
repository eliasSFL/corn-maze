/**
 * Build-time portal / API settings (mirrors Chicken Rescue `lib/config` subset).
 */
const API_URL = import.meta.env.VITE_API_URL as string | undefined;
const PORTAL_APP = import.meta.env.VITE_PORTAL_APP as string | undefined;
const PORTAL_GAME_URL = import.meta.env.VITE_PORTAL_GAME_URL as string | undefined;
const ANIMATION_URL = import.meta.env.VITE_ANIMATION_URL as string | undefined;

export const CONFIG = {
  API_URL,
  PORTAL_APP,
  PORTAL_GAME_URL,
  ANIMATION_URL,
};
