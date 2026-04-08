import type { CSSProperties } from "react";
import { PIXEL_SCALE } from "lib/constants";
import { UI_IMAGES } from "lib/images";

const pixelizedBorderStyle: CSSProperties = {
  borderStyle: "solid",
  borderWidth: `${PIXEL_SCALE * 2}px`,
  imageRendering: "pixelated",
  borderImageRepeat: "stretch",
  borderRadius: `${PIXEL_SCALE * 5}px`,
};

export const pixelGrayBorderStyle: CSSProperties = {
  borderImage: `url(${UI_IMAGES.grayBorder}) 20%`,
  ...pixelizedBorderStyle,
};

export const pixelOrangeBorderStyle: CSSProperties = {
  borderImage: `url(${UI_IMAGES.orangeBorder}) 20%`,
  ...pixelizedBorderStyle,
};

export const pixelRedBorderStyle: CSSProperties = {
  borderImage: `url(${UI_IMAGES.redBorder}) 20%`,
  ...pixelizedBorderStyle,
};

export const pixelVibrantBorderStyle: CSSProperties = {
  borderImage: `url(${UI_IMAGES.vibrantBorder}) 20%`,
  ...pixelizedBorderStyle,
};

export const pixelBlueBorderStyle: CSSProperties = {
  borderImage: `url(${UI_IMAGES.blueBorder}) 20%`,
  ...pixelizedBorderStyle,
};

export const pixelFormulaBorderStyle: CSSProperties = {
  borderImage: `url(${UI_IMAGES.formulaBorder}) 20%`,
  ...pixelizedBorderStyle,
};

export const pixelCalmBorderStyle: CSSProperties = {
  borderImage: `url(${UI_IMAGES.calmBorder}) 20%`,
  ...pixelizedBorderStyle,
};

export const pixelLightBorderStyle: CSSProperties = {
  borderImage: `url(${UI_IMAGES.lightBorder}) 20%`,
  ...pixelizedBorderStyle,
};

export const pixelDarkBorderStyle: CSSProperties = {
  borderImage: `url(${UI_IMAGES.darkBorder}) 20%`,
  ...pixelizedBorderStyle,
};

export const pixelGreenBorderStyle: CSSProperties = {
  borderImage: `url(${UI_IMAGES.greenBorder}) 20%`,
  ...pixelizedBorderStyle,
};

/** Speech-style panel (Chicken Rescue rules copy). */
export const pixelSpeechBubbleBorderStyle: CSSProperties = {
  borderImage: `url(${UI_IMAGES.speechBubbleBorder})`,
  backgroundColor: "white",
  borderWidth: `${PIXEL_SCALE * 3}px`,
  ...pixelizedBorderStyle,
};
