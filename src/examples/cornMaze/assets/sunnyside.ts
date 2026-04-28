/**
 * CDN URL helpers for Chicken Rescue only (paths match main-game PROTECTED_IMAGE_URL layout).
 */
import { CONFIG } from "lib/config";

const B = () => CONFIG.PROTECTED_IMAGE_URL;

export const SUNNYSIDE = {
  icons: {
    expression_alerted: `${B()}/icons/expression_alerted.png`,
    expression_confused: `${B()}/icons/expression_confused.png`,
    close: `${B()}/icons/close.png`,
    arrow_left: `${B()}/icons/arrow_left.png`,
    basket: `${B()}/icons/basket.png`,
    confirm: `${B()}/icons/confirm.png`,
    timer: `${B()}/icons/timer.png`,
    hammer: `${B()}/icons/hammer.png`,
    disc: `${B()}/icons/disc.png`,
    heart: `${B()}/icons/heart.png`,
    sad: `${B()}/icons/sad.png`,
    happy: `${B()}/icons/happy.png`,
    search: `${B()}/icons/search.png`,
  },
  decorations: {
    skull: `${B()}/decorations/skull.webp`,
  },
  npcs: {
    bumpkin: `${B()}/npcs/idle.gif`,
  },
  resource: {
    stone_rock: `${B()}/resources/stone_rock.png`,
    boulder: `${B()}/resources/rare_mine.png`,
  },
  ui: {
    round_button: `${B()}/ui/round_button.png`,
    round_button_pressed: `${B()}/ui/round_button_pressed.png`,
  },
} as const;
