import React from "react";
import { useMinigameSession } from "lib/portal";

import { CornMazeGame } from "./CornMazeGame";

/**
 * Page wrapper hosted at `/game`. The HUD lands here in batch 3.
 */
export const CornMazeGamePage: React.FC = () => {
  const { farmId } = useMinigameSession();

  return (
    <div className="relative">
      <CornMazeGame farmId={farmId ?? 0} />
    </div>
  );
};
