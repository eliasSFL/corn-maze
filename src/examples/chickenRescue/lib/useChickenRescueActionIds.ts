import { useMemo } from "react";
import { useMinigameSession } from "lib/portal";
import {
  resolveChickenRescuePortalActionIds,
  type ChickenRescuePortalActionIds,
} from "./chickenRescuePortalActionIds";

export function useChickenRescueActionIds(): ChickenRescuePortalActionIds {
  const { actions } = useMinigameSession();
  return useMemo(() => resolveChickenRescuePortalActionIds(actions), [actions]);
}
