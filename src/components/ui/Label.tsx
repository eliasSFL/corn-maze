import React from "react";
import classnames from "classnames";
import {
  pixelGrayBorderStyle,
  pixelOrangeBorderStyle,
  pixelRedBorderStyle,
  pixelVibrantBorderStyle,
  pixelBlueBorderStyle,
  pixelFormulaBorderStyle,
  pixelGreenBorderStyle,
  pixelCalmBorderStyle,
} from "lib/style";

export type LabelType =
  | "default"
  | "transparent"
  | "success"
  | "info"
  | "danger"
  | "warning"
  | "vibrant"
  | "formula"
  | "chill";

export const LABEL_STYLES: Record<
  LabelType,
  { background: string; textColour: string; borderStyle: React.CSSProperties }
> = {
  danger: {
    background: "#e43b44",
    borderStyle: pixelRedBorderStyle,
    textColour: "#ffffff",
  },
  default: {
    background: "#c0cbdc",
    borderStyle: pixelGrayBorderStyle,
    textColour: "#181425",
  },
  info: {
    background: "#1e6dd5",
    borderStyle: pixelBlueBorderStyle,
    textColour: "#ffffff",
  },
  success: {
    background: "#3e8948",
    borderStyle: pixelGreenBorderStyle,
    textColour: "#ffffff",
  },
  transparent: {
    background: "none",
    borderStyle: {},
    textColour: "#181425",
  },
  vibrant: {
    background: "#b65389",
    borderStyle: pixelVibrantBorderStyle,
    textColour: "#ffffff",
  },
  warning: {
    background: "#f09100",
    borderStyle: pixelOrangeBorderStyle,
    textColour: "#3e2731",
  },
  chill: {
    background: "#e4a672",
    borderStyle: pixelCalmBorderStyle,
    textColour: "#3e2731",
  },
  formula: {
    background: "#3c4665",
    borderStyle: pixelFormulaBorderStyle,
    textColour: "#ffffff",
  },
};

interface Props {
  className?: string;
  type?: LabelType;
  style?: React.CSSProperties;
  onClick?: () => void;
  /** Optional leading image (URL) shown inside the label. */
  icon?: string;
}

export const Label: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  className,
  type = "default",
  style,
  onClick,
  icon,
}) => {
  return (
    <div
      onClick={onClick}
      className={classnames(
        className,
        `w-fit justify-center flex items-center text-xs px-[3px] gap-1`,
        {
          relative: !className?.includes("absolute"),
          "cursor-pointer": !!onClick,
        },
      )}
      style={{
        ...LABEL_STYLES[type].borderStyle,
        background: LABEL_STYLES[type].background,
        color: LABEL_STYLES[type].textColour,
        ...style,
      }}
    >
      {icon && (
        <img
          src={icon}
          alt=""
          className="shrink-0"
          style={{ width: 14, height: 14, imageRendering: "pixelated" }}
        />
      )}
      {children}
    </div>
  );
};
