import { useState, useMemo, useCallback, useEffect } from "react";
import type { CaseRecord, MedicalEvent, ParseResult, Severity } from "../types";
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

/** Drives a single case's timeline, given its ID. Case creation happens
 * separately (the /new flow) — by the time this hook is used, the case and
 * its first import already exist. */
export function useCaseData(caseId: string) {
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [caseLoading, setCaseLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [undated, setUndated] = useState<MedicalEvent[]>([]);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [incidentDate, setIncidentDateState] = useState<Date | null>(null);
  const [incidentConfirmed, setIncidentConfirmed] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Severity>>({});
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCaseLoading(true);
    setNotFound(false);
    (async () => {
      try {
        const res = await fetchWithTimeout(`/api/cases/${caseId}`);
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!res.ok) {
          if (!cancelled) setSaveError(true);
          return;
        }
        const data = await res.json();
        if (cancelled || !data.case) return;

        const dbEvents = (data.events as DbTimelineEvent[]).map(fromDbEvent);
        const classified = dbEvents.map((event) => ({ ...event, severity: classifySeverity(event) }));

        setCaseRecord(data.case);
        setEvents(classified);
        setUndated([]);
        if (data.diagnostics) {
          setImportSummary({
            workbookRowCount: data.diagnostics.totalRows,
            importedCount: data.diagnostics.importedCount,
            skippedCount: data.diagnostics.skippedCount,
          });
        }

        const record = data.case as CaseRecord;
        if (record.incidentDate) {
          setIncidentDateState(new Date(record.incidentDate));
          setIncidentConfirmed(true);
        } else {
          setIncidentDateState(inferIncidentDate(classified)?.date ?? null);
        }
      } catch {
        if (!cancelled) setSaveError(true);
      } finally {
        if (!cancelled) setCaseLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const addRecords = useCallback(
    (results: ParseResult[]) => {
      const nextRecordNumber =
        Math.max(0, ...events.map((event) => event.recordNumber), ...undated.map((event) => event.recordNumber)) + 1;
      const merged = mergeParseResults(results, nextRecordNumber);
      const classified = merged.events.map((event) => ({ ...event, severity: classifySeverity(event) }));

      setEvents((current) => [...current, ...classified]);
      setUndated((current) => [...current, ...merged.undated]);
      setImportSummary((current) =>
        current ? combineImportSummaries(current, summarizeImport(merged)) : summarizeImport(merged)
      );

      void fetchWithTimeout("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...merged, caseId }),
      })
        .then((res) => (res.ok ? setSaveError(false) : setSaveError(true)))
        .catch(() => {
          // Best-effort — the new records still appear for this session either way.
          setSaveError(true);
        });
    },
    [events, undated, caseId]
  );

  const setIncidentDate = useCallback(
    (date: Date) => {
      setIncidentDateState(date);
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
    },
    [caseId]
  );

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
    caseRecord,
    caseLoading,
    notFound,
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
    addRecords,
  };
}
