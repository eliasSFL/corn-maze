import { atom, computed } from "nanostores";

import { TOTAL_MAZE_DAYS, getCurrentMazeDay } from "./mazes";

export const MAZE_TIME_LIMIT_SECONDS = 3 * 60;
export const DEFAULT_HEALTH = 3;
/** Every map ships exactly 25 crows in its `Crows` tile layer. */
export const TOTAL_CROWS = 25;

export type CornMazeMode =
  | "ready"
  | "playing"
  | "confirmingExit"
  | "gameover";

export interface CornMazeState {
  mode: CornMazeMode;
  score: number;
  health: number;
  crowIds: string[];
  startedAt: number;
  timeElapsed: number;
  /** Set on entering `confirmingExit`; used to roll `startedAt` forward by the
   * pause duration when the player chooses to keep playing. */
  pausedAt?: number;
  /** Beta map selector override — undefined = use `getCurrentMazeDay()`. */
  selectedDay?: number;
}

const INITIAL: CornMazeState = {
  mode: "ready",
  score: 0,
  health: DEFAULT_HEALTH,
  crowIds: [],
  startedAt: 0,
  timeElapsed: 0,
};

export const $cornMazeState = atom<CornMazeState>(INITIAL);

export const $activeDay = computed($cornMazeState, (s) =>
  s.selectedDay ?? getCurrentMazeDay(),
);

const update = (patch: Partial<CornMazeState>) =>
  $cornMazeState.set({ ...$cornMazeState.get(), ...patch });

const resetAttempt = () =>
  update({
    score: 0,
    health: DEFAULT_HEALTH,
    crowIds: [],
    startedAt: 0,
    timeElapsed: 0,
    pausedAt: undefined,
  });

/** Player dismissed the tips modal and is starting a fresh attempt. */
export function startAttempt() {
  resetAttempt();
  update({ mode: "playing", startedAt: Date.now() });
}

/** Tick handler — called once a second by the scene's setInterval. */
export function tick() {
  const s = $cornMazeState.get();
  if (s.mode !== "playing") return;
  const elapsed = Math.max(
    0,
    Math.floor((Date.now() - s.startedAt) / 1000),
  );
  // Auto-gameover on time / lives / all crows.
  if (
    s.health <= 0 ||
    elapsed >= MAZE_TIME_LIMIT_SECONDS ||
    s.score >= TOTAL_CROWS
  ) {
    update({ timeElapsed: elapsed, mode: "gameover" });
    return;
  }
  update({ timeElapsed: elapsed });
}

export function collectCrow(crowId: string) {
  const s = $cornMazeState.get();
  if (s.mode !== "playing") return;
  const nextScore = s.score + 1;
  const nextCrowIds = [...s.crowIds, crowId];
  if (nextScore >= TOTAL_CROWS) {
    update({ score: nextScore, crowIds: nextCrowIds, mode: "gameover" });
    return;
  }
  update({ score: nextScore, crowIds: nextCrowIds });
}

export function hitEnemy() {
  const s = $cornMazeState.get();
  if (s.mode !== "playing") return;
  const nextHealth = Math.max(0, s.health - 1);
  if (nextHealth <= 0) {
    update({ health: 0, mode: "gameover" });
    return;
  }
  update({ health: nextHealth });
}

/** Player hit Luna at the portal mid-run with time + lives left. */
export function portalHit() {
  const s = $cornMazeState.get();
  if (s.mode !== "playing") return;
  update({ mode: "confirmingExit", pausedAt: Date.now() });
}

/** Confirm-exit modal: leave now, lock in score. */
export function confirmExit() {
  const s = $cornMazeState.get();
  if (s.mode !== "confirmingExit") return;
  update({ mode: "gameover", pausedAt: undefined });
}

/** Confirm-exit modal: keep playing — adjust `startedAt` so the timer resumes
 * with the elapsed time the player had when they paused. */
export function cancelExit() {
  const s = $cornMazeState.get();
  if (s.mode !== "confirmingExit") return;
  const pauseDuration = Date.now() - (s.pausedAt ?? Date.now());
  update({
    mode: "playing",
    startedAt: s.startedAt + pauseDuration,
    pausedAt: undefined,
  });
}

/** Game over → ready: pop the player back to the tips modal for a new attempt. */
export function retry() {
  const s = $cornMazeState.get();
  if (s.mode !== "gameover") return;
  resetAttempt();
  update({ mode: "ready" });
}

export function selectDay(day: number | undefined) {
  if (day !== undefined && (day < 1 || day > TOTAL_MAZE_DAYS)) return;
  update({ selectedDay: day });
}
