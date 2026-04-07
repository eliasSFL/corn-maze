import React, { useEffect, useRef, useState } from "react";
import { bumpkinSpritesheetUrl } from "../lib/bumpkinPreviewUrl";

const FRAME_W = 96;
const FRAME_H = 64;

type Props = {
  tokenParts: string;
  scale?: number;
  className?: string;
  /** Softer scaling for HUD previews (less blocky than pixel-art game canvas). */
  smooth?: boolean;
};

/**
 * Renders the first idle frame of a bumpkin spritesheet (for modal “wanted” poster).
 */
export const BumpkinSheetPreview: React.FC<Props> = ({
  tokenParts,
  scale = 2,
  className,
  smooth = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    setStatus("loading");
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setStatus("error");
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        canvas.width = FRAME_W * scale;
        canvas.height = FRAME_H * scale;
        ctx.imageSmoothingEnabled = smooth;
        if (smooth) {
          ctx.imageSmoothingQuality = "high";
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          0,
          0,
          FRAME_W,
          FRAME_H,
          0,
          0,
          FRAME_W * scale,
          FRAME_H * scale,
        );
        setStatus("ok");
      } catch {
        setStatus("error");
      }
    };
    img.onerror = () => setStatus("error");
    img.src = bumpkinSpritesheetUrl(tokenParts);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [tokenParts, scale, smooth]);

  return (
    <div className={className}>
      {status === "error" ? (
        <p className="text-[10px] text-[#6b5040]">Could not load bumpkin preview.</p>
      ) : null}
      <canvas
        ref={canvasRef}
        className="mx-auto block rounded-sm border border-[#3e2731]/30 bg-[#e4d4c4]/40 box-border"
        style={{
          imageRendering: smooth ? "auto" : "pixelated",
          visibility: status === "ok" ? "visible" : "hidden",
          minHeight: FRAME_H * scale,
          minWidth: FRAME_W * scale,
        }}
      />
    </div>
  );
};
