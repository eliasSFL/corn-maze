import React from "react";
import { createPortal } from "react-dom";

/** Portals HUD content to `document.body` with safe-area padding (Chicken Rescue). */
export const HudContainer: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <>
      {createPortal(
        <div
          data-html2canvas-ignore="true"
          aria-label="Hud"
          className="fixed inset-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pointer-events-none z-10"
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="pointer-events-auto h-full w-full"
          >
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};
