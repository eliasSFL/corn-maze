import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const PIXEL_SCALE = 2.625;
import { SUNNYSIDE } from "example-assets/sunnyside";
import worldIcon from "example-assets/icons/world.png";
import { HudContainer } from "components/ui/HudContainer";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { isTouchDevice } from "features/world/lib/device";

export const ChickenRescueHUD: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAppTranslation();

  const [showMoveHint, setShowMoveHint] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setShowMoveHint(false), 5000);
    const onFirstChook = () => setShowMoveHint(false);
    window.addEventListener("chicken-rescue-dismiss-move-hint", onFirstChook);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener(
        "chicken-rescue-dismiss-move-hint",
        onFirstChook,
      );
    };
  }, []);

  return (
    <HudContainer>
      <div
        className="fixed z-50 flex flex-col justify-between"
        style={{
          left: `${PIXEL_SCALE * 3}px`,
          bottom: `${PIXEL_SCALE * 3}px`,
          width: `${PIXEL_SCALE * 22}px`,
        }}
      >
        <div
          id="travel"
          className="flex relative z-50 justify-center cursor-pointer hover:img-highlight"
          style={{
            width: `${PIXEL_SCALE * 22}px`,
            height: `${PIXEL_SCALE * 23}px`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            navigate("/home");
          }}
        >
          <img
            src={SUNNYSIDE.ui.round_button}
            className="absolute"
            style={{
              width: `${PIXEL_SCALE * 22}px`,
            }}
          />
          <img
            src={worldIcon}
            style={{
              width: `${PIXEL_SCALE * 12}px`,
              left: `${PIXEL_SCALE * 5}px`,
              top: `${PIXEL_SCALE * 4}px`,
            }}
            className="absolute"
          />
        </div>
      </div>

      {showMoveHint && (
        <div className="absolute w-full h-full pointer-events-none">
          <div className="absolute w-full h-full bg-black opacity-50" />
          <div className="flex items-center justify-center absolute inset-0">
            <span className="text-white text-center">
              {isTouchDevice()
                ? t("minigame.swipeToMove")
                : t("minigame.arrowKeysToMove")}
            </span>
          </div>
        </div>
      )}
    </HudContainer>
  );
};
