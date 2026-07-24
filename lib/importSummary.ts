import type { MedicalEvent, ParseWarning } from "../types";

export interface ImportSummary {
  workbookRowCount: number;
  importedCount: number;
  skippedCount: number;
  skippedBlank?: number;
  skippedUnparsedDate?: number;
}

interface Summarizable {
  events: MedicalEvent[];
  undated: MedicalEvent[];
  warnings: ParseWarning[];
  totalRows: number;
}

/**
 * Reconciles the workbook's true row count against what actually made it onto
 * the timeline. parseWorkbook already tracks blank rows (dropped) and
 * unparsed-date rows (kept, but excluded from `events`) — this just adds up
 * numbers that already exist instead of re-deriving them. Accepts a single
 * file's ParseResult or a multi-file MergedImport — both have this shape.
 */
export function summarizeImport(parsed: Summarizable): ImportSummary {
  const skippedBlank = parsed.warnings.find((warning) => warning.kind === "empty-row")?.count ?? 0;
  const skippedUnparsedDate = parsed.undated.length;
  const importedCount = parsed.events.length;

  return {
    workbookRowCount: parsed.totalRows + skippedBlank,
    importedCount,
    skippedCount: skippedBlank + skippedUnparsedDate,
    skippedBlank,
    skippedUnparsedDate,
  };
}

/** Rolls a newly-added batch into the running total for a case that already has records. */
export function combineImportSummaries(existing: ImportSummary, added: ImportSummary): ImportSummary {
  const hasBreakdown = existing.skippedBlank !== undefined && added.skippedBlank !== undefined;
  return {
    workbookRowCount: existing.workbookRowCount + added.workbookRowCount,
    importedCount: existing.importedCount + added.importedCount,
    skippedCount: existing.skippedCount + added.skippedCount,
    skippedBlank: hasBreakdown ? existing.skippedBlank! + added.skippedBlank! : undefined,
    skippedUnparsedDate: hasBreakdown ? existing.skippedUnparsedDate! + added.skippedUnparsedDate! : undefined,
  };
}
