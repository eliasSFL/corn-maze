import type { CSSProperties } from "react";
import grassBackgroundUrl from "example-assets/brand/grass_background_2.png";

/**
 * CSS pixels per logical "game pixel" for Chicken Rescue home background.
 */
export const CHICKEN_RESCUE_HOME_PIXEL_SCALE = 2.1;

/** Logical width in game pixels — shared chook display (e.g. in-game NPCs). */
export const CHICKEN_HOME_COIN_CHICKEN_GAME_PX = 44;

/** `grass_background_2.png` intrinsic size (px); texture is square. */
export const GRASS_TILE_SRC_PX = 64;

/**
 * Home layout: CSS width/height = {@link CHICKEN_RESCUE_HOME_PIXEL_SCALE} × game pixels.
 */
export function chickenHomeWidthPx(gamePixels: number): number {
  return CHICKEN_RESCUE_HOME_PIXEL_SCALE * gamePixels;
}

export function grassTileSizePx(
  scale: number = CHICKEN_RESCUE_HOME_PIXEL_SCALE,
): number {
  return GRASS_TILE_SRC_PX * scale;
}

/**
 * Hero chook / shared chicken width (same game-pixel width as legacy home coin chickens).
 */
export function chookDisplayWidthPx(
  scale: number = CHICKEN_RESCUE_HOME_PIXEL_SCALE,
): number {
  return CHICKEN_HOME_COIN_CHICKEN_GAME_PX * scale;
}

export function chickenRescueHomeRootStyle(
  scale: number = CHICKEN_RESCUE_HOME_PIXEL_SCALE,
): CSSProperties {
  const tile = grassTileSizePx(scale);
  return {
    backgroundImage: `url(${grassBackgroundUrl})`,
    backgroundRepeat: "repeat",
    backgroundPosition: "top left",
    backgroundSize: `${tile}px ${tile}px`,
    imageRendering: "pixelated",
  };
}
