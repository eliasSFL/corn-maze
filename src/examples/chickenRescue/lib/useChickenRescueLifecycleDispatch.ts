import { useCallback } from "react";
import { useMinigameSession } from "lib/portal";
import { chooksForScore } from "./chickenRescueMachine";
import {
  applyChickenRescueGameOverAdvanced,
  applyChickenRescueGameOverBasic,
  applyChickenRescueStartAdvanced,
  applyChickenRescueStartBasic,
} from "./chickenRescueLifecycle";
import { useChickenRescueActionIds } from "./useChickenRescueActionIds";

export function useChickenRescueLifecycleDispatch() {
  const { commitLocalPlayerEconomySync, playerEconomy } = useMinigameSession();
  const actionIds = useChickenRescueActionIds();

  const startBasicRun = useCallback((): boolean => {
    const applied = applyChickenRescueStartBasic(playerEconomy);
    if (!applied.ok) {
      return false;
    }
    return commitLocalPlayerEconomySync({
      action: actionIds.startBasic,
      nextPlayerEconomy: applied.playerEconomy,
    });
  }, [actionIds.startBasic, commitLocalPlayerEconomySync, playerEconomy]);

  const startAdvancedRun = useCallback((): boolean => {
    const applied = applyChickenRescueStartAdvanced(playerEconomy);
    if (!applied.ok) {
      return false;
    }
    return commitLocalPlayerEconomySync({
      action: actionIds.startAdvanced,
      nextPlayerEconomy: applied.playerEconomy,
    });
  }, [actionIds.startAdvanced, commitLocalPlayerEconomySync, playerEconomy]);

  const endRun = useCallback(
    (input: {
      runType: "basic" | "advanced";
      score: number;
      goldenCount: number;
    }): boolean => {
      const isAdvanced = input.runType === "advanced";
      if (isAdvanced) {
        const applied = applyChickenRescueGameOverAdvanced(
          playerEconomy,
          input.goldenCount,
        );
        if (!applied.ok) {
          return false;
        }
        return commitLocalPlayerEconomySync({
          action: actionIds.gameOverAdvanced,
          amounts: { "2": input.goldenCount },
          nextPlayerEconomy: applied.playerEconomy,
        });
      }
      const chooks = chooksForScore(input.score);
      const applied = applyChickenRescueGameOverBasic(playerEconomy, chooks);
      if (!applied.ok) {
        return false;
      }
      return commitLocalPlayerEconomySync({
        action: actionIds.gameOverBasic,
        amounts: { "1": chooks },
        nextPlayerEconomy: applied.playerEconomy,
      });
    },
    [
      actionIds.gameOverAdvanced,
      actionIds.gameOverBasic,
      commitLocalPlayerEconomySync,
      playerEconomy,
    ],
  );

  return { startBasicRun, startAdvancedRun, endRun };
}
