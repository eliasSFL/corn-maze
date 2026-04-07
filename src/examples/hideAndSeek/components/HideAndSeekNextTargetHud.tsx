import React from "react";
import { useStore } from "@nanostores/react";
import { $hideAndSeekRound, getCurrentEatTarget } from "../lib/hideAndSeekRoundStore";
import { formatNpcDisplayName } from "../lib/npcDisplayName";
import { BumpkinSheetPreview } from "./BumpkinSheetPreview";

/**
 * Compact top-right: crisp pixel portrait + name + progress.
 */
export const HideAndSeekNextTargetHud: React.FC = () => {
  const round = useStore($hideAndSeekRound);
  if (!round) return null;

  const total = round.eatOrder.length;
  const next = getCurrentEatTarget(round);
  const done = round.eatProgress;
  const allCaught = done >= total;

  return (
    <div
      className="absolute top-1 right-1 z-10 sm:top-2 sm:right-2 max-w-[min(13.5rem,calc(100vw-4.5rem))]"
      style={{ paddingRight: "max(0.25rem, env(safe-area-inset-right))" }}
    >
      <div className="flex items-center gap-2 border-2 border-[#3e2731] bg-[#e4a672] px-1.5 py-1 [box-shadow:2px_2px_0_#00000040] [image-rendering:pixelated]">
        {allCaught ? (
          <p className="text-[8px] leading-tight text-[#3e2731] px-0.5 py-0.5">
            Done — claim skull
          </p>
        ) : next ? (
          <>
            <div className="shrink-0 leading-none [&_canvas]:mx-0 [&_canvas]:[image-rendering:pixelated]">
              <BumpkinSheetPreview
                tokenParts={next.tokenParts}
                scale={2}
                className="leading-none"
              />
            </div>
            <div className="min-w-0 flex-1 pr-0.5">
              <p className="text-[7px] uppercase tracking-wide text-[#5a4a42] leading-none mb-0.5">
                Next
              </p>
              <p
                className="text-[10px] font-bold text-[#3e2731] leading-tight line-clamp-2 break-words"
                title={formatNpcDisplayName(next.npcName)}
              >
                {formatNpcDisplayName(next.npcName)}
              </p>
              <p className="text-[8px] text-[#5a4a42] tabular-nums leading-tight mt-0.5">
                {done + 1}/{total}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
