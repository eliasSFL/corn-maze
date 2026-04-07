import type { PopupId, PopupRenderProps } from "lib/popups";
import type { FC } from "react";
import { WelcomePopup } from "components/popups/WelcomePopup";
import { HintPopup } from "components/popups/HintPopup";
import { HideAndSeekWelcomePopup } from "examples/hideAndSeek/components/HideAndSeekWelcomePopup";
import { HideAndSeekGameOverPopup } from "examples/hideAndSeek/components/HideAndSeekGameOverPopup";
import { HideAndSeekClaimPopup } from "examples/hideAndSeek/components/HideAndSeekClaimPopup";

export const POPUP_REGISTRY: Record<PopupId, FC<PopupRenderProps>> = {
  welcome: WelcomePopup,
  hint: HintPopup,
  hideAndSeekWelcome: HideAndSeekWelcomePopup,
  hideAndSeekGameOver: HideAndSeekGameOverPopup,
  hideAndSeekClaim: HideAndSeekClaimPopup,
};
