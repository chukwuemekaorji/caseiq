export type Severity = "critical" | "major" | "moderate" | "routine" | "admin";

export interface MedicalEvent {
  id: string;
  /** Case-scoped citation anchor — unique across every file ever imported into this case. */
  recordNumber: number;
  /** Original row in the source workbook. Provenance only — not unique across files. */
  rowIndex: number;
  sourceFileName: string;
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
  importBatchId?: string;
  parseStatus?: "ok" | "unparsed-date";
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

/** The outcome of merging one or more ParseResults into a single case-scoped import. */
export interface MergedImport {
  events: MedicalEvent[];
  undated: MedicalEvent[];
  warnings: ParseWarning[];
  totalRows: number;
  fileNames: string[];
}

export interface ImportDiagnostics {
  fileNames: string[];
  totalRows: number;
  importedCount: number;
  skippedCount: number;
}

export interface CaseRecord {
  id: string;
  clientName: string | null;
  caseName: string | null;
  matterNumber: string | null;
  incidentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaseDraft {
  clientName: string;
  matterNumber?: string;
}
