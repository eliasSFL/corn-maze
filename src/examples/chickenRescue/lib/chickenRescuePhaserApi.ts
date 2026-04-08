import type { MutableRefObject } from "react";

export type ChickenRescueRescueMeta = {
  /** Advanced run: rescued a golden chook (counts toward ADVANCED_GAMEOVER token `"2"`). */
  golden?: boolean;
};

/** Live handlers Phaser reads via ref (updated each React render). */
export type ChickenRescuePhaserHandlers = {
  getScore: () => number;
  onChickenRescued: (points: number, meta?: ChickenRescueRescueMeta) => void;
  onGameOver: () => void;
};

export type ChickenRescuePhaserApiRef = MutableRefObject<ChickenRescuePhaserHandlers>;

export const defaultPhaserHandlers = (): ChickenRescuePhaserHandlers => ({
  getScore: () => 0,
  onChickenRescued: () => {},
  onGameOver: () => {},
});
