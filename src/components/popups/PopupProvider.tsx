import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { popupSingleton } from "lib/popupSingleton";
import type { PopupId } from "lib/popups";
import { $activePopupId } from "lib/popupActiveStore";
import { POPUP_REGISTRY } from "components/popups/popupRegistry";
import { markHideAndSeekRewardClaimed } from "examples/hideAndSeek/lib/hideAndSeekRoundStore";
import { resumeHideAndSeekPhaserPhysics } from "examples/hideAndSeek/lib/hideAndSeekSceneRef";
import { requestClosePortal } from "lib/portal/closePortal";

export function PopupProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [current, setCurrent] = useState<{
    id: PopupId;
    payload?: Record<string, unknown>;
  } | null>(null);

  const close = useCallback(() => {
    setCurrent((prev) => {
      if (prev?.id === "hideAndSeekClaim") {
        markHideAndSeekRewardClaimed();
        resumeHideAndSeekPhaserPhysics();
      }
      if (prev?.id === "hideAndSeekGameOver" || prev?.id === "hideAndSeekClaim") {
        requestClosePortal();
      }
      return null;
    });
  }, []);

  const open = useCallback(
    (id: PopupId, payload?: Record<string, unknown>) => {
      setCurrent({ id, payload });
    },
    [],
  );

  useLayoutEffect(() => {
    popupSingleton.bind(open, close);
    return () => popupSingleton.unbind();
  }, [open, close]);

  useLayoutEffect(() => {
    $activePopupId.set(current?.id ?? null);
  }, [current]);

  useEffect(() => {
    if (!current) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable=true]")) {
        return;
      }
      e.preventDefault();
      close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, close]);

  const Body = current ? POPUP_REGISTRY[current.id] : null;

  return (
    <>
      {children}
      {Body && current ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
          role="presentation"
          onClick={close}
        >
          <div
            className="max-w-md w-full relative z-[101]"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <Body onClose={close} payload={current.payload} />
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Thin wrapper — same as `popupSingleton` but tree-shakes cleanly from React modules. */
export function usePopup() {
  return {
    open: popupSingleton.open,
    close: popupSingleton.close,
  };
}
