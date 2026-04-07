import React, { useEffect } from "react";
import { Panel } from "components/ui/Panel";
import { Label } from "components/ui/Label";
import { Button } from "components/ui/Button";
import type { PopupRenderProps } from "lib/popups";
import { assignAppHome } from "lib/assignAppHome";
import { formatNpcDisplayName } from "../lib/npcDisplayName";
import { BumpkinSheetPreview } from "./BumpkinSheetPreview";
import {
  markBumpkinHunterGameOverPosting,
  postBumpkinHunterGameOver,
} from "../lib/bumpkinHunterPortal";

export const HideAndSeekGameOverPopup: React.FC<PopupRenderProps> = ({
  onClose,
  payload,
}) => {
  useEffect(() => {
    if (!markBumpkinHunterGameOverPosting()) return;
    void postBumpkinHunterGameOver().catch((err) => {
      console.error("Bumpkin Hunter GAMEOVER action failed:", err);
    });
  }, []);

  const tokenParts =
    typeof payload?.tokenParts === "string" ? payload.tokenParts : "";
  const npcNameRaw =
    typeof payload?.npcName === "string" ? payload.npcName : "";

  return (
    <Panel className="w-full">
      <div className="flex flex-col gap-3 p-1 items-center">
        <Label type="danger">Game over</Label>
        <p className="text-xs text-[#3e2731] leading-relaxed text-center">
          That was not the next bumpkin in order. You walked into this one by mistake:
        </p>
        {npcNameRaw ? (
          <p className="text-xs font-bold text-[#3e2731] text-center">
            {formatNpcDisplayName(npcNameRaw)}
          </p>
        ) : null}
        {tokenParts ? (
          <BumpkinSheetPreview tokenParts={tokenParts} scale={2} className="w-full" />
        ) : null}
        <div className="flex flex-row flex-wrap gap-2 justify-center w-full">
          <Button type="button" onClick={() => assignAppHome()}>
            Try again
          </Button>
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="text-[9px] text-[#6b5040] text-center leading-snug">
          Try again reloads for a new round. Close exits the minigame. Backdrop or Space also closes.
        </p>
      </div>
    </Panel>
  );
};
