import { useState, useMemo, useCallback } from "react";
import type { MedicalEvent, Severity } from "../types";

export interface FilterState {
  query: string;
  providers: Set<string>;
  facilities: Set<string>;
  medicineTypes: Set<string>;
  recordTypes: Set<string>;
  bodyParts: Set<string>;
  severities: Set<Severity>;
  period: "all" | "pre" | "post";
}

const EMPTY: FilterState = {
  query: "",
  providers: new Set(),
  facilities: new Set(),
  medicineTypes: new Set(),
  recordTypes: new Set(),
  bodyParts: new Set(),
  severities: new Set(),
  period: "all",
};

export type FacetKey =
  | "providers"
  | "facilities"
  | "medicineTypes"
  | "recordTypes"
  | "bodyParts";

export interface Facet {
  key: FacetKey;
  label: string;
  options: { value: string; count: number }[];
}

export function useFilters(events: MedicalEvent[]) {
  const [filters, setFilters] = useState<FilterState>(EMPTY);

  /** Every option is derived from the loaded file. Nothing is hardcoded. */
  const facets: Facet[] = useMemo(() => {
    const tally = (pick: (e: MedicalEvent) => string[]) => {
      const counts = new Map<string, number>();
      for (const event of events) {
        for (const value of pick(event)) counts.set(value, (counts.get(value) ?? 0) + 1);
      }
      return [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    };

    return ([
      { key: "medicineTypes", label: "Specialty", options: tally((e) => (e.medicineType ? [e.medicineType] : [])) },
      { key: "bodyParts", label: "Body part", options: tally((e) => e.bodyParts) },
      { key: "providers", label: "Provider", options: tally((e) => e.providers) },
      { key: "facilities", label: "Facility", options: tally((e) => (e.facility ? [e.facility] : [])) },
      { key: "recordTypes", label: "Record type", options: tally((e) => (e.recordType ? [e.recordType] : [])) },
    ] as Facet[]).filter((facet) => facet.options.length > 1);
  }, [events]);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return events.filter((event) => {
      if (filters.period === "pre" && (event.daysFromIncident ?? 0) >= 0) return false;
      if (filters.period === "post" && (event.daysFromIncident ?? 0) < 0) return false;
      if (filters.severities.size && !filters.severities.has(event.severity)) return false;
      if (filters.medicineTypes.size && (!event.medicineType || !filters.medicineTypes.has(event.medicineType))) return false;
      if (filters.facilities.size && (!event.facility || !filters.facilities.has(event.facility))) return false;
      if (filters.recordTypes.size && (!event.recordType || !filters.recordTypes.has(event.recordType))) return false;
      if (filters.providers.size && !event.providers.some((provider) => filters.providers.has(provider))) return false;
      if (filters.bodyParts.size && !event.bodyParts.some((part) => filters.bodyParts.has(part))) return false;
      if (q) {
        const hay = `${event.summary} ${event.providers.join(" ")} ${event.facility ?? ""} ${event.recordType ?? ""} ${event.medicineType ?? ""} ${event.bodyParts.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, filters]);

  const toggle = useCallback((key: FacetKey, value: string) => {
    setFilters((prev) => {
      const next = new Set(prev[key]);
      next.has(value) ? next.delete(value) : next.add(value);
      return { ...prev, [key]: next };
    });
  }, []);

  const toggleSeverity = useCallback((severity: Severity) => {
    setFilters((prev) => {
      const next = new Set(prev.severities);
      next.has(severity) ? next.delete(severity) : next.add(severity);
      return { ...prev, severities: next };
    });
  }, []);

  const setQuery = useCallback((query: string) => setFilters((prev) => ({ ...prev, query })), []);
  const setPeriod = useCallback((period: FilterState["period"]) => setFilters((prev) => ({ ...prev, period })), []);
  const clear = useCallback(() => setFilters(EMPTY), []);

  const activeCount =
    filters.providers.size +
    filters.facilities.size +
    filters.medicineTypes.size +
    filters.recordTypes.size +
    filters.bodyParts.size +
    filters.severities.size +
    (filters.query ? 1 : 0) +
    (filters.period !== "all" ? 1 : 0);

  return { filters, facets, filtered, toggle, toggleSeverity, setQuery, setPeriod, clear, activeCount };
}