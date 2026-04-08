import React from "react";
import Decimal from "decimal.js-light";
import { Box } from "components/ui/Box";
import chookIcon from "example-assets/icons/chook.webp";
import chickenFeetIcon from "example-assets/icons/chicken_feet.webp";
import goldenNuggetIcon from "example-assets/icons/golden_nugget.webp";
import wormIcon from "example-assets/icons/worm.png";
import goldenChookIcon from "example-assets/sfts/golden_chook.png";
import { useMinigameSession } from "lib/portal";

export const ChickenRescueHomeHUD: React.FC = () => {
  const { playerEconomy } = useMinigameSession();

  const chooks = playerEconomy.balances["1"] ?? 0;
  const goldenChooks = playerEconomy.balances["2"] ?? 0;
  const goldenNuggets = playerEconomy.balances["0"] ?? 0;
  const chickenFeet = playerEconomy.balances["3"] ?? 0;
  const worms = playerEconomy.balances["4"] ?? 0;

  const showGoldenChookBalance =
    chickenFeet > 0 || goldenChooks > 0;

  return (
    <div className="absolute top-4 right-4 z-20 flex items-start gap-3 pointer-events-none">
      <div className="flex flex-col items-end gap-1 flex-shrink-0 pointer-events-auto">
        <Box
          image={chickenFeetIcon}
          count={new Decimal(chickenFeet)}
          showCountIfZero
          className="flex-shrink-0"
        />
        <Box
          image={goldenNuggetIcon}
          count={new Decimal(goldenNuggets)}
          showCountIfZero
          className="flex-shrink-0"
        />
        <Box
          image={wormIcon}
          count={new Decimal(worms)}
          showCountIfZero
          className="flex-shrink-0"
        />
        <Box
          image={chookIcon}
          count={new Decimal(chooks)}
          showCountIfZero
          className="flex-shrink-0"
        />
        {showGoldenChookBalance && (
          <Box
            image={goldenChookIcon}
            count={new Decimal(goldenChooks)}
            showCountIfZero
            className="flex-shrink-0"
          />
        )}
      </div>
    </div>
  );
};
