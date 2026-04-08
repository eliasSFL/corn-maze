import React, { useEffect, useRef, useState } from "react";
import { CONFIG } from "lib/config";
import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { decodePortalToken } from "./decodePortalToken";
import { getJwt, getMinigamesApiUrl } from "./url";
import { getPlayerEconomySession, postPlayerEconomyAction } from "./api";
import type { BootstrapContext, MinigameSessionResponse } from "./types";
import {
  emptySessionMinigame,
  normalizeMinigameFromApi,
} from "./runtimeHelpers";
import { MinigameSessionProvider } from "./sessionProvider";
import { requestClosePortal } from "./closePortal";

export type PortalBootstrapConfig = {
  offlineActions: Record<string, unknown>;
  bootstrapAction?: string;
  offlineMinigame?: () => MinigameSessionResponse["playerEconomy"];
};

async function tryBootstrapAction(
  token: string,
  action: string,
  economy: MinigameSessionResponse["playerEconomy"],
): Promise<MinigameSessionResponse["playerEconomy"]> {
  try {
    const { playerEconomy: next } = await postPlayerEconomyAction({
      token,
      action,
    });
    return normalizeMinigameFromApi(next);
  } catch {
    return economy;
  }
}

type Phase = "unauthorised" | "loading" | "error" | "ready";

const MinigamePortalBootstrapOverlay: React.FC<{
  phase: Phase;
  errorMessage: string | null;
  onRetry: () => void;
}> = ({ phase, errorMessage, onRetry }) => {
  const { t } = useAppTranslation();

  if (phase === "ready") {
    return null;
  }

  if (phase === "unauthorised") {
    return (
      <Modal show>
        <Panel>
          <div className="p-2">
            <Label type="danger">{t("error")}</Label>
            <span className="text-sm my-2 block">{t("session.expired")}</span>
          </div>
          <Button onClick={() => requestClosePortal()}>{t("close")}</Button>
        </Panel>
      </Modal>
    );
  }

  if (phase === "error") {
    return (
      <Modal show>
        <Panel>
          <div className="p-2">
            <Label type="danger">{t("error")}</Label>
            <span className="text-sm my-2 block">
              {errorMessage || t("error.wentWrong")}
            </span>
          </div>
          <Button onClick={onRetry}>{t("retry")}</Button>
        </Panel>
      </Modal>
    );
  }

  return (
    <Modal show>
      <Panel>
        <div className="p-4 flex flex-col items-center gap-2">
          <p className="text-sm">{t("loading")}</p>
          <span className="text-xs opacity-70">
            {t("last.updated")}
            {CONFIG.CLIENT_VERSION}
          </span>
        </div>
      </Panel>
    </Modal>
  );
};

/**
 * Loads Minigames session (or offline stub), then provides {@link useMinigameSession}.
 * Replaces the previous xstate-based portal bootstrap.
 */
export const MinigamePortalProvider: React.FC<
  PortalBootstrapConfig & { children: React.ReactNode }
> = ({ children, offlineActions, bootstrapAction, offlineMinigame }) => {
  const [phase, setPhase] = useState<Phase>("loading");
  const [bootstrap, setBootstrap] = useState<BootstrapContext | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const configRef = useRef({
    offlineActions,
    bootstrapAction,
    offlineMinigame,
  });
  configRef.current = { offlineActions, bootstrapAction, offlineMinigame };

  useEffect(() => {
    let cancelled = false;
    const cfg = configRef.current;

    (async () => {
      const jwt = getJwt() ?? "";
      const apiUrl = getMinigamesApiUrl();

      if (apiUrl && !jwt) {
        if (!cancelled) {
          setPhase("unauthorised");
        }
        return;
      }

      if (!cancelled) {
        setPhase("loading");
        setErrorMessage(null);
      }

      try {
        if (!apiUrl) {
          const portalId = (CONFIG.PORTAL_APP ?? "").trim();
          const ctx: BootstrapContext = {
            id: 0,
            jwt: "",
            portalId,
            farm: { balance: "0" },
            playerEconomy:
              cfg.offlineMinigame?.() ?? emptySessionMinigame(),
            actions: cfg.offlineActions,
          };
          if (!cancelled) {
            setBootstrap(ctx);
            setPhase("ready");
          }
          return;
        }

        const { farmId, portalId: fromJwt } = decodePortalToken(jwt);
        const portalId = fromJwt ?? (CONFIG.PORTAL_APP ?? "").trim();
        if (!portalId) {
          throw new Error(
            "Portal JWT is missing portalId; re-open the minigame from the game or set VITE_PORTAL_APP.",
          );
        }

        const session = await getPlayerEconomySession({ token: jwt });
        let playerEconomy = normalizeMinigameFromApi(session.playerEconomy);
        if (cfg.bootstrapAction) {
          playerEconomy = await tryBootstrapAction(
            jwt,
            cfg.bootstrapAction,
            playerEconomy,
          );
        }

        const ctx: BootstrapContext = {
          id: farmId ?? 0,
          jwt,
          portalId,
          farm: session.farm,
          playerEconomy,
          actions: session.actions,
        };
        if (!cancelled) {
          setBootstrap(ctx);
          setPhase("ready");
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMessage(e instanceof Error ? e.message : String(e));
          setPhase("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  const onRetry = () => {
    setBootstrap(null);
    setRetryKey((k) => k + 1);
    setPhase("loading");
  };

  if (phase === "ready" && bootstrap) {
    return (
      <MinigameSessionProvider bootstrap={bootstrap}>
        {children}
      </MinigameSessionProvider>
    );
  }

  return (
    <>
      <MinigamePortalBootstrapOverlay
        phase={phase}
        errorMessage={errorMessage}
        onRetry={onRetry}
      />
    </>
  );
};
