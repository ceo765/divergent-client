import { useCallback, useEffect, useState } from "react";

import { useAppStore } from "@/stores/useAppStore";
import type { ProgressOverview } from "@/types";

export function useProgressOverview(enabled = true) {
  const { getProgressOverview } = useAppStore();
  const [overview, setOverview] = useState<ProgressOverview>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProgressOverview();
      setOverview(data);
      setError(false);
    } catch (err) {
      console.error("Failed to load progress overview", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [getProgressOverview]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  return { overview, loading, error, refresh };
}
