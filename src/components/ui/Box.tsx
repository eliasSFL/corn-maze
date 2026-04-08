import React from "react";
import classNames from "classnames";
import Decimal from "decimal.js-light";
import { pixelDarkBorderStyle } from "lib/style";
import { PIXEL_SCALE } from "lib/constants";
import { Label } from "./Label";

const INNER = 14;

/** Compact inventory-style tile used by Chicken Rescue HUD (subset of main-game Box). */
export const Box: React.FC<{
  image: string;
  count?: Decimal;
  showCountIfZero?: boolean;
  hideCount?: boolean;
  className?: string;
}> = ({ image, count, showCountIfZero, hideCount, className }) => {
  const showLabel =
    !hideCount &&
    count !== undefined &&
    (showCountIfZero ? count.gte(0) : count.gt(0));

  return (
    <div className={classNames("relative", className)}>
      <div
        className="relative flex items-center justify-center bg-[#6b4423]"
        style={{
          width: `${PIXEL_SCALE * (INNER + 4)}px`,
          height: `${PIXEL_SCALE * (INNER + 4)}px`,
          marginTop: `${PIXEL_SCALE * 3}px`,
          marginBottom: `${PIXEL_SCALE * 2}px`,
          marginLeft: `${PIXEL_SCALE * 2}px`,
          marginRight: `${PIXEL_SCALE * 3}px`,
          ...pixelDarkBorderStyle,
        }}
      >
        <img
          src={image}
          alt=""
          className="max-w-[85%] max-h-[85%] object-contain"
          draggable={false}
        />
        {showLabel && (
          <div
            className="absolute z-10 pointer-events-none"
            style={{
              right: `${PIXEL_SCALE * -5}px`,
              top: `${PIXEL_SCALE * -5}px`,
            }}
          >
            <Label
              type="default"
              style={{
                paddingLeft: "2.5px",
                paddingRight: "1.5px",
                height: "24px",
              }}
            >
              {count.toString()}
            </Label>
          </div>
        )}
      </div>
    </div>
  );
};
