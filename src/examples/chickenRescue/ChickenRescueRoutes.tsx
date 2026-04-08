import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { useMinigameSession } from "lib/portal";
import { ChickenRescueHome } from "./ChickenRescueHome";
import { ChickenRescueGamePage } from "./ChickenRescueGamePage";

const ApiErrorModal: React.FC = () => {
  const { apiError, clearApiError } = useMinigameSession();
  const { t } = useAppTranslation();

  if (!apiError) {
    return null;
  }

  return (
    <Modal show>
      <Panel>
        <div className="p-2">
          <Label type="danger">{t("error")}</Label>
          <span className="text-sm my-2 block">{apiError}</span>
        </div>
        <Button onClick={clearApiError}>{t("close")}</Button>
      </Panel>
    </Modal>
  );
};

export const ChickenRescueRoutes: React.FC = () => {
  return (
    <>
      <ApiErrorModal />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<ChickenRescueHome />} />
        <Route path="/game" element={<ChickenRescueGamePage />} />
      </Routes>
    </>
  );
};
