import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@nanostores/react";

import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";

import {
  $cornMazeState,
  retry,
  startAttempt,
  TOTAL_CROWS,
} from "../lib/cornMazeStore";

export const CornMazeGameOverModal: React.FC = () => {
  const navigate = useNavigate();
  const state = useStore($cornMazeState);
  const show = state.mode === "gameover";

  const playAgain = () => {
    // gameover → ready (resets state) → ready → playing.
    retry();
    startAttempt();
  };

  const goHome = () => {
    retry();
    navigate("/home");
  };

  const isPerfect = state.score >= TOTAL_CROWS;

  return (
    <Modal show={show}>
      <div className="w-full max-w-md">
        <Panel>
          <div className="flex flex-col items-center gap-2 p-2 text-xs">
            <Label type={isPerfect ? "success" : "danger"} className="text-center">
              {isPerfect ? "Perfect run!" : "Run over"}
            </Label>
            <p className="text-center">
              {`You collected ${state.score} ${
                state.score === 1 ? "crow" : "crows"
              }.`}
            </p>
          </div>
          <div className="flex gap-1">
            <Button onClick={goHome}>{"Home"}</Button>
            <Button onClick={playAgain}>{"Play again"}</Button>
          </div>
        </Panel>
      </div>
    </Modal>
  );
};
