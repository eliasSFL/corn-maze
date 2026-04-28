import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { CornMazeHome } from "./CornMazeHome";
import { CornMazeGamePage } from "./CornMazeGamePage";

export const CornMazeRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<CornMazeHome />} />
      <Route path="/game" element={<CornMazeGamePage />} />
    </Routes>
  );
};
