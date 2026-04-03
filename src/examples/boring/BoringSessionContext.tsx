import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CONFIG } from "lib/config";
import {
  decodePortalToken,
  getJwt,
  getPlayerEconomySession,
  getUrl,
  type MinigameSessionResponse,
} from "lib/portal";

export type BoringSessionStatus =
  | "loading"
  | "ready"
  | "unauthorised"
  | "no_api"
  | "error";

type Ctx = {
  status: BoringSessionStatus;
  session: MinigameSessionResponse | null;
  errorMessage: string | null;
  retry: () => void;
};

const BoringSessionContext = createContext<Ctx | null>(null);

async function loadSession(): Promise<MinigameSessionResponse> {
  const base = getUrl();
  if (!base) {
    throw new Error("NO_API");
  }
  const jwt = getJwt();
  if (!jwt) {
    throw new Error("NO_JWT");
  }
  const { portalId: fromJwt } = decodePortalToken(jwt);
  const portalId = fromJwt ?? (CONFIG.PORTAL_APP ?? "").trim();
  if (!portalId) {
    throw new Error(
      "Portal JWT is missing portalId; re-open the minigame from the game or set VITE_PORTAL_APP.",
    );
  }
  return getPlayerEconomySession({ portalId, token: jwt });
}

export const BoringSessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState<BoringSessionStatus>("loading");
  const [session, setSession] = useState<MinigameSessionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const run = useCallback(() => {
    const base = getUrl();
    const jwt = getJwt();

    if (!base) {
      setStatus("no_api");
      setSession(null);
      setErrorMessage(null);
      return;
    }

    if (!jwt) {
      setStatus("unauthorised");
      setSession(null);
      setErrorMessage(null);
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    void loadSession()
      .then((s) => {
        setSession(s);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === "NO_API") {
          setStatus("no_api");
          setSession(null);
        } else if (msg === "NO_JWT") {
          setStatus("unauthorised");
          setSession(null);
        } else {
          setStatus("error");
          setSession(null);
          setErrorMessage(msg);
        }
      });
  }, []);

  useEffect(() => {
    run();
  }, [run, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const value = useMemo<Ctx>(
    () => ({ status, session, errorMessage, retry }),
    [status, session, errorMessage, retry],
  );

  return (
    <BoringSessionContext.Provider value={value}>
      {children}
    </BoringSessionContext.Provider>
  );
};

export function useBoringSession(): Ctx {
  const ctx = useContext(BoringSessionContext);
  if (!ctx) {
    throw new Error("useBoringSession must be used within BoringSessionProvider");
  }
  return ctx;
}
