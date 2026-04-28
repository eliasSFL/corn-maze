import React from "react";
import { PIXEL_SCALE } from "lib/constants";

/**
 * Cost / requirement row — pixel-style label with icon + amount.
 * Turns red text when `hasEnough` is false.
 */
export const RequirementLabel: React.FC<{
  icon: string;
  label: string;
  hasEnough?: boolean;
}> = ({ icon, label, hasEnough = true }) => (
  <div className="flex items-center gap-1">
    <img
      src={icon}
      alt=""
      style={{
        width: `${PIXEL_SCALE * 7}px`,
        height: `${PIXEL_SCALE * 7}px`,
        imageRendering: "pixelated",
      }}
    />
    <span
      className="text-xs"
      style={{ color: hasEnough ? "#3e2731" : "#e43b44" }}
    >
      {label}
    </span>
  </div>
);
