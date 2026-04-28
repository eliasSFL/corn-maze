import maze1 from "../assets/map/maze1.json";
import maze2 from "../assets/map/maze2.json";
import maze3 from "../assets/map/maze3.json";
import maze4 from "../assets/map/maze4.json";
import maze5 from "../assets/map/maze5.json";
import maze6 from "../assets/map/maze6.json";
import maze7 from "../assets/map/maze7.json";
import maze8 from "../assets/map/maze8.json";
import maze9 from "../assets/map/maze9.json";
import maze13 from "../assets/map/maze13.json";

// 10 unique maps across the original 13-week Witches' Eve season: days 10-12
// reuse maps 1-3 (weeks 10-12 in the original), and day 13 is the one-off
// Halloween maze. Repurposed as a daily rotation for the portal.
export const CORN_MAZES: Record<number, unknown> = {
  1: maze1,
  2: maze2,
  3: maze3,
  4: maze4,
  5: maze5,
  6: maze6,
  7: maze7,
  8: maze8,
  9: maze9,
  10: maze1,
  11: maze2,
  12: maze3,
  13: maze13,
};

export const TOTAL_MAZE_DAYS = 13;

/**
 * Picks the maze day for today. Cycles through days 1-13 on a daily cadence —
 * same day for all attempts started on the same UTC day, advances to the next
 * at UTC midnight.
 */
export function getCurrentMazeDay(now: number = Date.now()): number {
  const dayIndex = Math.floor(now / 86_400_000);
  return (dayIndex % TOTAL_MAZE_DAYS) + 1;
}
