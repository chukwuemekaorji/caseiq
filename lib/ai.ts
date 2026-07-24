import type { MedicalEvent } from "../types";

const ENDPOINT = "/api/anthropic";

interface CallOptions {
  system: string;
  user: string;
  json?: boolean;
}

export async function callModel({
  system,
  user,
  json = false,
}: CallOptions): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system,
      user,
      json,
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

export function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("The model returned malformed data.");
  }
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

/* ───────────────  STORY  ─────────────── */

export async function generateStory(context: string): Promise<string> {
  return callModel({
    system: GROUNDING,
    user: `Write a treatment narrative an attorney can read in thirty seconds.

Three short paragraphs, no headings:
1. What happened and the immediate care.
2. How treatment progressed — the arc, the turning points.
3. Where things stand at the end of the record.

Cite records throughout. 200 words maximum.

RECORDS:
${context}`,
  });
}

/* ───────────────  KEY MOMENTS  ─────────────── */

export interface AIKeyMoment {
  record: number;
  title: string;
  why: string;
}

export async function generateKeyMoments(context: string): Promise<AIKeyMoment[]> {
  const raw = await callModel({
    system: GROUNDING,
    json: true,
    user: `Identify the five most significant events in this treatment history — the ones that carry the case.

Return JSON only:
[{"record": <number>, "title": "<six words max>", "why": "<one sentence, why it matters to the case>"}]

The record number must be one that appears in the records below.

RECORDS:
${context}`,
  });
  return parseJson<AIKeyMoment[]>(raw);
}

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

/* ───────────────  STRESS TEST  ─────────────── */

export interface Challenge {
  category: "gap" | "causation" | "preexisting" | "consistency" | "evidence";
  headline: string;
  argument: string;
  records: number[];
  response: string;
  severity: "high" | "medium" | "low";
}

export async function runStressTest(context: string, gapSummary: string): Promise<Challenge[]> {
  const raw = await callModel({
    system: `${GROUNDING}

For this task you are acting as defence counsel reviewing the plaintiff's medical records for weaknesses. Be genuinely adversarial — find the real problems, not polite ones. Then, separately, give the plaintiff's attorney the strongest available response grounded in the same records.`,
    json: true,
    user: `Review these records and identify the four to six strongest challenges the defence will raise.

Categories: "gap" (treatment stopped), "causation" (link to incident is weak), "preexisting" (condition predates the incident), "consistency" (records contradict each other), "evidence" (something ordered but never documented as done).

Return JSON only:
[{
  "category": "<one of the above>",
  "headline": "<eight words max>",
  "argument": "<what defence counsel will say, one or two sentences>",
  "records": [<record numbers supporting this>],
  "response": "<the strongest grounded rebuttal, or what evidence would be needed>",
  "severity": "high" | "medium" | "low"
}]

Order by severity, highest first. Every entry must cite at least one real record.

DETECTED GAPS: ${gapSummary}

RECORDS:
${context}`,
  });
  return parseJson<Challenge[]>(raw);
}
