import { useCallback } from "react";
import { formatString } from "./strings";

export function useAppTranslation() {
  const t = useCallback(
    (key: string, args?: Record<string, string | number>) =>
      formatString(key, args),
    [],
  );
  return { t };
}
