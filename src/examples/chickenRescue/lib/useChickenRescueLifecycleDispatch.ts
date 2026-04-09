import { useCallback } from "react";
import { postPlayerEconomyAction } from "lib/portal/api";
import { useMinigameSession } from "lib/portal";
import { getMinigamesApiUrl } from "lib/portal/url";
import type { MinigameActionDefinition } from "lib/portal/processAction";
import {
  applyOptimisticPortalAction,
  cloneMinigameSnapshot,
  mergeMinigameEconomyFromApi,
  normalizeMinigameFromApi,
} from "lib/portal/runtimeHelpers";
import { chooksForScore } from "./chickenRescueMachine";
import {
  applyMintOnlyFreeWorms,
  isMintOnlyWormGrant,
  markFreeWormsClaimedForUtcDay,
  markFreeWormsTimerStartedForUtcDay,
  resolveClaimFreeWormsDurationMs,
} from "./chickenRescueFreeWorms";
import {
  applyChickenRescueGameOverAdvanced,
  applyChickenRescueGameOverBasic,
  applyChickenRescueStartAdvanced,
  applyChickenRescueStartBasic,
} from "./chickenRescueLifecycle";
import { useChickenRescueActionIds } from "./useChickenRescueActionIds";

export function useChickenRescueLifecycleDispatch() {
  const {
    commitLocalPlayerEconomySync,
    playerEconomy,
    dispatchMinigameActionsSequential,
    economyMeta,
    actions,
    jwt,
    replacePlayerEconomy,
  } = useMinigameSession();
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

  const claimFreeWorms = useCallback(async (): Promise<void> => {
    const id = actionIds.claimFreeWorms;
    if (!id || !(id in actions)) {
      throw new Error("Free worms action is not available");
    }
    const def = actions[id] as MinigameActionDefinition;

    if (isMintOnlyWormGrant(def)) {
      const applied = applyMintOnlyFreeWorms(playerEconomy, def);
      const ok = commitLocalPlayerEconomySync({
        action: id,
        nextPlayerEconomy: applied.playerEconomy,
      });
      if (!ok) {
        throw new Error("Could not apply free worms");
      }
      markFreeWormsClaimedForUtcDay();
      return;
    }

    const durationMs = resolveClaimFreeWormsDurationMs(def);
    if (durationMs <= 0) {
      const api = getMinigamesApiUrl();
      const token = jwt?.trim();
      if (!api || !token) {
        const first = applyOptimisticPortalAction(
          actions,
          playerEconomy,
          { actionId: id },
          economyMeta?.items,
        );
        if (!first.ok || !first.generatorJobId) {
          throw new Error("Could not start free worms (offline)");
        }
        const seq = dispatchMinigameActionsSequential([
          { action: id },
          { collectJobId: first.generatorJobId },
        ]);
        if (!seq.ok) {
          throw new Error(
            "error" in seq ? seq.error : "Could not collect free worms (offline)",
          );
        }
        markFreeWormsClaimedForUtcDay();
        return;
      }

      const rollback = cloneMinigameSnapshot(playerEconomy);
      try {
        const r1 = await postPlayerEconomyAction({ token, action: id });
        const after1 = mergeMinigameEconomyFromApi(
          rollback,
          r1.playerEconomy,
        );
        let jobId = r1.generatorJobId;
        if (!jobId) {
          const keys = Object.keys(after1.generating ?? {});
          jobId = keys.length ? keys[keys.length - 1] : undefined;
        }
        if (!jobId) {
          throw new Error("Server did not return a worm production job");
        }
        const r2 = await postPlayerEconomyAction({ token, itemId: jobId });
        replacePlayerEconomy(
          normalizeMinigameFromApi(
            mergeMinigameEconomyFromApi(after1, r2.playerEconomy),
          ),
        );
        markFreeWormsClaimedForUtcDay();
      } catch (e) {
        replacePlayerEconomy(rollback);
        throw e instanceof Error ? e : new Error(String(e));
      }
      return;
    }

    const started = applyOptimisticPortalAction(
      actions,
      playerEconomy,
      { actionId: id },
      economyMeta?.items,
    );
    if (!started.ok) {
      throw new Error(
        "error" in started ? started.error : "Could not start worm production",
      );
    }
    const ok = commitLocalPlayerEconomySync({
      action: id,
      nextPlayerEconomy: started.playerEconomy,
    });
    if (!ok) {
      throw new Error("Could not start worm production");
    }
    markFreeWormsTimerStartedForUtcDay();
  }, [
    actionIds.claimFreeWorms,
    actions,
    commitLocalPlayerEconomySync,
    dispatchMinigameActionsSequential,
    economyMeta?.items,
    jwt,
    playerEconomy,
    replacePlayerEconomy,
  ]);

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

  return { startBasicRun, startAdvancedRun, endRun, claimFreeWorms };
}
