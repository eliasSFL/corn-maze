import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Decimal from "decimal.js-light";
import { Button } from "components/ui/Button";
import { InnerPanel } from "components/ui/Panel";
import { PIXEL_SCALE } from "lib/constants";
import { SUNNYSIDE } from "example-assets/sunnyside";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import {
  mergeMinigameEconomyFromApi,
  minigameSessionToRuntime,
  runtimeToMinigameSession,
} from "lib/portal/runtimeHelpers";
import { useMinigameSession } from "lib/portal/sessionProvider";
import { postPlayerEconomyAction } from "lib/portal/api";
import { getMinigamesApiUrl } from "lib/portal/url";
import {
  processPlayerEconomyAction,
  processPlayerEconomyGeneratorCollect,
  type PlayerEconomyActionDefinition,
  type PlayerEconomyConfig,
} from "lib/portal/processAction";
import { migrateLegacyPlayerEconomyConfigFields } from "lib/portal/playerEconomyMigration";
import type { PlayerEconomyProcessResult } from "./lib/types";
import { getMinigameTokenImage } from "./lib/minigameTokenIcons";
import {
  buildCapJobByRecipeKey,
  getProductionZoneEntries,
  getShopPurchaseProductionPreview,
  recipeJobKey,
  type CapBalanceProductionSlot,
} from "./lib/extractProductionSlots";
import {
  buildMinigameDashboardData,
  mergeRuntimeWithInitialBalances,
} from "./lib/minigameConfigHelpers";
import { canAttemptShopPurchase, isShopItemBoughtOrDisabled } from "./lib/minigameShopAvailability";
import { MinigameShopPanel } from "./components/MinigameShopPanel";
import { MinigameShopDetailBody } from "./components/MinigameShopDetailBody";
import { MinigameMobileShopModal } from "./components/MinigameMobileShopModal";
import { MinigameInventoryHud } from "./components/MinigameInventoryHud";
import { MinigameConfirmPanel } from "./components/MinigameConfirmPanel";
import { MinigameInventoryModal } from "./components/MinigameInventoryModal";
import { MinigameProductionZone } from "./components/MinigameProductionZone";
import type { MinigameShopItemUi } from "./lib/minigameDashboardTypes";
import { requestClosePortal } from "lib/portal/closePortal";

function DashboardBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 opacity-90"
      style={{
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          rgba(0,0,0,0.12) 0 10px,
          rgba(255,255,255,0.06) 10px 20px
        )`,
        backgroundColor: "#5c4830",
      }}
    />
  );
}

/**
 * Player-economy “dashboard” minigame: shop, generators, and inventory driven by
 * Minigames API session `actions` + optional metadata (`items`, `descriptions`, …).
 */
export const UiResourcesDashboard: React.FC = () => {
  const { t } = useAppTranslation();
  const {
    portalId,
    economyMeta,
    playerEconomy,
    actions,
    jwt,
    commitLocalPlayerEconomySync,
    replacePlayerEconomy,
    apiError,
    clearApiError,
  } = useMinigameSession();

  const config: PlayerEconomyConfig = useMemo(
    () =>
      migrateLegacyPlayerEconomyConfigFields({
        actions: actions as Record<string, PlayerEconomyActionDefinition>,
        items: economyMeta?.items,
        descriptions: economyMeta?.descriptions,
        visualTheme: economyMeta?.visualTheme,
        playUrl: economyMeta?.playUrl,
        mainCurrencyToken: economyMeta?.mainCurrencyToken,
        initialBalances: economyMeta?.initialBalances,
        productionCollectByStartId: economyMeta?.productionCollectByStartId,
        dashboard: economyMeta?.dashboard,
      }),
    [actions, economyMeta],
  );

  const runtime = useMemo(
    () =>
      mergeRuntimeWithInitialBalances(
        config,
        minigameSessionToRuntime(playerEconomy, Date.now()),
      ),
    [config, playerEconomy],
  );

  const payload = useMemo(
    () => buildMinigameDashboardData(portalId, portalId, config, runtime),
    [portalId, config, runtime],
  );

  const [pendingShopItem, setPendingShopItem] =
    useState<MinigameShopItemUi | null>(null);
  const [showShopConfirm, setShowShopConfirm] = useState(false);
  const [shopActionError, setShopActionError] = useState<string | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryModalKey, setInventoryModalKey] = useState(0);
  const [inventoryFocusToken, setInventoryFocusToken] = useState<string | null>(
    null,
  );
  const [showMobileShop, setShowMobileShop] = useState(false);
  const [mobileShopPhase, setMobileShopPhase] = useState<"list" | "detail">(
    "list",
  );
  const [capJobByRecipeKey, setCapJobByRecipeKey] = useState<
    Record<string, string | undefined>
  >({});
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const payloadInitRef = useRef(false);
  const capJobByRecipeKeyRef = useRef<Record<string, string | undefined>>({});
  useEffect(() => {
    capJobByRecipeKeyRef.current = capJobByRecipeKey;
  }, [capJobByRecipeKey]);

  useEffect(() => {
    payloadInitRef.current = false;
    queueMicrotask(() => setCapJobByRecipeKey({}));
  }, [portalId]);

  useEffect(() => {
    if (payloadInitRef.current) return;
    payloadInitRef.current = true;
    queueMicrotask(() => {
      setCapJobByRecipeKey(buildCapJobByRecipeKey(payload.config, payload.state));
    });
  }, [payload]);

  useEffect(() => {
    if ((runtime.activity ?? 0) === 0) {
      queueMicrotask(() => setShowWelcomeModal(true));
    }
  }, [portalId, runtime.activity]);

  useEffect(() => {
    queueMicrotask(() => {
      setCapJobByRecipeKey((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          const id = next[key];
          if (id && !runtime.generating[id]) {
            next[key] = undefined;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });
  }, [runtime]);

  const productionEntries = useMemo(
    () => getProductionZoneEntries(payload.config, runtime),
    [payload.config, runtime],
  );

  const shopProductionPreview = useMemo(() => {
    if (!pendingShopItem) return null;
    return getShopPurchaseProductionPreview(
      payload.config,
      pendingShopItem.actionId,
    );
  }, [payload.config, pendingShopItem]);

  const onRecipeJobChange = useCallback(
    (slot: CapBalanceProductionSlot, jobId: string | undefined) => {
      const key = recipeJobKey(slot);
      setCapJobByRecipeKey((prev) => ({ ...prev, [key]: jobId }));
    },
    [],
  );

  const runMinigameAction = useCallback(
    async (
      input:
        | { action: string; amounts?: Record<string, number> }
        | {
            collectJobId: string;
            syncCollectWithServer?: boolean;
          },
    ): Promise<PlayerEconomyProcessResult> => {
      const prev = mergeRuntimeWithInitialBalances(
        config,
        minigameSessionToRuntime(playerEconomy, Date.now()),
      );
      const nowMs = Date.now();
      const local =
        "collectJobId" in input
          ? processPlayerEconomyGeneratorCollect(
              config,
              prev,
              input.collectJobId.trim(),
              nowMs,
            )
          : processPlayerEconomyAction(config, prev, {
              actionId: input.action,
              amounts: input.amounts,
              now: nowMs,
            });
      if (!local.ok) return local;

      const useServerCollect =
        "collectJobId" in input &&
        input.syncCollectWithServer === true &&
        Boolean(getMinigamesApiUrl() && jwt);

      if (useServerCollect) {
        try {
          const data = await postPlayerEconomyAction({
            token: jwt,
            itemId: input.collectJobId.trim(),
          });
          const mergedPe = mergeMinigameEconomyFromApi(
            runtimeToMinigameSession(prev),
            data.playerEconomy,
          );
          replacePlayerEconomy(mergedPe);
          const nextRt = mergeRuntimeWithInitialBalances(
            config,
            minigameSessionToRuntime(mergedPe, Date.now()),
          );
          return {
            ok: true,
            state: nextRt,
            collectGrants: data.collectGrants ?? local.collectGrants ?? [],
          };
        } catch (e) {
          return {
            ok: false,
            error:
              e instanceof Error ? e.message : t("minigame.dashboard.actionFailed"),
          };
        }
      }

      if ("collectJobId" in input) {
        commitLocalPlayerEconomySync({
          nextPlayerEconomy: runtimeToMinigameSession(local.state),
          collectJobId: input.collectJobId,
        });
      } else {
        commitLocalPlayerEconomySync({
          nextPlayerEconomy: runtimeToMinigameSession(local.state),
          action: input.action,
          amounts: input.amounts,
        });
      }

      return {
        ok: true,
        state: local.state,
        ...(local.generatorJobId !== undefined
          ? { generatorJobId: local.generatorJobId }
          : {}),
        ...(local.collectGrants !== undefined
          ? { collectGrants: local.collectGrants }
          : {}),
      };
    },
    [
      commitLocalPlayerEconomySync,
      config,
      jwt,
      playerEconomy,
      replacePlayerEconomy,
      t,
    ],
  );

  /** No-op: runtime is derived from session after {@link commitLocalPlayerEconomySync}. */
  const onRuntimeChange = useCallback(() => {}, []);

  const handleClose = useCallback(() => {
    requestClosePortal();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showInventoryModal) {
        setShowInventoryModal(false);
        return;
      }
      if (showMobileShop) {
        setShowMobileShop(false);
        setMobileShopPhase("list");
        setPendingShopItem(null);
        setShopActionError(null);
        return;
      }
      if (showShopConfirm) {
        setShowShopConfirm(false);
        setPendingShopItem(null);
        setShopActionError(null);
        return;
      }
      if (showWelcomeModal) {
        setShowWelcomeModal(false);
        return;
      }
      handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    handleClose,
    showInventoryModal,
    showMobileShop,
    showShopConfirm,
    showWelcomeModal,
  ]);

  const openMobileShopList = useCallback(() => {
    setShopActionError(null);
    setPendingShopItem(null);
    setShowMobileShop(true);
    setMobileShopPhase("list");
  }, []);

  const openInventory = useCallback((focusToken?: string) => {
    setInventoryFocusToken(focusToken ?? null);
    setInventoryModalKey((k) => k + 1);
    setShowInventoryModal(true);
  }, []);

  const onShopItemClick = (item: MinigameShopItemUi) => {
    if (isShopItemBoughtOrDisabled(item)) return;
    setShopActionError(null);
    setPendingShopItem(item);
    const desktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches;
    if (desktop) {
      setShowShopConfirm(true);
    } else {
      setShowMobileShop(true);
      setMobileShopPhase("detail");
    }
  };

  const onMobileShopListPick = (item: MinigameShopItemUi) => {
    if (isShopItemBoughtOrDisabled(item)) return;
    setShopActionError(null);
    setPendingShopItem(item);
    setMobileShopPhase("detail");
  };

  const confirmShopPurchase = () => {
    if (!pendingShopItem) return;
    if (!canAttemptShopPurchase(pendingShopItem, runtime.balances)) return;

    const local = processPlayerEconomyAction(config, runtime, {
      actionId: pendingShopItem.actionId,
      now: Date.now(),
    });
    if (!local.ok) {
      setShopActionError(local.error);
      return;
    }

    commitLocalPlayerEconomySync({
      nextPlayerEconomy: runtimeToMinigameSession(local.state),
      action: pendingShopItem.actionId,
    });
    setShowShopConfirm(false);
    setShowMobileShop(false);
    setMobileShopPhase("list");
    setPendingShopItem(null);
    setShopActionError(null);
  };

  const headerToken = payload.ui.headerBalanceToken ?? "";
  const headerBalance =
    headerToken !== ""
      ? new Decimal(runtime.balances[headerToken] ?? 0)
      : new Decimal(0);

  const tokenImages = payload.ui.tokenImages;
  const hasShop = payload.ui.shopItems.length > 0;
  const copy = payload.config.descriptions;

  if (Object.keys(actions).length === 0) {
    return (
      <div className="minigame-pixel-ui relative flex min-h-screen flex-col items-center justify-center gap-2 p-4">
        <DashboardBackdrop />
        <div className="relative z-10 max-w-md text-center text-sm text-white">
          {t("minigame.uiResources.emptyActions")}
        </div>
        <Button className="relative z-10" onClick={handleClose}>
          {t("close")}
        </Button>
      </div>
    );
  }

  return (
    <div className="minigame-pixel-ui relative flex h-screen w-full flex-col overflow-hidden">
      <DashboardBackdrop />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        {apiError ? (
          <div className="shrink-0 bg-red-900/80 px-2 py-1 text-center text-xs text-white">
            {apiError}{" "}
            <button
              type="button"
              className="underline"
              onClick={clearApiError}
            >
              {t("dismiss")}
            </button>
          </div>
        ) : null}

        <div className="relative mb-0.5 flex h-[70px] w-full items-center justify-between bg-black/20 pr-10">
          <div className="z-10 min-w-0 pl-4">
            <p className="truncate text-lg text-white text-shadow">
              {copy?.title ?? payload.displayName}
            </p>
            {copy?.subtitle ? (
              <p className="truncate text-xs text-white text-shadow">
                {copy.subtitle}
              </p>
            ) : null}
          </div>

          <div className="z-10 flex items-center">
            {headerToken ? (
              <>
                <img
                  src={getMinigameTokenImage(headerToken, tokenImages)}
                  alt=""
                  className="mr-1 w-8 object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
                <p className="text-sm text-white tabular-nums">
                  {headerBalance.toString()}
                </p>
              </>
            ) : null}
          </div>

          <button
            type="button"
            className="absolute right-2 flex-none cursor-pointer border-0 bg-transparent p-0"
            onClick={handleClose}
            aria-label={t("close")}
          >
            <img
              src={SUNNYSIDE.icons.close}
              alt=""
              style={{
                width: `${PIXEL_SCALE * 11}px`,
                height: `${PIXEL_SCALE * 11}px`,
                imageRendering: "pixelated",
              }}
            />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden md:flex-row md:p-2">
          {hasShop && (
            <div className="hidden min-h-0 w-[min(42vw,220px)] shrink-0 md:flex md:flex-col md:gap-2">
              <MinigameShopPanel
                items={payload.ui.shopItems}
                balances={runtime.balances}
                tokenImages={tokenImages}
                highlightedId={pendingShopItem?.id}
                onItemClick={onShopItemClick}
              />
            </div>
          )}

          <div className="flex min-h-0 min-w-0 flex-1 flex-row gap-2 overflow-y-hidden px-2 pt-2 md:pl-0 md:pr-2 md:pt-0">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <MinigameProductionZone
                entries={productionEntries}
                config={payload.config}
                runtime={runtime}
                tokenImages={tokenImages}
                onRuntimeChange={onRuntimeChange}
                capJobByRecipeKey={capJobByRecipeKey}
                onRecipeJobChange={onRecipeJobChange}
                dispatchAction={runMinigameAction}
              />
            </div>

            <div className="shrink-0 pr-0.5 pt-0.5 md:pr-1 md:pt-1">
              <MinigameInventoryHud
                shortcutTokens={payload.ui.inventoryShortcutTokens}
                inventoryItems={payload.ui.inventoryItems}
                balances={runtime.balances}
                tokenImages={tokenImages}
                onOpenInventory={openInventory}
                onOpenShop={hasShop ? openMobileShopList : undefined}
              />
            </div>
          </div>
        </div>

        <MinigameConfirmPanel
          show={showShopConfirm && !!pendingShopItem}
          title={pendingShopItem?.name ?? t("minigame.dashboard.shop")}
          confirmLabel={t("buy")}
          confirmDisabled={
            !!pendingShopItem &&
            !canAttemptShopPurchase(pendingShopItem, runtime.balances)
          }
          onClose={() => {
            setShowShopConfirm(false);
            setPendingShopItem(null);
            setShopActionError(null);
          }}
          onConfirm={confirmShopPurchase}
        >
          {pendingShopItem && (
            <MinigameShopDetailBody
              config={payload.config}
              item={pendingShopItem}
              shopProductionPreview={shopProductionPreview}
              tokenImages={tokenImages}
              balances={runtime.balances}
              shopActionError={shopActionError}
            />
          )}
        </MinigameConfirmPanel>

        <MinigameConfirmPanel
          show={showWelcomeModal}
          title={t("welcome.label")}
          confirmLabel={t("ok")}
          onClose={() => setShowWelcomeModal(false)}
          onConfirm={() => setShowWelcomeModal(false)}
        >
          <p className="text-xs leading-relaxed whitespace-pre-line text-[#3e2731]">
            {copy?.welcome ?? t("minigame.dashboard.welcomeFallback")}
          </p>
        </MinigameConfirmPanel>

        <MinigameMobileShopModal
          show={showMobileShop}
          phase={mobileShopPhase}
          items={payload.ui.shopItems}
          balances={runtime.balances}
          tokenImages={tokenImages}
          config={payload.config}
          detailItem={mobileShopPhase === "detail" ? pendingShopItem : null}
          shopProductionPreview={shopProductionPreview}
          shopActionError={shopActionError}
          highlightedId={pendingShopItem?.id}
          onClose={() => {
            setShowMobileShop(false);
            setMobileShopPhase("list");
            setPendingShopItem(null);
            setShopActionError(null);
          }}
          onListItemClick={onMobileShopListPick}
          onBuy={confirmShopPurchase}
          onBackToList={() => {
            setMobileShopPhase("list");
            setPendingShopItem(null);
            setShopActionError(null);
          }}
        />

        <MinigameInventoryModal
          key={inventoryModalKey}
          show={showInventoryModal}
          onClose={() => setShowInventoryModal(false)}
          inventoryItems={payload.ui.inventoryItems}
          balances={runtime.balances}
          tokenImages={tokenImages}
          focusToken={inventoryFocusToken}
        />
      </div>
    </div>
  );
};
