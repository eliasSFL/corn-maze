import type { PopupId, PopupRenderProps } from "lib/popups";
import type { FC } from "react";
import { WelcomePopup } from "components/popups/WelcomePopup";
import { HintPopup } from "components/popups/HintPopup";

export const POPUP_REGISTRY: Record<PopupId, FC<PopupRenderProps>> = {
  welcome: WelcomePopup,
  hint: HintPopup,
};
