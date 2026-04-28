import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@nanostores/react";

import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { CONFIG } from "lib/config";

import {
  $cornMazeState,
  selectDay,
  startAttempt,
  TOTAL_CROWS,
} from "./lib/cornMazeStore";
import { TOTAL_MAZE_DAYS, getCurrentMazeDay } from "./lib/mazes";

/**
 * Landing page — the rules + "Let's go!" entry into a fresh attempt.
 * Tapping the button transitions the store into `playing` AND navigates
 * to /game so the Phaser scene mounts already-running.
 */
export const CornMazeHome: React.FC = () => {
  const navigate = useNavigate();
  const { selectedDay } = useStore($cornMazeState);

  const onPlay = () => {
    startAttempt();
    navigate("/game");
  };

  // Beta map selector: only on amoy testnet, lets QA pick a specific maze
  // layout instead of the daily rotation. Shipping prod hides the picker.
  const showBetaSelector = CONFIG.NETWORK === "amoy";
  const activeDay = selectedDay ?? getCurrentMazeDay();
  const onDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    selectDay(v === "auto" ? undefined : Number(v));
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md">
        <Panel>
          <div className="flex flex-col gap-2 p-2 text-xs">
            <Label type="default" className="text-center">
              {"Luna's Corn Maze"}
            </Label>
            <p>
              {`Find all ${TOTAL_CROWS} crows hidden in the maze before time runs out.`}
            </p>
            <p>
              {"You have 3 lives and 3 minutes per attempt. Watch out for the wandering folk — contact costs you a life, with brief invincibility after a hit."}
            </p>
            <p>
              {"Touch Luna at the portal at any time to end your run early and lock in your score. The maze layout rotates daily, so come back tomorrow for a fresh challenge."}
            </p>
          </div>
          {showBetaSelector && (
            <div className="flex items-center justify-between gap-2 px-2 pb-2 text-xs">
              <Label type="warning">{"Map (beta)"}</Label>
              <select
                value={selectedDay === undefined ? "auto" : String(selectedDay)}
                onChange={onDayChange}
                className="border border-black/40 bg-[#ead4aa] px-2 py-1 text-xs"
              >
                <option value="auto">{`Today's map (Day ${activeDay})`}</option>
                {Array.from({ length: TOTAL_MAZE_DAYS }, (_, i) => i + 1).map(
                  (day) => (
                    <option key={day} value={day}>{`Day ${day}`}</option>
                  ),
                )}
              </select>
            </div>
          )}
          <Button onClick={onPlay}>{"Let's go!"}</Button>
        </Panel>
      </div>
    </div>
  );
};
