import React, { useEffect } from "react";
import { Panel } from "components/ui/Panel";
import { Label } from "components/ui/Label";
import { Button } from "components/ui/Button";
import type { PopupRenderProps } from "lib/popups";
import { assignAppHome } from "lib/assignAppHome";
import { markHideAndSeekRewardClaimed } from "../lib/hideAndSeekRoundStore";
import { resumeHideAndSeekPhaserPhysics } from "../lib/hideAndSeekSceneRef";
import {
  markBumpkinHunterGameOverPosting,
  postBumpkinHunterGameOver,
} from "../lib/bumpkinHunterPortal";

export const HideAndSeekClaimPopup: React.FC<PopupRenderProps> = ({ onClose }) => {
  useEffect(() => {
    if (!markBumpkinHunterGameOverPosting()) return;
    void postBumpkinHunterGameOver().catch((err) => {
      console.error("Bumpkin Hunter GAMEOVER action failed:", err);
    });
  }, []);

  useEffect(() => {
    return () => {
      resumeHideAndSeekPhaserPhysics();
    };
  }, []);

  const onPlayAgain = () => {
    markHideAndSeekRewardClaimed();
    resumeHideAndSeekPhaserPhysics();
    assignAppHome();
  };

  return (
    <Panel className="w-full">
      <div className="flex flex-col gap-3 p-1 items-center">
        <Label type="warning">Order complete!</Label>
        <p className="text-xs text-[#3e2731] leading-relaxed text-center">
          You ate every bumpkin in the right order. Skulls were added for each catch — your rewards are
          synced to Sunflower Land.
        </p>
        <div className="flex flex-row flex-wrap gap-2 justify-center w-full">
          <Button type="button" onClick={onPlayAgain}>
            Try again
          </Button>
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="text-[9px] text-[#6b5040] text-center leading-snug">
          Close exits the minigame. Try again reloads this page for a new hunt.
        </p>
      </div>
    </Panel>
  );
};
