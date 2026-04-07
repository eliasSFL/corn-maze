import type Phaser from "phaser";

type SeekScene = Phaser.Scene & { clearSeekEncounterState: () => void };

let scene: SeekScene | null = null;

export function registerHideAndSeekPhaserScene(s: Phaser.Scene): void {
  scene = s as SeekScene;
}

export function unregisterHideAndSeekPhaserScene(): void {
  scene = null;
}

export function resumeHideAndSeekPhaserPhysics(): void {
  scene?.clearSeekEncounterState();
}
