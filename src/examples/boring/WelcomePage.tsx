import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "components/ui/Button";
import { useBoringSession } from "examples/boring/BoringSessionContext";

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { status, session, errorMessage, retry } = useBoringSession();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 p-6 bg-[#1a1a1a] text-[#e8e0d0]">
      <h1 className="text-2xl font-semibold tracking-tight">Boring</h1>

      {status === "loading" && (
        <p className="text-sm opacity-80">Loading session from API…</p>
      )}

      {status === "no_api" && (
        <p className="text-sm text-center max-w-md opacity-90">
          No API base URL. Set <code className="text-amber-200/90">VITE_API_URL</code>,{" "}
          open with <code className="text-amber-200/90">?network=</code>, or pass{" "}
          <code className="text-amber-200/90">?apiUrl=https://api-dev.sunflower-land.com</code>.
        </p>
      )}

      {status === "unauthorised" && (
        <p className="text-sm text-center max-w-md opacity-90">
          Missing portal JWT. Open this minigame from Sunflower Land, or add{" "}
          <code className="text-amber-200/90">?jwt=…</code> for local testing.
        </p>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-3 max-w-lg text-center">
          <p className="text-sm text-red-300/95 whitespace-pre-wrap">
            {errorMessage ?? "Request failed"}
          </p>
          <Button type="button" onClick={retry}>
            Retry
          </Button>
        </div>
      )}

      {status === "ready" && session && (
        <p className="text-sm opacity-85">
          Farm balance:{" "}
          <span className="text-amber-100 font-medium">{session.farm.balance}</span>
        </p>
      )}

      <Button
        type="button"
        onClick={() => navigate("/game")}
        disabled={status === "loading" || status === "unauthorised"}
      >
        Start
      </Button>

      {(status === "no_api" || status === "error") && (
        <p className="text-xs opacity-60 text-center max-w-sm">
          You can still use Start to try the Phaser scene while fixing API / JWT setup.
        </p>
      )}
    </div>
  );
};
