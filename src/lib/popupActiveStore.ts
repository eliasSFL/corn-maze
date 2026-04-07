import { atom } from "nanostores";
import type { PopupId } from "lib/popups";

/** Mirrors the visible popup id so Phaser (and other non-React code) can gate input. */
export const $activePopupId = atom<PopupId | null>(null);
