import React from "react";
import { useStore } from "@nanostores/react";

import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";

import {
  $cornMazeState,
  cancelExit,
  confirmExit,
} from "../lib/cornMazeStore";

/**
 * Pops when the player walks into Luna mid-run with time + lives left.
 * Choosing "Leave" submits the score; "Keep playing" resumes with the
 * timer back-shifted by the pause duration so elapsed time is preserved.
 */
export const CornMazeConfirmExitModal: React.FC = () => {
  const state = useStore($cornMazeState);
  const show = state.mode === "confirmingExit";

  return (
    <Modal show={show}>
      <div className="w-full max-w-sm">
        <Panel>
          <div className="flex flex-col items-center gap-2 p-2 text-xs">
            <Label type="info" className="text-center">
              {"Leave the maze early?"}
            </Label>
            <p className="text-center">
              {`You'll lock in your score of ${state.score} ${
                state.score === 1 ? "crow" : "crows"
              }.`}
            </p>
          </div>
          <div className="flex gap-1">
            <Button onClick={cancelExit}>{"Keep playing"}</Button>
            <Button onClick={confirmExit}>{"Leave"}</Button>
          </div>
        </Panel>
      </div>
    </Modal>
  );
};
