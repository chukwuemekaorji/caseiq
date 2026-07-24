import * as XLSX from "xlsx";
import type { MedicalEvent, ParseResult, ParseWarning } from "../types";
import {
  clean,
  splitProviders,
  splitBodyParts,
  buildCanonicalMap,
  canonicalise,
} from "./normalize";

type Field =
  | "date"
  | "provider"
  | "facility"
  | "bodyParts"
  | "medicineType"
  | "recordType"
  | "summary"
  | "link";

const ALIASES: Record<Field, string[]> = {
  date: ["encounter date", "date", "date of service", "service date", "dos", "visit date"],
  provider: ["primary provider", "provider", "providers", "physician", "doctor", "clinician"],
  facility: ["facility", "location", "site", "clinic", "hospital"],
  bodyParts: ["body parts", "body part", "bodypart", "anatomy", "affected areas"],
  medicineType: ["medicine type", "specialty", "speciality", "medicine", "service type", "department"],
  recordType: ["record type", "document type", "type", "record"],
  summary: ["summary", "description", "narrative", "notes", "content"],
  link: ["link to pdf", "link", "pdf", "source", "document link", "url"],
};

function headerKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

/** Map sheet columns to canonical fields by alias, then by token overlap. */
function mapColumns(headers: (string | null)[]): {
  map: Partial<Record<Field, number>>;
  unmapped: string[];
} {
  const map: Partial<Record<Field, number>> = {};
  const used = new Set<number>();
  const unmapped: string[] = [];

  headers.forEach((header, index) => {
    if (!header) return;
    const key = headerKey(header);
    for (const [field, aliases] of Object.entries(ALIASES) as [Field, string[]][]) {
      if (map[field] !== undefined) continue;
      if (aliases.includes(key)) {
        map[field] = index;
        used.add(index);
        return;
      }
    }
  });

  headers.forEach((header, index) => {
    if (!header || used.has(index)) return;
    const tokens = new Set(headerKey(header).split(" "));
    let bestField: Field | null = null;
    let bestScore = 0;

    for (const [field, aliases] of Object.entries(ALIASES) as [Field, string[]][]) {
      if (map[field] !== undefined) continue;
      for (const alias of aliases) {
        const aliasTokens = alias.split(" ");
        const hits = aliasTokens.filter((token) => tokens.has(token)).length;
        const score = hits / aliasTokens.length;
        if (score > bestScore && score >= 0.5) {
          bestScore = score;
          bestField = field;
        }
      }
    }

    if (bestField) {
      map[bestField] = index;
      used.add(index);
    } else {
      unmapped.push(header);
    }
  });

  return { map, unmapped };
}

/** Tolerant date parsing: Date objects, Excel serials, and common strings. */
function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === "number") {
    const parsed = XLSX.SSF?.parse_date_code?.(value);
    if (parsed && parsed.y) return new Date(parsed.y, (parsed.m ?? 1) - 1, parsed.d ?? 1);
    return null;
  }

  const text = String(value).trim();

  // MM/DD/YYYY or M/D/YY — the dominant format in this domain.
  const slash = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    let [, first, second, yearText] = slash;
    let year = parseInt(yearText, 10);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    let month = parseInt(first, 10);
    let day = parseInt(second, 10);
    if (month > 12 && day <= 12) [month, day] = [day, month];
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // ISO and anything else the runtime understands.
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const parsed = new Date(+iso[1], +iso[2] - 1, +iso[3]);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const fallback = new Date(text);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export async function parseWorkbook(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { cellDates: true, cellStyles: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet || !sheet["!ref"]) {
    throw new Error("That workbook has no readable sheet.");
  }

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const warnings: ParseWarning[] = [];

  const headers: (string | null)[] = [];
  for (let column = range.s.c; column <= range.e.c; column++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: column })];
    headers.push(cell ? clean(cell.v) : null);
  }

  const { map, unmapped } = mapColumns(headers);
  if (unmapped.length) {
    warnings.push({
      kind: "header-unmapped",
      detail: `Unrecognised columns ignored: ${unmapped.join(", ")}`,
    });
  }

  for (const required of ["date", "summary"] as const) {
    if (map[required] === undefined) {
      throw new Error(
        `Could not find a ${required === "date" ? "date" : "summary"} column. Columns found: ${headers
          .filter(Boolean)
          .join(", ")}`
      );
    }
  }

  for (const optional of ["provider", "facility", "bodyParts", "medicineType", "recordType", "link"] as const) {
    if (map[optional] === undefined) {
      warnings.push({
        kind: "missing-column",
        detail: `No ${optional} column — related filters are unavailable.`,
      });
    }
  }

  const cellAt = (row: number, field: Field) => {
    const column = map[field];
    if (column === undefined) return undefined;
    return sheet[XLSX.utils.encode_cell({ r: row, c: column })];
  };

  const raw: MedicalEvent[] = [];
  let unparsedDates = 0;
  let emptyRows = 0;

  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const summary = clean(cellAt(row, "summary")?.v) ?? "";
    const dateCell = cellAt(row, "date");
    const hasAnything =
      summary ||
      dateCell?.v ||
      clean(cellAt(row, "provider")?.v) ||
      clean(cellAt(row, "facility")?.v);

    if (!hasAnything) {
      emptyRows++;
      continue;
    }

    const date = parseDate(dateCell?.v);
    if (!date && dateCell?.v) unparsedDates++;

    const linkCell = cellAt(row, "link");
    const target = linkCell?.l?.Target ?? null;
    const literal = clean(linkCell?.v);
    const pdfUrl =
      target && /^https?:\/\//i.test(target)
        ? target
        : literal && /^https?:\/\//i.test(literal)
          ? literal
          : null;

    raw.push({
      id: `evt-${row}`,
      rowIndex: row + 1,
      date,
      dateRaw: dateCell?.v ? String(dateCell.v) : "",
      providers: splitProviders(cellAt(row, "provider")?.v),
      facility: clean(cellAt(row, "facility")?.v),
      bodyParts: splitBodyParts(cellAt(row, "bodyParts")?.v),
      medicineType: clean(cellAt(row, "medicineType")?.v),
      recordType: clean(cellAt(row, "recordType")?.v),
      summary,
      pdfUrl,
      severity: "routine",
      daysFromIncident: null,
    });
  }

  if (unparsedDates) {
    warnings.push({
      kind: "unparsed-date",
      detail: "Rows with unreadable dates",
      count: unparsedDates,
    });
  }

  if (emptyRows) {
    warnings.push({
      kind: "empty-row",
      detail: "Blank rows skipped",
      count: emptyRows,
    });
  }

  const medicineMap = buildCanonicalMap(raw.map((event) => event.medicineType));
  const recordMap = buildCanonicalMap(raw.map((event) => event.recordType));
  const facilityMap = buildCanonicalMap(raw.map((event) => event.facility));

  for (const event of raw) {
    event.medicineType = canonicalise(event.medicineType, medicineMap);
    event.recordType = canonicalise(event.recordType, recordMap);
    event.facility = canonicalise(event.facility, facilityMap);
  }

  const events = raw.filter((event) => event.date).sort((a, b) => a.date!.getTime() - b.date!.getTime());
  const undated = raw.filter((event) => !event.date);

  return {
    events,
    undated,
    warnings,
    columnMap: Object.fromEntries(
      Object.entries(map).map(([field, column]) => [field, headers[column as number] ?? ""])
    ),
    totalRows: raw.length,
    fileName: file.name,
  };
}