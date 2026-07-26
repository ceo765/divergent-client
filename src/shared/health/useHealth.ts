import { useCallback, useEffect, useState } from "react";

import health, { emptyHealthSummary, type HealthSummary } from "@/services/health";

export function useHealth(enabled = true) {
  const [summary, setSummary] = useState<HealthSummary>(emptyHealthSummary);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const isAvailable = await health.isAvailable();
      setAvailable(isAvailable);
      if (!isAvailable) {
        setSummary(emptyHealthSummary);
        return;
      }
      const next = await health.getSummary();
      setSummary(next);
    } catch (error) {
      console.warn("Health refresh failed", error);
      setSummary(emptyHealthSummary);
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const granted = await health.requestAuthorization();
      if (granted) {
        await refresh();
      }
      return granted;
    } catch (error) {
      console.warn("Health authorization failed", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  return { summary, available, authorized: summary.authorized, loading, refresh, connect };
}
