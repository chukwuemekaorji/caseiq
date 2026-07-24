import type { MedicalEvent } from "../types";

const ENDPOINT = "/api/anthropic";

interface CallOptions {
  system: string;
  user: string;
  /** JSON schema for structured output. Omit for a plain-text response. */
  schema?: object;
}

export async function callModel({ system, user, schema }: CallOptions): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system,
      user,
      schema,
    }),
  });

  const raw = await res.text();

  if (!res.ok) {
    try {
      const payload = JSON.parse(raw) as { error?: string };
      if (payload.error) throw new Error(payload.error);
    } catch {
      // Fall through to raw body handling below.
    }

    if (raw) throw new Error(raw);
    throw new Error(`Model request failed (${res.status}).`);
  }

  let data: { text?: string };
  try {
    data = JSON.parse(raw) as { text?: string };
  } catch {
    throw new Error("The backend returned malformed data.");
  }

  const text = data.text?.trim() ?? "";

  if (!text) throw new Error("The model returned an empty response.");

  return text;
}

/* ───────────────  CONTEXT BUILDING  ─────────────── */

/**
 * Compact record digest. Record numbers are the citation anchor — unique
 * across every file ever imported into the case — and the model must
 * reference these and nothing else.
 */
export function buildContext(
  events: MedicalEvent[],
  incidentDate: Date | null,
  maxChars = 90_000
): string {
  const header = incidentDate
    ? `INCIDENT DATE: ${incidentDate.toLocaleDateString()}\n\n`
    : "INCIDENT DATE: not established\n\n";

  const lines = events.map((e) => {
    const day = e.daysFromIncident !== null ? `D${e.daysFromIncident >= 0 ? "+" : ""}${e.daysFromIncident}` : "D?";
    const who = e.providers.slice(0, 2).join(", ") || "—";
    return `[record ${e.recordNumber}] ${e.date!.toLocaleDateString()} (${day}) | ${e.recordType ?? "record"} | ${e.medicineType ?? "—"} | ${who} | ${e.facility ?? "—"} | ${e.bodyParts.join(", ") || "—"}\n${e.summary.slice(0, 700)}`;
  });

  let out = header;
  for (const line of lines) {
    if (out.length + line.length > maxChars) {
      out += `\n[…${lines.length - (out.split("[record ").length - 1)} further records omitted for length]`;
      break;
    }
    out += line + "\n\n";
  }
  return out;
}

const GROUNDING = `You are analysing a medical chronology for a personal-injury attorney.

ABSOLUTE RULES:
- Use ONLY the records provided. Never infer facts that are not written there.
- Cite every factual claim with the record number in square brackets, e.g. [record 42].
- If the records do not support an answer, say so plainly. Never fill a gap with a plausible guess.
- Do not give legal advice or predict case value.
- Write in plain, direct professional English. No filler, no hedging preambles.`;

/* ───────────────  Q&A  ─────────────── */

export async function answerQuestion(context: string, question: string): Promise<string> {
  return callModel({
    system: GROUNDING,
    user: `Answer this question from the records. Be specific and brief — two or three sentences. Cite records.
If the records don't contain the answer, say exactly that.

QUESTION: ${question}

RECORDS:
${context}`,
  });
}
