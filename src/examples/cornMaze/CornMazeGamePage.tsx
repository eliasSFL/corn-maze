import React from "react";
import { useMinigameSession } from "lib/portal";

import { CornMazeGame } from "./CornMazeGame";
import { CornMazeHUD } from "./components/CornMazeHUD";
import { CornMazeGameOverModal } from "./components/CornMazeGameOverModal";
import { CornMazeConfirmExitModal } from "./components/CornMazeConfirmExitModal";

export const CornMazeGamePage: React.FC = () => {
  const { farmId } = useMinigameSession();

  return (
    <div className="relative">
      <CornMazeGame farmId={farmId ?? 0} />
      <CornMazeHUD />
      <CornMazeConfirmExitModal />
      <CornMazeGameOverModal />
    </div>
  );
};
