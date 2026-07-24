import { useState, useMemo, useCallback, useEffect } from "react";
import type { CaseDraft, CaseRecord, MedicalEvent, ParseResult, Severity } from "../types";
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
import { mergeParseResults } from "../lib/mergeImports";
import { summarizeImport, combineImportSummaries, type ImportSummary } from "../lib/importSummary";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";

interface DbTimelineEvent {
  id: string;
  recordNumber: number;
  originalRowNumber: number | null;
  sourceFileName: string | null;
  eventDate: string;
  providers: string[];
  facility: string | null;
  bodyParts: string[];
  specialty: string | null;
  recordType: string | null;
  summary: string;
  sourceDocumentUrl: string | null;
  severity: Severity;
  daysFromIncident: number | null;
  importBatchId: string | null;
}

function fromDbEvent(row: DbTimelineEvent): MedicalEvent {
  const date = new Date(row.eventDate);
  return {
    id: row.id,
    recordNumber: row.recordNumber,
    rowIndex: row.originalRowNumber ?? 0,
    sourceFileName: row.sourceFileName ?? "",
    date,
    dateRaw: date.toLocaleDateString(),
    providers: row.providers ?? [],
    facility: row.facility,
    bodyParts: row.bodyParts ?? [],
    medicineType: row.specialty,
    recordType: row.recordType,
    summary: row.summary,
    pdfUrl: row.sourceDocumentUrl,
    severity: row.severity,
    daysFromIncident: row.daysFromIncident,
    importBatchId: row.importBatchId ?? undefined,
    parseStatus: "ok",
  };
}

export function useCaseData() {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseLoading, setCaseLoading] = useState(true);
  const [caseDraft, setCaseDraft] = useState<CaseDraft | null>(null);
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [undated, setUndated] = useState<MedicalEvent[]>([]);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [incidentDate, setIncidentDateState] = useState<Date | null>(null);
  const [incidentConfirmed, setIncidentConfirmed] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Severity>>({});
  const [saveError, setSaveError] = useState(false);

  // On mount, try to hydrate the most recent case from the database so a
  // chronology survives a refresh instead of resetting to the drop screen.
  // This must never hang the app if the database is unreachable (offline,
  // DB down) — fetchWithTimeout bounds it, and the try/finally below
  // guarantees caseLoading always resolves so the drop screen still shows.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout("/api/cases/current");
        if (!res.ok) {
          setSaveError(true);
          return;
        }
        const data = await res.json();
        if (cancelled || !data.case) return;

        const dbEvents = (data.events as DbTimelineEvent[]).map(fromDbEvent);
        const classified = dbEvents.map((event) => ({ ...event, severity: classifySeverity(event) }));

        setCaseId(data.case.id);
        setEvents(classified);
        setUndated([]);
        if (data.diagnostics) {
          setImportSummary({
            workbookRowCount: data.diagnostics.totalRows,
            importedCount: data.diagnostics.importedCount,
            skippedCount: data.diagnostics.skippedCount,
          });
        }

        const caseRecord = data.case as CaseRecord;
        setCaseDraft({ clientName: caseRecord.clientName ?? caseRecord.caseName ?? "Untitled case" });
        if (caseRecord.incidentDate) {
          setIncidentDateState(new Date(caseRecord.incidentDate));
          setIncidentConfirmed(true);
        } else {
          setIncidentDateState(inferIncidentDate(classified)?.date ?? null);
        }
      } catch {
        // Unreachable database (offline, DNS/connect timeout, DB down) — the
        // app still works for this session, just starting from a blank case.
        if (!cancelled) setSaveError(true);
      } finally {
        if (!cancelled) setCaseLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startCase = useCallback((draft: CaseDraft) => {
    setCaseDraft(draft);
  }, []);

  const load = useCallback(
    (results: ParseResult[]) => {
      const merged = mergeParseResults(results, 1);
      const classified = merged.events.map((event) => ({ ...event, severity: classifySeverity(event) }));

      setEvents(classified);
      setUndated(merged.undated);
      setImportSummary(summarizeImport(merged));
      setIncidentDateState(inferIncidentDate(classified)?.date ?? null);
      setIncidentConfirmed(false);
      setOverrides({});

      void fetchWithTimeout("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...merged, clientName: caseDraft?.clientName, matterNumber: caseDraft?.matterNumber }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("save failed"))))
        .then((data) => {
          if (data?.caseId) setCaseId(data.caseId);
          setSaveError(false);
        })
        .catch(() => {
          // Persistence failing shouldn't block using the app for this session —
          // the timeline above is already rendered from local state.
          setSaveError(true);
        });
    },
    [caseDraft]
  );

  const addRecords = useCallback(
    (results: ParseResult[]) => {
      const nextRecordNumber = Math.max(0, ...events.map((event) => event.recordNumber), ...undated.map((event) => event.recordNumber)) + 1;
      const merged = mergeParseResults(results, nextRecordNumber);
      const classified = merged.events.map((event) => ({ ...event, severity: classifySeverity(event) }));

      setEvents((current) => [...current, ...classified]);
      setUndated((current) => [...current, ...merged.undated]);
      setImportSummary((current) => (current ? combineImportSummaries(current, summarizeImport(merged)) : summarizeImport(merged)));

      void fetchWithTimeout("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...merged, caseId: caseId ?? undefined }),
      })
        .then((res) => (res.ok ? setSaveError(false) : setSaveError(true)))
        .catch(() => {
          // Best-effort — the new records still appear for this session either way.
          setSaveError(true);
        });
    },
    [events, undated, caseId]
  );

  const reset = useCallback(() => {
    setCaseId(null);
    setCaseDraft(null);
    setEvents([]);
    setUndated([]);
    setImportSummary(null);
    setIncidentDateState(null);
    setIncidentConfirmed(false);
    setOverrides({});
  }, []);

  const setIncidentDate = useCallback(
    (date: Date) => {
      setIncidentDateState(date);
      if (caseId) {
        void fetchWithTimeout(`/api/cases/${caseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ incidentDate: date.toISOString().slice(0, 10) }),
        })
          .then((res) => (res.ok ? setSaveError(false) : setSaveError(true)))
          .catch(() => {
            // Best-effort — the confirmed date still applies for this session either way.
            setSaveError(true);
          });
      }
    },
    [caseId]
  );

  const parsed = events.length > 0 || undated.length > 0;
  const guess = useMemo(() => inferIncidentDate(events), [events]);

  const visibleEvents: MedicalEvent[] = useMemo(() => {
    const withOverrides = events.map((event) =>
      overrides[event.id] ? { ...event, severity: overrides[event.id] } : event
    );
    return applyIncidentDate(withOverrides, incidentDate);
  }, [events, incidentDate, overrides]);

  const clusters = useMemo(() => clusterByDay(visibleEvents), [visibleEvents]);
  const curve = useMemo(() => buildIntensityCurve(clusters), [clusters]);
  const gaps = useMemo(() => findGaps(visibleEvents, incidentDate), [visibleEvents, incidentDate]);
  const keyMoments = useMemo(() => findKeyMoments(visibleEvents), [visibleEvents]);
  const phases = useMemo(() => derivePhases(clusters, gaps), [clusters, gaps]);

  const setSeverity = useCallback((id: string, severity: Severity) => {
    setOverrides((current) => ({ ...current, [id]: severity }));
  }, []);

  return {
    caseId,
    caseLoading,
    caseDraft,
    parsed,
    importSummary,
    saveError,
    events: visibleEvents,
    undated,
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
    startCase,
    load,
    addRecords,
    reset,
  };
}
