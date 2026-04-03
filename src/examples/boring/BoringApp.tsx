import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { BoringSessionProvider } from "examples/boring/BoringSessionContext";
import { WelcomePage } from "examples/boring/WelcomePage";
import { GamePage } from "examples/boring/GamePage";

export const BoringApp: React.FC = () => {
  return (
    <BrowserRouter>
      <BoringSessionProvider>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BoringSessionProvider>
    </BrowserRouter>
  );
};
