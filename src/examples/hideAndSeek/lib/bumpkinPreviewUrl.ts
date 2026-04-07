/** Spritesheet URL for bumpkin idle/walk (same path as `BumpkinContainer`). */
export function bumpkinSpritesheetUrl(tokenParts: string): string {
  const raw =
    import.meta.env.VITE_ANIMATION_URL ||
    "https://animations-dev.sunflower-land.com";
  const base = raw.replace(/\/$/, "");
  return `${base}/animate/0_v1_${tokenParts}/idle_walking_dig_drilling`;
}
