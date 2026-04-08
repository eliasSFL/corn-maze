import React, { createContext, useContext } from "react";

export type ChickenRescueRunType = "basic" | "advanced";

export type GameRunValue = {
  score: number;
  goldenCount: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  endAt: number;
  runType: ChickenRescueRunType;
};

const GameRunContext = createContext<GameRunValue | null>(null);

export function GameRunProvider({
  value,
  children,
}: {
  value: GameRunValue;
  children: React.ReactNode;
}) {
  return (
    <GameRunContext.Provider value={value}>{children}</GameRunContext.Provider>
  );
}

export function useGameRun(): GameRunValue {
  const v = useContext(GameRunContext);
  if (!v) {
    throw new Error("useGameRun outside GameRunProvider");
  }
  return v;
}
