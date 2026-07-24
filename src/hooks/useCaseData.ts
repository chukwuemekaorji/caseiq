import { useState, useMemo, useCallback } from "react";
import type { MedicalEvent, ParseResult, Severity } from "../types";
import {
  classifySeverity,
  inferIncidentDate,
  applyIncidentDate,
  findGaps,
  clusterByDay,
  buildIntensityCurve,
  findKeyMoments,
  derivePhases,
} from "../lib/analyze";

export function useCaseData() {
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [incidentDate, setIncidentDate] = useState<Date | null>(null);
  const [incidentConfirmed, setIncidentConfirmed] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Severity>>({});

  const load = useCallback((result: ParseResult) => {
    const classified = result.events.map((event) => ({ ...event, severity: classifySeverity(event) }));
    setParsed({ ...result, events: classified });
    const guess = inferIncidentDate(classified);
    setIncidentDate(guess?.date ?? null);
    setIncidentConfirmed(false);
    setOverrides({});
  }, []);

  const reset = useCallback(() => {
    setParsed(null);
    setIncidentDate(null);
    setIncidentConfirmed(false);
    setOverrides({});
  }, []);

  const guess = useMemo(() => (parsed ? inferIncidentDate(parsed.events) : null), [parsed]);

  const events: MedicalEvent[] = useMemo(() => {
    if (!parsed) return [];
    const withOverrides = parsed.events.map((event) =>
      overrides[event.id] ? { ...event, severity: overrides[event.id] } : event
    );
    return applyIncidentDate(withOverrides, incidentDate);
  }, [parsed, incidentDate, overrides]);

  const clusters = useMemo(() => clusterByDay(events), [events]);
  const curve = useMemo(() => buildIntensityCurve(clusters), [clusters]);
  const gaps = useMemo(() => findGaps(events, incidentDate), [events, incidentDate]);
  const keyMoments = useMemo(() => findKeyMoments(events), [events]);
  const phases = useMemo(() => derivePhases(clusters, gaps), [clusters, gaps]);

  const setSeverity = useCallback((id: string, severity: Severity) => {
    setOverrides((current) => ({ ...current, [id]: severity }));
  }, []);

  return {
    parsed,
    events,
    undated: parsed?.undated ?? [],
    warnings: parsed?.warnings ?? [],
    clusters,
    curve,
    gaps,
    keyMoments,
    phases,
    incidentDate,
    incidentConfirmed,
    guess,
    setIncidentDate,
    setIncidentConfirmed,
    setSeverity,
    load,
    reset,
  };
}