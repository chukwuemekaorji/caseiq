import type { MedicalEvent } from "../types";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

export class MissingKeyError extends Error {
  constructor() {
    super("No API key set.");
    this.name = "MissingKeyError";
  }
}

export function getKey(): string | null {
  return sessionStorage.getItem("caseiq_key");
}

export function setKey(k: string) {
  sessionStorage.setItem("caseiq_key", k.trim());
}

export function clearKey() {
  sessionStorage.removeItem("caseiq_key");
}

interface CallOptions {
  system: string;
  user: string;
  json?: boolean;
  temperature?: number;
}

export async function callModel({
  system,
  user,
  json = false,
  temperature = 0.2,
}: CallOptions): Promise<string> {
  const key = getKey();
  if (!key) throw new MissingKeyError();

  // Prefilling "[" forces valid JSON without a response-format param.
  const prefill = json ? "[" : null;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      temperature,
      system,
      messages: [
        { role: "user", content: user },
        ...(prefill ? [{ role: "assistant", content: prefill }] : []),
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) throw new Error("That API key was rejected. Check it and try again.");
    if (res.status === 429) throw new Error("Rate limit reached. Wait a few seconds and retry.");
    if (res.status === 400 && /credit/i.test(body)) throw new Error("Your Anthropic account is out of credit.");
    throw new Error(`Model request failed (${res.status}).`);
  }

  const data = await res.json();
  const text = data?.content
    ?.filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("")
    .trim();

  if (!text) throw new Error("The model returned an empty response.");

  // Re-attach the prefill so parseJson sees a complete structure.
  return prefill ? prefill + text : text;
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
 * Compact record digest. Row numbers are the citation anchor — the model
 * must reference these and nothing else.
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
    return `[row ${e.rowIndex}] ${e.date!.toLocaleDateString()} (${day}) | ${e.recordType ?? "record"} | ${e.medicineType ?? "—"} | ${who} | ${e.facility ?? "—"} | ${e.bodyParts.join(", ") || "—"}\n${e.summary.slice(0, 700)}`;
  });

  let out = header;
  for (const line of lines) {
    if (out.length + line.length > maxChars) {
      out += `\n[…${lines.length - (out.split("[row ").length - 1)} further records omitted for length]`;
      break;
    }
    out += line + "\n\n";
  }
  return out;
}

const GROUNDING = `You are analysing a medical chronology for a personal-injury attorney.

ABSOLUTE RULES:
- Use ONLY the records provided. Never infer facts that are not written there.
- Cite every factual claim with the row number in square brackets, e.g. [row 42].
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

Cite rows throughout. 200 words maximum.

RECORDS:
${context}`,
    temperature: 0.3,
  });
}

/* ───────────────  KEY MOMENTS  ─────────────── */

export interface AIKeyMoment {
  row: number;
  title: string;
  why: string;
}

export async function generateKeyMoments(context: string): Promise<AIKeyMoment[]> {
  const raw = await callModel({
    system: GROUNDING,
    json: true,
    user: `Identify the five most significant events in this treatment history — the ones that carry the case.

Return JSON only:
[{"row": <number>, "title": "<six words max>", "why": "<one sentence, why it matters to the case>"}]

The row must be a row number that appears in the records below.

RECORDS:
${context}`,
  });
  return parseJson<AIKeyMoment[]>(raw);
}

/* ───────────────  Q&A  ─────────────── */

export async function answerQuestion(context: string, question: string): Promise<string> {
  return callModel({
    system: GROUNDING,
    user: `Answer this question from the records. Be specific and brief — two or three sentences. Cite rows.
If the records don't contain the answer, say exactly that.

QUESTION: ${question}

RECORDS:
${context}`,
    temperature: 0.1,
  });
}

/* ───────────────  STRESS TEST  ─────────────── */

export interface Challenge {
  category: "gap" | "causation" | "preexisting" | "consistency" | "evidence";
  headline: string;
  argument: string;
  rows: number[];
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
  "rows": [<row numbers supporting this>],
  "response": "<the strongest grounded rebuttal, or what evidence would be needed>",
  "severity": "high" | "medium" | "low"
}]

Order by severity, highest first. Every entry must cite at least one real row.

DETECTED GAPS: ${gapSummary}

RECORDS:
${context}`,
    temperature: 0.4,
  });
  return parseJson<Challenge[]>(raw);
}
