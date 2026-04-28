import { atom } from "nanostores";

// ── Modal types ──────────────────────────────────────────────────────────────

export type GoldenCropsModalType =
  | "claim-npc"
  | "kale-reveal"
  | "shop"
  | "no-watering-can"
  | "error"
  | null;

export type GoldenCropsModal = {
  type: GoldenCropsModalType;
  message?: string;
  /** Loot result for kale reveal */
  lootCoins?: number;
};

// ── HUD state ────────────────────────────────────────────────────────────────

export type GoldenCropsHudState = {
  balances: Record<string, number>;
  generating: Record<
    string,
    { outputToken: string; completesAt: number; startedAt: number }
  >;
};

// ── Atoms ────────────────────────────────────────────────────────────────────

export const $goldenCropsModal = atom<GoldenCropsModal>({ type: null });
export const $goldenCropsHud = atom<GoldenCropsHudState>({
  balances: {},
  generating: {},
});

// ── Actions ──────────────────────────────────────────────────────────────────

export function openModal(modal: GoldenCropsModal) {
  $goldenCropsModal.set(modal);
}

export function closeModal() {
  $goldenCropsModal.set({ type: null });
}

export function updateHudBalances(
  balances: Record<string, number>,
  generating: GoldenCropsHudState["generating"],
) {
  $goldenCropsHud.set({ balances, generating });
}

export function resetGoldenCropsState() {
  $goldenCropsModal.set({ type: null });
  $goldenCropsHud.set({ balances: {}, generating: {} });
}
