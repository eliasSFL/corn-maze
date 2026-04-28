import React, { useMemo } from "react";
import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";

import { MinigamePortalProvider } from "lib/portal";
import { useMinigameSession } from "lib/portal/sessionProvider";
import { MmoRoomProvider } from "lib/mmo";
import type { GuestBumpkinJoin } from "lib/mmo/types";
import { tokenUriBuilder, type BumpkinParts } from "lib/utils/tokenUriBuilder";
import { createDefaultGuestBumpkin } from "lib/mmo/defaultGuestBumpkin";
import {
  createGoldenCropsOfflineMinigame,
  GOLDEN_CROPS_OFFLINE_ACTIONS,
  GOLDEN_CROPS_OFFLINE_ECONOMY_META,
} from "./lib/goldenCropsOfflineMinigame";
import { GOLDEN_CROPS_MINIGAME_SLUG } from "./lib/goldenCropsSlug";
import { GoldenCropsGamePage } from "./GoldenCropsGamePage";

/** Registry key for tokenParts. */
export const PLAYER_TOKEN_PARTS_REGISTRY_KEY = "playerTokenParts";

/** Registry key for the economy dispatch function. */
export const ECONOMY_DISPATCH_REGISTRY_KEY = "economyDispatch";

function useBumpkinFromSession(): {
  bumpkinJoin: GuestBumpkinJoin;
  tokenParts: string;
} {
  const { farm } = useMinigameSession();

  return useMemo(() => {
    const bumpkin = farm.bumpkin as
      | { equipped?: Record<string, string>; experience?: number; id?: number }
      | undefined;

    const equipped = bumpkin?.equipped;

    if (!equipped) {
      const fallback = createDefaultGuestBumpkin();
      const parts: BumpkinParts = {
        background: fallback.equipped.background as BumpkinParts["background"],
        body: fallback.equipped.body as BumpkinParts["body"],
        hair: fallback.equipped.hair as BumpkinParts["hair"],
        shirt: fallback.equipped.shirt as BumpkinParts["shirt"],
        pants: fallback.equipped.pants as BumpkinParts["pants"],
        shoes: fallback.equipped.shoes as BumpkinParts["shoes"],
        tool: fallback.equipped.tool as BumpkinParts["tool"],
      };
      return { bumpkinJoin: fallback, tokenParts: tokenUriBuilder(parts) };
    }

    const parts: BumpkinParts = {
      background: (equipped.background || undefined) as BumpkinParts["background"],
      body: (equipped.body || undefined) as BumpkinParts["body"],
      hair: (equipped.hair || undefined) as BumpkinParts["hair"],
      shirt: (equipped.shirt || undefined) as BumpkinParts["shirt"],
      pants: (equipped.pants || undefined) as BumpkinParts["pants"],
      shoes: (equipped.shoes || undefined) as BumpkinParts["shoes"],
      tool: (equipped.tool || undefined) as BumpkinParts["tool"],
      hat: (equipped.hat || undefined) as BumpkinParts["hat"],
      necklace: (equipped.necklace || undefined) as BumpkinParts["necklace"],
      secondaryTool: (equipped.secondaryTool || undefined) as BumpkinParts["secondaryTool"],
      coat: (equipped.coat || undefined) as BumpkinParts["coat"],
      onesie: (equipped.onesie || undefined) as BumpkinParts["onesie"],
      suit: (equipped.suit || undefined) as BumpkinParts["suit"],
      wings: (equipped.wings || undefined) as BumpkinParts["wings"],
      dress: (equipped.dress || undefined) as BumpkinParts["dress"],
      beard: (equipped.beard || undefined) as BumpkinParts["beard"],
      aura: (equipped.aura || undefined) as BumpkinParts["aura"],
    };

    const tokenParts = tokenUriBuilder(parts);

    const bumpkinJoin: GuestBumpkinJoin = {
      equipped: {
        background: equipped.background ?? "",
        body: equipped.body ?? "",
        hair: equipped.hair ?? "",
        shoes: equipped.shoes ?? "",
        pants: equipped.pants ?? "",
        tool: equipped.tool ?? "",
        shirt: equipped.shirt ?? "",
        coat: equipped.coat ?? "",
        onesie: equipped.onesie ?? "",
        suit: equipped.suit ?? "",
        dress: equipped.dress ?? "",
        hat: equipped.hat ?? "",
        wings: equipped.wings ?? "",
        beard: equipped.beard ?? "",
        aura: equipped.aura ?? "",
      },
      experience: bumpkin?.experience ?? 0,
      id: bumpkin?.id ?? 0,
      skills: {},
      tokenUri: tokenParts,
      achievements: {},
    };

    return { bumpkinJoin, tokenParts };
  }, [farm.bumpkin]);
}

const GoldenCropsInner: React.FC = () => {
  const { farmId } = useMinigameSession();
  const { bumpkinJoin, tokenParts } = useBumpkinFromSession();

  const connectOptions = useMemo(
    () => ({
      sceneId: GOLDEN_CROPS_MINIGAME_SLUG,
      farmId,
      bumpkin: bumpkinJoin,
    }),
    [farmId, bumpkinJoin],
  );

  return (
    <MmoRoomProvider connectOptions={connectOptions}>
      <GoldenCropsGamePage tokenParts={tokenParts} />
    </MmoRoomProvider>
  );
};

export const GoldenCropsApp: React.FC = () => {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <MinigamePortalProvider
        offlineActions={GOLDEN_CROPS_OFFLINE_ACTIONS}
        offlineMinigame={createGoldenCropsOfflineMinigame}
        offlineEconomyMeta={GOLDEN_CROPS_OFFLINE_ECONOMY_META}
      >
        <Routes>
          <Route path="/" element={<GoldenCropsInner />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MinigamePortalProvider>
    </MemoryRouter>
  );
};
