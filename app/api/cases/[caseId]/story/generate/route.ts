import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { cases, timelineEvents, clientContextEntries, generatedNarratives } from "@/db/schema";
import { callAnthropic } from "@/backend/anthropicClient";
import { buildContext } from "@/lib/ai";
import type { MedicalEvent } from "@/types";

const PROMPTS: Record<string, string> = {
  "thirty-second-summary":
    "Write a 30-second case summary an attorney can read aloud: what happened, the injury, where things stand now. Three sentences max.",
  "medical-story":
    "Write the medical treatment narrative: what happened, how treatment progressed, where things stand now. Three short paragraphs, 200 words max.",
  "life-impact-story":
    "Write a narrative of how this injury has affected the client's daily life, based on the client-context notes provided (hobbies, family, mobility, mental health). If no life-impact notes are provided, say so plainly rather than inventing anything.",
  "financial-story":
    "Write a narrative of the financial impact of this injury, based on the client-context notes provided. If no financial notes are provided, say so plainly rather than inventing anything.",
  "before-after":
    "Write a concise before-and-after comparison: the client's condition and activities before the incident versus now.",
  "opening-overview":
    "Write a short opening-statement-style overview of the case an attorney could use to introduce it to a jury.",
  "closing-summary":
    "Write a short closing-statement-style summary an attorney could use to conclude a presentation of this case.",
};

export async function POST(req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const body = await req.json().catch(() => null);
  const type = body?.type as string | undefined;

  if (!type || !PROMPTS[type]) {
    return NextResponse.json({ error: "Unknown narrative type." }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Anthropic API key is not configured on the server." }, { status: 500 });
  }

  const [caseRecord] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  const eventRows = await db.select().from(timelineEvents).where(eq(timelineEvents.caseId, caseId));
  const events: MedicalEvent[] = eventRows.map((row) => ({
    id: row.id,
    recordNumber: row.recordNumber,
    rowIndex: row.originalRowNumber ?? 0,
    sourceFileName: row.sourceFileName ?? "",
    date: new Date(row.eventDate),
    dateRaw: new Date(row.eventDate).toLocaleDateString(),
    providers: row.providers ?? [],
    facility: row.facility,
    bodyParts: row.bodyParts ?? [],
    medicineType: row.specialty,
    recordType: row.recordType,
    summary: row.summary,
    pdfUrl: row.sourceDocumentUrl,
    severity: row.severity as MedicalEvent["severity"],
    daysFromIncident: row.daysFromIncident,
  }));

  const contextEntries = await db
    .select()
    .from(clientContextEntries)
    .where(and(eq(clientContextEntries.caseId, caseId), eq(clientContextEntries.aiUsable, true)));

  const incidentDate = caseRecord.incidentDate ? new Date(caseRecord.incidentDate) : null;
  const medicalContext = buildContext(events, incidentDate);
  const clientContextText = contextEntries.length
    ? contextEntries.map((entry) => `- (${entry.category}) ${entry.content}`).join("\n")
    : "None provided.";

  const result = await callAnthropic({
    system: `You are analysing a medical chronology and client context for a personal-injury attorney.

ABSOLUTE RULES:
- Use ONLY the records and notes provided. Never infer facts that are not written there.
- Cite medical claims with the record number in square brackets, e.g. [record 42].
- If the material does not support the requested narrative, say so plainly.
- Do not give legal advice or predict case value.
- Write in plain, direct professional English.`,
    user: `${PROMPTS[type]}

MEDICAL RECORDS:
${medicalContext}

CLIENT CONTEXT NOTES:
${clientContextText}`,
  });

  if (!result.ok) {
    return new NextResponse(result.body, { status: result.status, headers: { "Content-Type": "application/json" } });
  }

  const [existing] = await db
    .select()
    .from(generatedNarratives)
    .where(and(eq(generatedNarratives.caseId, caseId), eq(generatedNarratives.type, type)))
    .limit(1);

  let narrative;
  if (existing) {
    [narrative] = await db
      .update(generatedNarratives)
      .set({ aiDraft: result.text, updatedAt: new Date() })
      .where(eq(generatedNarratives.id, existing.id))
      .returning();
  } else {
    [narrative] = await db
      .insert(generatedNarratives)
      .values({ caseId, type, aiDraft: result.text, status: "draft" })
      .returning();
  }

  return NextResponse.json({ narrative });
}
