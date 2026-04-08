import React from "react";

import { SUNNYSIDE } from "example-assets/sunnyside";
import { Button } from "components/ui/Button";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { Label } from "components/ui/Label";
import { PIXEL_SCALE } from "lib/constants";
import { pixelSpeechBubbleBorderStyle } from "lib/style";

export const MinigameCoins: React.FC<{ coinsLeft: number }> = ({
  coinsLeft,
}) => {
  const { t } = useAppTranslation();

  if (coinsLeft > 0) {
    return (
      <Label type="vibrant">{`${coinsLeft} ${t(
        "minigame.coinsRemaining",
      )}`}</Label>
    );
  }

  return <Label type="danger">{t("minigame.noCoinsRemaining")}</Label>;
};

interface Props {
  onStartBasic: () => void;
  onStartAdvanced: () => void;
  onClose: () => void;
  coinsLeft: number;
}

export const ChickenRescueRules: React.FC<Props> = ({
  onStartBasic,
  onStartAdvanced,
  onClose,
  coinsLeft,
}) => {
  const { t } = useAppTranslation();

  return (
    <>
      <div>
        <div className="w-full relative flex justify-between p-1 items-center mb-2">
          <Label type="default" icon={SUNNYSIDE.npcs.bumpkin}>
            {t("minigame.chickenRescue")}
          </Label>
          <MinigameCoins coinsLeft={coinsLeft} />
        </div>
        <div
          className="text-sm text-[#3e2731] mb-2 ml-0.5"
          style={{
            ...pixelSpeechBubbleBorderStyle,
            padding: `${PIXEL_SCALE * 2}px ${PIXEL_SCALE * 3}px`,
            maxWidth: `${PIXEL_SCALE * 120}px`,
          }}
        >
          <p className="whitespace-pre-line leading-snug font-medium">
            {t("minigame.chickenRescueBumpkinDialogue")}
          </p>
        </div>
      </div>
      <div className="flex space-x-1">
        <Button
          className="mt-1 whitespace-nowrap capitalize"
          onClick={() => {
            onClose();
          }}
        >
          {t("exit")}
        </Button>
        <Button
          className="mt-1 whitespace-nowrap capitalize"
          onClick={() => {
            onStartBasic();
          }}
          disabled={coinsLeft <= 0}
        >
          Basic Run (1 Worm)
        </Button>
        <Button
          className="mt-1 whitespace-nowrap capitalize"
          onClick={() => {
            onStartAdvanced();
          }}
        >
          Advanced Run (1 Worm Ball)
        </Button>
      </div>
    </>
  );
};
