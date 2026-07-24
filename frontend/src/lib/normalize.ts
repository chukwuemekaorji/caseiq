/** Collapse whitespace, trim, drop empty-ish values. */
export function clean(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/\s+/g, " ").trim();
  if (!s || s.toLowerCase() === "n/a" || s === "-") return null;
  return s;
}

/**
 * Providers are semicolon-delimited. Individual names contain commas
 * (credentials: "Kevin M. Lewis, DO"), so we must never split on comma.
 */
export function splitProviders(value: unknown): string[] {
  const s = clean(value);
  if (!s) return [];
  return s
    .split(";")
    .map((provider) => provider.trim())
    .filter(Boolean);
}

/** Body parts are comma-delimited and contain no internal commas. */
export function splitBodyParts(value: unknown): string[] {
  const s = clean(value);
  if (!s) return [];
  return s
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Generic category key: case-folded, de-pluralised, punctuation-stripped.
 * Merges "Orthopedic"/"Orthopedics" and "Bariatric"/"Bariatrics" without
 * naming any specific value.
 */
export function categoryKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/s$/, "");
}

/**
 * Build a canonical display label per category key, choosing the most
 * frequent original spelling as the winner.
 */
export function buildCanonicalMap(values: (string | null)[]): Map<string, string> {
  const counts = new Map<string, Map<string, number>>();
  for (const value of values) {
    if (!value) continue;
    const key = categoryKey(value);
    if (!key) continue;
    if (!counts.has(key)) counts.set(key, new Map());
    const inner = counts.get(key)!;
    inner.set(value, (inner.get(value) ?? 0) + 1);
  }

  const canonical = new Map<string, string>();
  for (const [key, inner] of counts) {
    let best = "";
    let bestCount = -1;
    for (const [label, count] of inner) {
      if (count > bestCount || (count === bestCount && label.length < best.length)) {
        best = label;
        bestCount = count;
      }
    }
    canonical.set(key, best);
  }

  return canonical;
}

export function canonicalise(value: string | null, map: Map<string, string>): string | null {
  if (!value) return null;
  return map.get(categoryKey(value)) ?? value;
}