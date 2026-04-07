import { atom } from "nanostores";
import type { PlayerProfile } from "lib/api";

/** Shared client state for React + Phaser (see docs/TECHNICAL.md). */
export type GameState = {
  coins: number;
  /** Hide & Seek (and similar) scoring. */
  skulls: number;
  anonymous: boolean;
};

export const $gameState = atom<GameState>({
  coins: 0,
  skulls: 0,
  anonymous: true,
});

export function hydrateGameState(profile: PlayerProfile): void {
  $gameState.set({
    ...$gameState.get(),
    coins: profile.coins,
    skulls: profile.skulls ?? $gameState.get().skulls,
    anonymous: profile.anonymous,
  });
}

export function patchGameState(partial: Partial<GameState>): void {
  $gameState.set({ ...$gameState.get(), ...partial });
}
