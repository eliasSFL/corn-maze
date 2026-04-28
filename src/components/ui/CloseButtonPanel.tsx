import React from "react";
import { OuterPanel, InnerPanel } from "./Panel";
import { PIXEL_SCALE } from "lib/constants";
import { CONFIG } from "lib/config";

const CLOSE_ICON = `${CONFIG.PROTECTED_IMAGE_URL}/icons/close.png`;

interface Props {
  onClose?: () => void;
  title?: string | React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const CloseButtonPanel: React.FC<Props> = ({
  onClose,
  title,
  className,
  children,
}) => {
  return (
    <OuterPanel className={className}>
      {/* Close button */}
      {onClose && (
        <img
          src={CLOSE_ICON}
          alt="Close"
          className="absolute cursor-pointer z-20 hover:brightness-75"
          style={{
            top: `${PIXEL_SCALE * 2}px`,
            right: `${PIXEL_SCALE * 2}px`,
            width: `${PIXEL_SCALE * 11}px`,
            imageRendering: "pixelated",
          }}
          onClick={onClose}
        />
      )}

      <InnerPanel>
        {/* Title */}
        {title && (
          <div
            className="flex items-center justify-center mb-1"
            style={{
              paddingRight: onClose ? `${PIXEL_SCALE * 13}px` : undefined,
            }}
          >
            {typeof title === "string" ? (
              <span className="text-sm text-center" style={{ color: "#3e2731" }}>
                {title}
              </span>
            ) : (
              title
            )}
          </div>
        )}
        {children}
      </InnerPanel>
    </OuterPanel>
  );
};
