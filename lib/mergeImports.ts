import type { MergedImport, ParseResult } from "../types";

/**
 * Combines one or more per-file ParseResults into a single case-scoped
 * import, assigning each record a `recordNumber` that's unique across every
 * file ever imported into the case — this is what AI citations and "click to
 * inspect" reference, since the raw Excel row number can collide once a case
 * has more than one source file. `startingRecordNumber` lets a later "add
 * more records" import continue the sequence instead of restarting it.
 */
export function mergeParseResults(results: ParseResult[], startingRecordNumber = 1): MergedImport {
  let counter = startingRecordNumber;
  const events: MergedImport["events"] = [];
  const undated: MergedImport["undated"] = [];
  const warnings: MergedImport["warnings"] = [];
  const fileNames: string[] = [];
  let totalRows = 0;

  const multipleFiles = results.length > 1;

  for (const result of results) {
    fileNames.push(result.fileName);
    totalRows += result.totalRows;
    warnings.push(
      ...result.warnings.map((warning) => ({
        ...warning,
        detail: multipleFiles ? `${result.fileName}: ${warning.detail}` : warning.detail,
      }))
    );
    for (const event of result.events) {
      events.push({ ...event, recordNumber: counter++ });
    }
    for (const event of result.undated) {
      undated.push({ ...event, recordNumber: counter++ });
    }
  }

  events.sort((a, b) => a.date!.getTime() - b.date!.getTime());

  return { events, undated, warnings, totalRows, fileNames };
}
