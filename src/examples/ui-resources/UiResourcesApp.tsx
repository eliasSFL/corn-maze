import React from "react";
import { MemoryRouter } from "react-router-dom";

import { MinigamePortalProvider } from "lib/portal";
import { UiResourcesDashboard } from "./UiResourcesDashboard";
import {
  buildUiResourcesOfflineEconomyMeta,
  createUiResourcesOfflinePlayerEconomy,
  UI_RESOURCES_OFFLINE_ACTIONS,
} from "./lib/localOfflineStub";

/**
 * Player-economy dashboard minigame: renders whatever the Minigames session returns
 * (`actions`, `items`, generator rules, …). Offline stub included when no API URL.
 *
 * Mount from `App.tsx` instead of `ChickenRescueApp` when you want this dashboard shell.
 *
 * Paste/upload the bundled sample config: `ui-resources-editor-sample.json` (same folder as this file).
 */
export const UiResourcesApp: React.FC = () => {
  return (
    <MemoryRouter>
      <MinigamePortalProvider
        offlineActions={UI_RESOURCES_OFFLINE_ACTIONS}
        offlineMinigame={createUiResourcesOfflinePlayerEconomy}
        offlineEconomyMeta={buildUiResourcesOfflineEconomyMeta()}
      >
        <UiResourcesDashboard />
      </MinigamePortalProvider>
    </MemoryRouter>
  );
};
