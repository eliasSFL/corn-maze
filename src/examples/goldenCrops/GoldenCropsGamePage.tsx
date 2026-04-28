import React, { useCallback, useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { useStore } from "@nanostores/react";

import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { InnerPanel, OuterPanel } from "components/ui/Panel";
import { Modal } from "components/ui/Modal";
import { CloseButtonPanel } from "components/ui/CloseButtonPanel";
import { RequirementLabel } from "components/ui/RequirementLabel";
import { MMO_SERVER_REGISTRY_KEY, useMmoRoom } from "lib/mmo";
import { useMinigameSession } from "lib/portal/sessionProvider";
import { CONFIG } from "lib/config";
import { PIXEL_SCALE } from "lib/constants";
import { pixelDarkBorderStyle } from "lib/style";

import {
  GoldenCropsScene,
  SCENE_INSTANCE_REGISTRY_KEY,
} from "./game/GoldenCropsScene";
import { PLAYER_TOKEN_PARTS_REGISTRY_KEY } from "./GoldenCropsApp";
import {
  $goldenCropsModal,
  $goldenCropsHud,
  closeModal,
  resetGoldenCropsState,
  updateHudBalances,
} from "./lib/goldenCropsStore";

function fallbackViewport() {
  return {
    width: Math.max(320, Math.floor(window.innerWidth * 0.92)),
    height: Math.max(240, Math.floor(window.innerHeight * 0.78)),
  };
}

// ── Art asset URLs (SFL CDN) ────────────────────────────────────────────────
const CDN = CONFIG.PROTECTED_IMAGE_URL;
const BASE = import.meta.env.BASE_URL;

// Local copies of SFL art
const IMG_GOLDEN_CAULIFLOWER = `${BASE}game/golden_cauliflower.webp`;

const ICON_WATERING_CAN = `${BASE}game/watering_can.png`;
const ICON_COIN = `${CDN}/ui/coins.png`;
const ICON_TROPHY = IMG_GOLDEN_CAULIFLOWER;

// ── Pixel-art inventory box ─────────────────────────────────────────────────
const BOX_INNER = 14;

const InventoryBox: React.FC<{
  icon: string;
  count: number;
}> = ({ icon, count }) => (
  <div className="relative">
    <div
      className="relative flex items-center justify-center bg-brown-600"
      style={{
        width: `${PIXEL_SCALE * (BOX_INNER + 4)}px`,
        height: `${PIXEL_SCALE * (BOX_INNER + 4)}px`,
        ...pixelDarkBorderStyle,
      }}
    >
      <img
        src={icon}
        alt=""
        className="object-contain"
        style={{
          width: `${PIXEL_SCALE * BOX_INNER}px`,
          height: `${PIXEL_SCALE * BOX_INNER}px`,
          imageRendering: "pixelated",
        }}
      />
    </div>
    {/* Count badge */}
    <div
      className="absolute z-10 flex items-center justify-center pointer-events-none"
      style={{
        right: `${PIXEL_SCALE * -4}px`,
        top: `${PIXEL_SCALE * -4}px`,
      }}
    >
      <Label type="default" style={{ padding: "0 3px", height: 22 }}>
        {count}
      </Label>
    </div>
  </div>
);

// ── HUD ─────────────────────────────────────────────────────────────────────

const BalanceHud: React.FC = () => {
  const { balances } = useStore($goldenCropsHud);
  return (
    <div className="fixed top-2 right-2 z-10 pointer-events-none flex flex-col gap-0.5 items-end">
      <InventoryBox
        icon={ICON_WATERING_CAN}
        count={balances["watering-can"] ?? 0}
      />
      <InventoryBox icon={ICON_COIN} count={balances["coin"] ?? 0} />
      <InventoryBox icon={ICON_TROPHY} count={balances["trophy"] ?? 0} />
    </div>
  );
};

// ── Divider ─────────────────────────────────────────────────────────────────

const Divider: React.FC = () => (
  <div
    className="w-full"
    style={{
      height: `${PIXEL_SCALE * 1}px`,
      background: "#c28569",
      marginTop: `${PIXEL_SCALE * 1}px`,
      marginBottom: `${PIXEL_SCALE * 1}px`,
    }}
  />
);

// ── NPC portrait helper ─────────────────────────────────────────────────────

const NpcHeader: React.FC<{
  icon: string;
  name: string;
  labelType?: "default" | "chill" | "vibrant";
}> = ({ icon, name, labelType = "chill" }) => (
  <div className="flex items-center gap-2 mb-1">
    <div
      className="bg-brown-600 flex items-center justify-center shrink-0"
      style={{
        width: `${PIXEL_SCALE * 16}px`,
        height: `${PIXEL_SCALE * 16}px`,
        ...pixelDarkBorderStyle,
      }}
    >
      <img
        src={icon}
        alt={name}
        className="object-contain"
        style={{
          width: `${PIXEL_SCALE * 14}px`,
          height: `${PIXEL_SCALE * 14}px`,
          imageRendering: "pixelated",
        }}
      />
    </div>
    <Label type={labelType}>{name}</Label>
  </div>
);

// ── Shop item row ───────────────────────────────────────────────────────────

const ShopRow: React.FC<{
  itemIcon: string;
  itemName: string;
  costIcon: string;
  costLabel: string;
  hasEnough: boolean;
  onBuy: () => void;
}> = ({ itemIcon, itemName, costIcon, costLabel, hasEnough, onBuy }) => (
  <InnerPanel className="flex items-center gap-2 p-1">
    {/* Item icon */}
    <div
      className="bg-brown-600 flex items-center justify-center shrink-0"
      style={{
        width: `${PIXEL_SCALE * 14}px`,
        height: `${PIXEL_SCALE * 14}px`,
        ...pixelDarkBorderStyle,
      }}
    >
      <img
        src={itemIcon}
        alt={itemName}
        className="object-contain"
        style={{
          width: `${PIXEL_SCALE * 12}px`,
          height: `${PIXEL_SCALE * 12}px`,
          imageRendering: "pixelated",
        }}
      />
    </div>
    {/* Details */}
    <div className="flex-1 min-w-0">
      <p className="text-xs" style={{ color: "#3e2731" }}>
        {itemName}
      </p>
      <RequirementLabel
        icon={costIcon}
        label={costLabel}
        hasEnough={hasEnough}
      />
    </div>
    {/* Buy */}
    <Button
      className="w-auto px-2 shrink-0"
      onClick={onBuy}
      disabled={!hasEnough}
    >
      Buy
    </Button>
  </InnerPanel>
);

// ── Action dispatch shape shared between React + scene ──────────────────────

export type GoldenCropsActionResult = {
  ok: boolean;
  error?: string;
  coins?: number;
};

// ── Modal overlay ───────────────────────────────────────────────────────────

const ModalOverlay: React.FC<{
  onAction: (
    actionId: string,
    extra?: Record<string, unknown>,
  ) => GoldenCropsActionResult;
}> = ({ onAction }) => {
  const modal = useStore($goldenCropsModal);
  const { balances } = useStore($goldenCropsHud);

  if (!modal.type) return null;

  // ── Claim Watering Cans NPC ─────────────────────────────────────────
  if (modal.type === "claim-npc") {
    return (
      <Modal show onHide={closeModal}>
        <CloseButtonPanel onClose={closeModal}>
          <NpcHeader icon={ICON_WATERING_CAN} name="Friendly Farmer" />
          <Divider />
          <p
            className="text-xs my-2"
            style={{ color: "#3e2731", lineHeight: "1.4" }}
          >
            Welcome, adventurer! Take these Watering Cans — water the giant
            crops and plots to earn Coins.
          </p>
          <div className="flex items-center gap-1 mb-2">
            <img
              src={ICON_WATERING_CAN}
              alt=""
              style={{
                width: `${PIXEL_SCALE * 7}px`,
                imageRendering: "pixelated",
              }}
            />
            <span className="text-xs" style={{ color: "#3e8948" }}>
              +5 Watering Cans
            </span>
          </div>
          <Button
            onClick={() => {
              onAction("claim.watering-cans");
              closeModal();
            }}
          >
            Claim
          </Button>
        </CloseButtonPanel>
      </Modal>
    );
  }

  // ── Out of Watering Cans ───────────────────────────────────────────
  if (modal.type === "no-watering-can") {
    return (
      <Modal show onHide={closeModal}>
        <CloseButtonPanel onClose={closeModal}>
          <div className="flex flex-col items-center gap-2 py-1">
            <Label type="danger">Out of Watering Cans</Label>
            <img
              src={ICON_WATERING_CAN}
              alt=""
              style={{
                width: `${PIXEL_SCALE * 14}px`,
                imageRendering: "pixelated",
              }}
            />
            <p className="text-xs text-center" style={{ color: "#3e2731" }}>
              Visit the Friendly Farmer to claim more Watering Cans.
            </p>
            <Button onClick={closeModal}>OK</Button>
          </div>
        </CloseButtonPanel>
      </Modal>
    );
  }

  // ── Kale loot reveal ───────────────────────────────────────────────
  if (modal.type === "kale-reveal") {
    const coins = modal.lootCoins ?? 0;
    return (
      <Modal show onHide={closeModal}>
        <CloseButtonPanel onClose={closeModal}>
          <div className="flex flex-col items-center gap-2 py-1">
            <Label type={coins > 0 ? "success" : "danger"}>
              {coins > 0 ? "Lucky!" : "Unlucky..."}
            </Label>
            {coins > 0 ? (
              <div className="flex items-center gap-1">
                <img
                  src={ICON_COIN}
                  alt=""
                  style={{
                    width: `${PIXEL_SCALE * 10}px`,
                    imageRendering: "pixelated",
                  }}
                />
                <span className="text-sm" style={{ color: "#3e8948" }}>
                  +{coins} Coins
                </span>
              </div>
            ) : (
              <p className="text-xs text-center" style={{ color: "#3e2731" }}>
                Better luck next time!
              </p>
            )}
            <Button onClick={closeModal}>OK</Button>
          </div>
        </CloseButtonPanel>
      </Modal>
    );
  }

  // ── Shop ───────────────────────────────────────────────────────────
  if (modal.type === "shop") {
    return (
      <Modal show onHide={closeModal}>
        <CloseButtonPanel
          onClose={closeModal}
          title={<Label type="vibrant">Shop</Label>}
        >
          <div className="flex flex-col gap-1 mt-1">
            <ShopRow
              itemIcon={ICON_TROPHY}
              itemName="Crop Master Trophy"
              costIcon={ICON_COIN}
              costLabel="10 Coins"
              hasEnough={(balances["coin"] ?? 0) >= 10}
              onBuy={() => onAction("buy.trophy")}
            />
          </div>
        </CloseButtonPanel>
      </Modal>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────
  if (modal.type === "error") {
    return (
      <Modal show onHide={closeModal}>
        <CloseButtonPanel onClose={closeModal}>
          <div className="flex flex-col items-center gap-2 py-1">
            <Label type="danger">Error</Label>
            <p className="text-xs text-center" style={{ color: "#3e2731" }}>
              {modal.message ?? "Something went wrong."}
            </p>
            <Button onClick={closeModal}>OK</Button>
          </div>
        </CloseButtonPanel>
      </Modal>
    );
  }

  return null;
};

// ── Game Page ───────────────────────────────────────────────────────────────

export const GoldenCropsGamePage: React.FC<{ tokenParts: string }> = ({
  tokenParts,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const { phase, room, retry } = useMmoRoom();
  const [playOffline, setPlayOffline] = useState(false);
  const session = useMinigameSession();

  useEffect(() => {
    resetGoldenCropsState();
    updateHudBalances(
      { ...session.playerEconomy.balances },
      session.playerEconomy.generating as Record<
        string,
        { outputToken: string; completesAt: number; startedAt: number }
      >,
    );
  }, []);

  /**
   * Unified economy action dispatcher.
   *
   * Returns a `{ ok, error?, coins? }` tuple so the Phaser scene can chain
   * visuals (watering animation → reveal reward) around it. Modals ignore the
   * return value and just use it fire-and-forget.
   *
   * Special cases:
   *  - `water.kale`   — computes random 0-or-5 coin loot box payload
   *  - `water.plot`   — after dispatch, sync scene's plot slots to the new
   *                     generator job so the progress bar appears
   *  - `harvest`      — requires `{ jobId }` in `extra`; clears the scene plot
   */
  const handleAction = useCallback(
    (
      actionId: string,
      extra?: Record<string, unknown>,
    ): GoldenCropsActionResult => {
      const getScene = (): GoldenCropsScene | undefined =>
        gameRef.current?.registry.get(SCENE_INSTANCE_REGISTRY_KEY) as
          | GoldenCropsScene
          | undefined;

      const syncHud = () => {
        updateHudBalances(
          { ...session.playerEconomy.balances },
          session.playerEconomy.generating as Record<
            string,
            { outputToken: string; completesAt: number; startedAt: number }
          >,
        );
      };

      // ── Harvest (generator collect) ─────────────────────────────────
      if (actionId === "harvest" && extra?.jobId) {
        const jobId = extra.jobId as string;
        const result = session.dispatchAction({ collectJobId: jobId });
        if (!result.ok) {
          $goldenCropsModal.set({ type: "error", message: result.error });
          return { ok: false, error: result.error };
        }
        syncHud();
        getScene()?.clearPlotJob(jobId);
        const coins =
          result.collectGrants?.find((g) => g.token === "coin")?.amount ?? 0;
        return { ok: true, coins };
      }

      // ── Kale loot box (random coins) ────────────────────────────────
      if (actionId === "water.kale") {
        const lootCoins = Math.random() < 0.5 ? 5 : 0;
        const result = session.dispatchAction({
          action: actionId,
          amounts: { coin: lootCoins },
        });
        if (!result.ok) {
          $goldenCropsModal.set({ type: "error", message: result.error });
          return { ok: false, error: result.error };
        }
        syncHud();
        return { ok: true, coins: lootCoins };
      }

      // ── Water plot (start generator job) ────────────────────────────
      if (actionId === "water.plot") {
        const result = session.dispatchAction({ action: actionId });
        if (!result.ok) {
          $goldenCropsModal.set({ type: "error", message: result.error });
          return { ok: false, error: result.error };
        }
        const generating = session.playerEconomy.generating as Record<
          string,
          { outputToken: string; completesAt: number; startedAt: number }
        >;
        updateHudBalances(
          { ...session.playerEconomy.balances },
          generating,
        );
        getScene()?.syncGeneratingJobs(generating);
        return { ok: true };
      }

      // ── Default (claim NPCs, buy.trophy, water.cauliflower) ─────────
      const result = session.dispatchAction({ action: actionId });
      if (!result.ok) {
        $goldenCropsModal.set({ type: "error", message: result.error });
        return { ok: false, error: result.error };
      }
      syncHud();
      return { ok: true };
    },
    [session],
  );

  const runGame = (phase === "connected" && !!room) || playOffline;

  useEffect(() => {
    if (!runGame) return;
    const parent = hostRef.current;
    if (!parent) return;

    const readSize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w >= 8 && h >= 8)
        return { width: Math.max(320, w), height: Math.max(240, h) };
      return fallbackViewport();
    };

    const { width, height } = readSize();

    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent,
      width,
      height,
      pixelArt: true,
      roundPixels: true,
      antialias: false,
      backgroundColor: "#000000",
      fps: { smoothStep: false },
      loader: { crossOrigin: "anonymous" },
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, fixedStep: true, fps: 60 },
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true,
      },
      scene: [GoldenCropsScene],
    });

    gameRef.current = game;

    if (room) game.registry.set(MMO_SERVER_REGISTRY_KEY, room);
    game.registry.set(PLAYER_TOKEN_PARTS_REGISTRY_KEY, tokenParts);

    game.canvas.style.imageRendering = "pixelated";

    const ro = new ResizeObserver(() => {
      const next = readSize();
      game.scale.resize(next.width, next.height);
    });
    ro.observe(parent);

    return () => {
      ro.disconnect();
      game.registry.remove(MMO_SERVER_REGISTRY_KEY);
      game.registry.remove(PLAYER_TOKEN_PARTS_REGISTRY_KEY);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [runGame, room, tokenParts]);

  // Register React's handleAction with the scene once it's alive so SPACE
  // presses can dispatch economy actions. We re-register whenever handleAction
  // changes (i.e. when the session reference updates).
  useEffect(() => {
    if (!runGame) return;
    const game = gameRef.current;
    if (!game) return;

    let cancelled = false;
    const tryRegister = () => {
      if (cancelled) return;
      const scene = game.registry.get(SCENE_INSTANCE_REGISTRY_KEY) as
        | GoldenCropsScene
        | undefined;
      if (scene) {
        scene.setActionDispatcher(handleAction);
        return;
      }
      // Scene may not exist yet (Phaser hasn't finished create()). Poll briefly.
      setTimeout(tryRegister, 100);
    };
    tryRegister();

    return () => {
      cancelled = true;
    };
  }, [runGame, handleAction]);

  // Loading
  if (phase === "loading" || phase === "idle") {
    return (
      <div className="fixed inset-0 z-0 bg-black flex items-center justify-center">
        <OuterPanel>
          <InnerPanel className="flex items-center gap-2 px-3 py-2">
            <Label type="default">Loading...</Label>
          </InnerPanel>
        </OuterPanel>
      </div>
    );
  }

  // Error
  if (phase === "error" && !playOffline) {
    return (
      <div className="fixed inset-0 z-0 bg-black flex items-center justify-center p-4">
        <CloseButtonPanel>
          <div className="flex flex-col gap-2 items-center py-1">
            <Label type="danger">Connection Failed</Label>
            <p className="text-xs text-center" style={{ color: "#3e2731" }}>
              We couldn&apos;t connect to the server.
            </p>
            <div className="flex gap-2 w-full">
              <Button onClick={() => retry()}>Try Again</Button>
              <Button
                variant="secondary"
                onClick={() => setPlayOffline(true)}
              >
                Play Solo
              </Button>
            </div>
          </div>
        </CloseButtonPanel>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 bg-black">
      <div ref={hostRef} className="fixed inset-0 overflow-hidden" />
      <BalanceHud />
      <ModalOverlay onAction={handleAction} />
    </div>
  );
};
