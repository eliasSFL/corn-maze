import React from "react";
import { useNavigate } from "react-router-dom";

import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";

import { startAttempt, TOTAL_CROWS } from "./lib/cornMazeStore";

/**
 * Landing page — the rules + "Let's go!" entry into a fresh attempt.
 * Tapping the button transitions the store into `playing` AND navigates
 * to /game so the Phaser scene mounts already-running.
 */
export const CornMazeHome: React.FC = () => {
  const navigate = useNavigate();

  const onPlay = () => {
    startAttempt();
    navigate("/game");
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
          <Button onClick={onPlay}>{"Let's go!"}</Button>
        </Panel>
      </div>
    </div>
  );
};
