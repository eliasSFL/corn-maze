import React from "react";
import { ChickenRescueApp } from "examples/chickenRescue/ChickenRescue";
import { UiResourcesApp } from "examples/ui-resources/UiResourcesApp";
import { HideAndSeekApp } from "examples/hideAndSeek/HideAndSeekApp";
import { PlazaPartyApp } from "examples/plazaParty/PlazaPartyApp";
import { TileJumpApp } from "examples/tileJump/TileJumpApp";
import { GoldenCropsApp } from "examples/goldenCrops/GoldenCropsApp";

/**
 * Default sample: Golden Crops (economy demo). Swap in
 * {@link examples/chickenRescue/ChickenRescue}, `examples/plazaParty/PlazaPartyApp`,
 * `examples/tileJump/TileJumpApp`, or another example from `src/examples/`.
 */
export const App: React.FC = () => {
  return <TileJumpApp />;
};
