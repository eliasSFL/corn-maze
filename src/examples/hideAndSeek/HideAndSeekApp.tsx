import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HideAndSeekGamePage } from "./HideAndSeekGamePage";

/** Hide and Seek — Phaser scene at `/`. */
export const HideAndSeekApp: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HideAndSeekGamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
