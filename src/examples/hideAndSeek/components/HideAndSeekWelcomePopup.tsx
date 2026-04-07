import React from "react";
import { Panel } from "components/ui/Panel";
import { Label } from "components/ui/Label";
import { Button } from "components/ui/Button";
import type { PopupRenderProps } from "lib/popups";
import { formatNpcDisplayName } from "../lib/npcDisplayName";
import { BumpkinSheetPreview } from "./BumpkinSheetPreview";

export const HideAndSeekWelcomePopup: React.FC<PopupRenderProps> = ({
  onClose,
  payload,
}) => {
  const tokenParts =
    typeof payload?.tokenParts === "string" ? payload.tokenParts : "";
  const npcNameRaw =
    typeof payload?.npcName === "string" ? payload.npcName : "";

  return (
    <Panel className="w-full">
      <div className="flex flex-col gap-3 p-1 items-center">
        <Label type="chill">Hide and Seek</Label>
        <p className="text-xs text-[#3e2731] leading-relaxed text-center">
          Eat every bumpkin on screen in a strict order. The next NPC (name + portrait) is always in
          the top-right HUD — after each catch, that updates. Bump the wrong one first and it is game
          over. Each catch makes the rest move 10% faster.
        </p>
        {npcNameRaw ? (
          <p className="text-xs font-bold text-[#3e2731] text-center">
            First up: {formatNpcDisplayName(npcNameRaw)}
          </p>
        ) : null}
        {tokenParts ? (
          <BumpkinSheetPreview tokenParts={tokenParts} scale={2} className="w-full" />
        ) : null}
        <Button type="button" onClick={onClose}>
          Start seeking
        </Button>
      </div>
    </Panel>
  );
};
