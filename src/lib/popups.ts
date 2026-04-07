/**
 * Popup identifiers. Register matching React content in `components/popups/popupRegistry.tsx`.
 * One modal visible at a time (see docs/TECHNICAL.md).
 */
export const POPUP_IDS = [
  "welcome",
  "hint",
  "hideAndSeekWelcome",
  "hideAndSeekGameOver",
  "hideAndSeekClaim",
] as const;

export type PopupId = (typeof POPUP_IDS)[number];

export type PopupRenderProps = {
  onClose: () => void;
  payload?: Record<string, unknown>;
};

export function isPopupId(value: string): value is PopupId {
  return (POPUP_IDS as readonly string[]).includes(value);
}
