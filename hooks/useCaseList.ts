import { useCallback, useEffect, useState } from "react";
import type { CaseRecord } from "../types";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";

export interface CaseListItem extends CaseRecord {
  eventCount: number;
}

export function useCaseList() {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchWithTimeout("/api/cases");
      if (!res.ok) {
        setError(true);
        return;
      }
      const data = await res.json();
      setCases(data.cases ?? []);
    } catch {
      // Unreachable database — show an empty list rather than hanging.
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { cases, loading, error, refresh };
}
