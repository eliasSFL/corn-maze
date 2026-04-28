import React from "react";
import { useStore } from "@nanostores/react";

import { HudContainer } from "components/ui/HudContainer";
import { Label } from "components/ui/Label";
import { SUNNYSIDE } from "example-assets/sunnyside";
import crowIcon from "../assets/icons/crow_without_shadow.png";

import {
  $cornMazeState,
  DEFAULT_HEALTH,
  MAZE_TIME_LIMIT_SECONDS,
  TOTAL_CROWS,
} from "../lib/cornMazeStore";

const formatTime = (seconds: number) => {
  if (seconds <= 0) return "Time's up!";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const CornMazeHUD: React.FC = () => {
  const state = useStore($cornMazeState);
  const timeLeft = Math.max(0, MAZE_TIME_LIMIT_SECONDS - state.timeElapsed);
  const showTimer =
    state.mode === "playing" || state.mode === "confirmingExit";
  const runningOut = showTimer && timeLeft > 0 && timeLeft < 25;

  return (
    <HudContainer>
      {/* Hearts — top-left */}
      <div
        className="absolute flex gap-1"
        style={{ left: 12, top: 12 }}
        aria-label="lives"
      >
        {Array.from({ length: DEFAULT_HEALTH }).map((_, i) => (
          <img
            key={i}
            src={SUNNYSIDE.icons.heart}
            style={{ width: 28, opacity: i < state.health ? 1 : 0.25 }}
            alt=""
          />
        ))}
      </div>

      {/* Score (crow count / 25) — top-centre */}
      {(state.mode === "playing" || state.mode === "gameover" ||
        state.mode === "confirmingExit") && (
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: 12 }}
          aria-label="score"
        >
          <Label type="default">
            <div className="flex items-center gap-1 px-1">
              <img src={crowIcon} alt="" className="w-4" />
              <span>{`${state.score} / ${TOTAL_CROWS}`}</span>
            </div>
          </Label>
        </div>
      )}

      {/* Timer — bottom-right */}
      {showTimer && (
        <div className="absolute" style={{ right: 12, bottom: 12 }}>
          <Label type={runningOut || timeLeft === 0 ? "danger" : "info"}>
            <div className="flex items-center gap-1 px-1">
              <img src={SUNNYSIDE.icons.timer} alt="" className="w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </Label>
        </div>
      )}
    </HudContainer>
  );
};
