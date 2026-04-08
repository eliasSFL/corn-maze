/** Base URL for panel / button border images (PNG). Override with VITE_IMAGE_BASE_URL. */
export function imageBaseUrl(): string {
  const raw =
    import.meta.env.VITE_IMAGE_BASE_URL ||
    "https://sunflower-land.com/testnet-assets";
  return raw.replace(/\/$/, "");
}

export const UI_IMAGES = {
  primaryButton: `${imageBaseUrl()}/ui/light_button.png`,
  primaryButtonPressed: `${imageBaseUrl()}/ui/light_button_pressed.png`,
  selectBox: `${imageBaseUrl()}/ui/select_box.png`,
  grayBorder: `${imageBaseUrl()}/ui/panel/gray_border.png`,
  orangeBorder: `${imageBaseUrl()}/ui/panel/orange_border.png`,
  redBorder: `${imageBaseUrl()}/ui/panel/danger_border.png`,
  blueBorder: `${imageBaseUrl()}/ui/panel/blue_border.png`,
  formulaBorder: `${imageBaseUrl()}/ui/panel/formula_border.png`,
  calmBorder: `${imageBaseUrl()}/ui/panel/calm_border.png`,
  vibrantBorder: `${imageBaseUrl()}/ui/panel/vibrant_border.png`,
  lightBorder: `${imageBaseUrl()}/ui/panel/light_border.png`,
  darkBorder: `${imageBaseUrl()}/ui/panel/dark_border.png`,
  greenBorder: `${imageBaseUrl()}/ui/panel/green_border.png`,
  speechBubbleBorder: `${imageBaseUrl()}/ui/speech_bubble.webp`,
} as const;
