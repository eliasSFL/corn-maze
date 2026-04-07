import type { Scene } from "phaser";

/** `wolf.webp` strip: 1144×44 → 26 frames of 44×44 (1–9 idle, 10–18 sleep, 19–26 walk). */
export const WOLF_FRAME = { width: 44, height: 44 } as const;

export const WOLF_ANIM_IDLE = "hide_seek_wolf_idle";
export const WOLF_ANIM_SLEEP = "hide_seek_wolf_sleep";
export const WOLF_ANIM_WALK = "hide_seek_wolf_walk";

/** 1-based frame ranges → zero-based Phaser frame indices. */
const IDLE = { start: 0, end: 8 };
const SLEEP = { start: 9, end: 17 };
const WALK = { start: 18, end: 25 };

export function registerWolfAnimations(scene: Scene): void {
  if (scene.anims.exists(WOLF_ANIM_IDLE)) return;

  scene.anims.create({
    key: WOLF_ANIM_IDLE,
    frames: scene.anims.generateFrameNumbers("wolf", IDLE),
    frameRate: 8,
    repeat: -1,
  });

  scene.anims.create({
    key: WOLF_ANIM_SLEEP,
    frames: scene.anims.generateFrameNumbers("wolf", SLEEP),
    frameRate: 8,
    repeat: -1,
  });

  scene.anims.create({
    key: WOLF_ANIM_WALK,
    frames: scene.anims.generateFrameNumbers("wolf", WALK),
    frameRate: 14,
    repeat: -1,
  });
}
