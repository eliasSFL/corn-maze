import React from "react";
import { MemoryRouter } from "react-router-dom";

import { MinigamePortalProvider } from "lib/portal";
import { createChickenRescueOfflineMinigame } from "./lib/chickenRescueMachine";
import { ChickenRescueRoutes } from "./ChickenRescueRoutes";

/**
 * MemoryRouter keeps /home ↔ /game navigation off the real iframe URL
 * (`?jwt=`, `apiUrl=`, etc.). BrowserRouter was pushing `/game` onto
 * `window.location`, which can trigger a full document reload inside the iframe
 * depending on hosting / navigation handling.
 */
export const ChickenRescueApp: React.FC = () => {
  return (
    <MemoryRouter initialEntries={["/home"]}>
      <MinigamePortalProvider
        offlineActions={{}}
        offlineMinigame={createChickenRescueOfflineMinigame}
      >
        <ChickenRescueRoutes />
      </MinigamePortalProvider>
    </MemoryRouter>
  );
};
