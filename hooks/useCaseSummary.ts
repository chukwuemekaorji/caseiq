import { useEffect, useState } from "react";
import type { CaseRecord } from "../types";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";

/** Lightweight case identity for headers/nav — pages that need the full
 * timeline use useCaseData instead. */
export function useCaseSummary(caseId: string) {
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetchWithTimeout(`/api/cases/${caseId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCaseRecord(data.case ?? null);
      } catch {
        // best-effort — header just shows no name if unreachable
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  return { caseRecord, loading };
}
