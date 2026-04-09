import React from "react";
import { ChickenRescueApp } from "examples/chickenRescue/ChickenRescue";
import { UiResourcesApp } from "examples/ui-resources/UiResourcesApp";

/**
 * Default sample: Chicken Rescue (Phaser + portal session). Swap in
 * {@link examples/ui-resources/UiResourcesApp} or another example from `src/examples/`.
 */
export const App: React.FC = () => {
  return <UiResourcesApp />;
};
