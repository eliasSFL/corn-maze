import React from "react";
import classnames from "classnames";
import { UI_IMAGES } from "lib/images";
import { PIXEL_SCALE } from "lib/constants";

import secondaryButton from "assets/ui/secondary_button.png";

interface Props {
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  contentAlign?: "start" | "center" | "end";
}

export const Button: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  onClick,
  disabled,
  className,
  type = "button",
  variant = "primary",
  contentAlign = "center",
}) => {
  const justify =
    contentAlign === "start"
      ? "justify-start"
      : contentAlign === "end"
        ? "justify-end"
        : "justify-center";
  const buttonImage =
    variant === "primary" ? UI_IMAGES.primaryButton : secondaryButton;
  const buttonPressedImage =
    variant === "primary"
      ? UI_IMAGES.primaryButtonPressed
      : secondaryButton;

  const buttonVariables = {
    "--button-image": `url(${buttonImage})`,
    "--button-pressed-image": `url(${buttonPressedImage})`,
  } as React.CSSProperties;

  return (
    <button
      className={classnames(
        `p-1 text-sm text-black object-contain justify-center items-center hover:brightness-90 cursor-pointer flex disabled:opacity-50 [border-image:var(--button-image)_3_3_4_3_fill] active:[border-image:var(--button-pressed-image)_3_3_4_3_fill] transition-transform active:scale-[0.99]`,
        !className?.match(/\bw-/g) && "w-full",
        className,
        { "cursor-not-allowed": disabled },
      )}
      type={type}
      disabled={disabled}
      style={{
        ...buttonVariables,
        borderStyle: "solid",
        borderWidth: `8px 8px 10px 8px`,
        imageRendering: "pixelated",
        borderImageRepeat: "stretch",
        borderRadius: `${PIXEL_SCALE * 5}px`,
      }}
      onClick={disabled ? undefined : onClick}
    >
      <div className={classnames("mb-1 w-full flex", justify)}>
        {children}
      </div>
    </button>
  );
};
