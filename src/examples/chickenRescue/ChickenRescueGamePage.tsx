import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { Box } from "components/ui/Box";
import chookIcon from "example-assets/icons/chook.webp";
import goldenChookIcon from "example-assets/sfts/golden_chook.png";
import { NPC_WEARABLES } from "lib/npcs";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import {
  chooksForScore,
  GAME_SECONDS,
  hasLiveGame,
} from "./lib/chickenRescueMachine";
import { useMinigameSession } from "lib/portal";
import { useChickenRescueLifecycleDispatch } from "./lib/useChickenRescueLifecycleDispatch";
import { GameRunProvider } from "./lib/GameRunContext";
import { defaultPhaserHandlers } from "./lib/chickenRescuePhaserApi";
import type { ChickenRescuePhaserApiRef } from "./lib/chickenRescuePhaserApi";
import { ChickenRescueGame } from "./ChickenRescueGame";
import type { ChickenRescueRunType } from "./lib/GameRunContext";
import { ChickenRescueHUD } from "./components/ChickenRescueHUD";

export const ChickenRescueGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useAppTranslation();
  const { playerEconomy, farm, farmId } = useMinigameSession();
  const { endRun } = useChickenRescueLifecycleDispatch();

  const scoreRef = useRef(0);
  const goldenRef = useRef(0);
  const [score, setScore] = useState(0);
  const [goldenCount, setGoldenCount] = useState(0);
  const [endAt] = useState(() => Date.now() + GAME_SECONDS * 1000);
  const [runEnd, setRunEnd] = useState<"playing" | "results">("playing");
  const resultsShown = useRef(false);
  const phaserApiRef = useRef(
    defaultPhaserHandlers(),
  ) as ChickenRescuePhaserApiRef;

  const runQuery = searchParams.get("run");

  const runType: ChickenRescueRunType =
    runQuery === "advanced" ||
    ((playerEconomy.balances.ADVANCED_GAME ?? 0) > 0 && runQuery !== "basic")
      ? "advanced"
      : "basic";

  useEffect(() => {
    const startedFromHome = runQuery === "basic" || runQuery === "advanced";
    console.log("[CR-run-debug] GamePage redirect guard", {
      runQuery,
      startedFromHome,
      hasLive: hasLiveGame(playerEconomy),
      LIVE_GAME: playerEconomy.balances.LIVE_GAME,
      ADVANCED_GAME: playerEconomy.balances.ADVANCED_GAME,
    });
    if (startedFromHome) {
      return;
    }
    if (!hasLiveGame(playerEconomy)) {
      console.log("[CR-run-debug] GamePage redirect -> /home (no run query)");
      navigate("/home", { replace: true });
    }
  }, [playerEconomy, navigate, runQuery]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const openResultsModal = useCallback(() => {
    if (resultsShown.current) {
      return;
    }
    resultsShown.current = true;
    setRunEnd("results");
  }, []);

  useLayoutEffect(() => {
    phaserApiRef.current.getScore = () => scoreRef.current;
    phaserApiRef.current.onChickenRescued = (p, meta) => {
      setScore((s) => s + p);
      if (meta?.golden) {
        setGoldenCount((prev) => {
          const next = Math.min(3, prev + 1);
          goldenRef.current = next;
          return next;
        });
      }
    };
    phaserApiRef.current.onGameOver = openResultsModal;
  }, [openResultsModal]);

  const onClaim = useCallback(() => {
    const final = scoreRef.current;
    const finalGolden = goldenRef.current;
    const isAdvanced = runType === "advanced";
    const chooks = chooksForScore(final);
    const won = isAdvanced ? finalGolden > 0 : chooks > 0;
    const ok = endRun({
      runType: isAdvanced ? "advanced" : "basic",
      score: final,
      goldenCount: finalGolden,
    });
    if (ok) {
      // Stay inside the iframe on /home so the minigame API can finish and the
      // player can start another run. Closing the parent iframe races the save.
      navigate("/home", { replace: true });
    } else {
      console.error("[ChickenRescue] Continue: endRun returned false", {
        won,
        runType: isAdvanced ? "advanced" : "basic",
        score: final,
        chooksForPayout: chooks,
        goldenCount: finalGolden,
        amounts: isAdvanced ? { "2": finalGolden } : { "1": chooks },
        LIVE_GAME: playerEconomy.balances.LIVE_GAME,
        ADVANCED_GAME: playerEconomy.balances.ADVANCED_GAME,
      });
    }
  }, [endRun, navigate, playerEconomy.balances, runType]);

  const chooksEarned = chooksForScore(score);

  const gameRunValue = useMemo(
    () => ({
      score,
      goldenCount,
      setScore,
      endAt,
      runType,
    }),
    [score, goldenCount, endAt, runType],
  );

  return (
    <GameRunProvider value={gameRunValue}>
      <div className="relative min-h-screen w-full bg-black">
        <ChickenRescueGame
          bumpkin={farm?.bumpkin}
          farmId={farmId}
          phaserApiRef={phaserApiRef}
          runType={runType}
        />
        {runEnd === "playing" && <ChickenRescueHUD />}

        {runEnd === "results" && (
          <Modal show>
            <Panel bumpkinParts={NPC_WEARABLES["pumpkin' pete"]}>
              <div className="p-1">
                <Label type="default" className="mb-2">
                  {t("minigame.chickenRescue.gameOver")}
                </Label>
                {runType === "advanced" ? (
                  <div className="flex flex-col gap-2 mb-1">
                    <div className="flex flex-row items-center gap-2">
                      <Box image={goldenChookIcon} hideCount />
                      <span className="text-xs text-[#3e2731]">
                        {t("minigame.chickenRescue.foundGoldenChooksLine", {
                          count: goldenCount,
                        })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm mb-2 text-[#3e2731]">
                      {chooksEarned > 0
                        ? t("minigame.chickenRescue.resultsFoundChooks")
                        : t("minigame.chickenRescue.resultsNoChooks")}
                    </p>
                    <div className="flex flex-col gap-2 mb-1">
                      <div className="flex flex-row items-center gap-2">
                        <Box image={chookIcon} hideCount />
                        <span className="text-xs text-[#3e2731]">
                          {t("minigame.chickenRescue.foundChooksLine", {
                            count: chooksEarned,
                          })}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Button className="mt-1 w-full" onClick={onClaim}>
                {t("continue")}
              </Button>
            </Panel>
          </Modal>
        )}
      </div>
    </GameRunProvider>
  );
};
