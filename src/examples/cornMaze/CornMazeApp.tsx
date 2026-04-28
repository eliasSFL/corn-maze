import React from "react";
import { MemoryRouter } from "react-router-dom";
import { MinigamePortalProvider } from "lib/portal";

import { CornMazeRoutes } from "./CornMazeRoutes";

/**
 * MemoryRouter keeps `/home` ↔ `/game` navigation off the iframe URL. The
 * minigames API isn't used by this portal yet (no online lifecycle calls),
 * so the offline branch of `MinigamePortalProvider` is sufficient — we
 * leave `offlineActions` / `offlineMinigame` defaults.
 */
export const CornMazeApp: React.FC = () => {
  return (
    <MemoryRouter initialEntries={["/home"]}>
      <MinigamePortalProvider offlineActions={{}}>
        <CornMazeRoutes />
      </MinigamePortalProvider>
    </MemoryRouter>
  );
};
