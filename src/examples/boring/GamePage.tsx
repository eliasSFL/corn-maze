import React from "react";
import { Link } from "react-router-dom";
import { PhaserGame } from "components/PhaserGame";

export const GamePage: React.FC = () => {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-6 bg-[#141414] text-[#e8e0d0]">
      <PhaserGame />
      <Link
        to="/"
        className="text-sm underline underline-offset-2 opacity-80 hover:opacity-100"
      >
        Back to welcome
      </Link>
    </div>
  );
};
