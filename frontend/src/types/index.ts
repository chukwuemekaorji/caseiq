export type Severity = "critical" | "major" | "moderate" | "routine" | "admin";

export interface MedicalEvent {
  id: string;
  rowIndex: number;
  date: Date | null;
  dateRaw: string;
  providers: string[];
  facility: string | null;
  bodyParts: string[];
  medicineType: string | null;
  recordType: string | null;
  summary: string;
  pdfUrl: string | null;
  severity: Severity;
  daysFromIncident: number | null;
}

export interface ParseWarning {
  kind: "missing-column" | "unparsed-date" | "empty-row" | "header-unmapped";
  detail: string;
  count?: number;
}

export interface ParseResult {
  events: MedicalEvent[];
  undated: MedicalEvent[];
  warnings: ParseWarning[];
  columnMap: Record<string, string>;
  totalRows: number;
  fileName: string;
}