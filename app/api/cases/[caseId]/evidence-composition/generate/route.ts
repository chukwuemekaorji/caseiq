import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { cases, timelineEvents, evidenceCompositions } from "@/db/schema";
import { callAnthropic } from "@/backend/anthropicClient";
import { buildContext } from "@/lib/ai";
import { findGaps } from "@/lib/analyze";
import type { MedicalEvent } from "@/types";

const SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      claimTitle: { type: "string" },
      claimDescription: { type: "string" },
      aiReasoning: { type: "string" },
      counterargument: { type: "string" },
      attorneyResponse: { type: "string" },
      missingEvidenceItems: { type: "array", items: { type: "string" } },
      strengthScore: { type: "integer" },
      riskLevel: { type: "string", enum: ["low", "moderate", "high"] },
    },
    required: [
      "claimTitle",
      "claimDescription",
      "aiReasoning",
      "counterargument",
      "attorneyResponse",
      "missingEvidenceItems",
      "strengthScore",
      "riskLevel",
    ],
    additionalProperties: false,
  },
};

export async function POST(_req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Anthropic API key is not configured on the server." }, { status: 500 });
  }

  const [caseRecord] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  const rows = await db.select().from(timelineEvents).where(eq(timelineEvents.caseId, caseId));
  const events: MedicalEvent[] = rows.map((row) => ({
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

  const incidentDate = caseRecord.incidentDate ? new Date(caseRecord.incidentDate) : null;
  const recordContext = buildContext(events, incidentDate);
  const gaps = findGaps(events, incidentDate);
  const gapSummary = gaps.length
    ? gaps.map((gap) => `${gap.days} days (${gap.start.toLocaleDateString()} → ${gap.end.toLocaleDateString()})`).join("; ")
    : "none over 60 days";

  const result = await callAnthropic({
    system:
      "You are analysing a medical chronology for a personal-injury attorney. You are acting as defence counsel reviewing the plaintiff's medical records for weaknesses. Be genuinely adversarial — find the real problems, not polite ones. Then give the plaintiff's attorney the strongest available response.",
    schema: SCHEMA,
    user: `Review these records and identify the four to six strongest claims the defence will challenge, framed as claim compositions.

For each: a claim title (what the plaintiff is asserting), a description of the claim, the AI's adversarial reasoning against it (citing record numbers), a one-sentence counterargument summary, the strongest grounded attorney response, a list of missing evidence that would strengthen the claim, a strength score (0-100, plaintiff's position), and a risk level.

DETECTED GAPS: ${gapSummary}

RECORDS:
${recordContext}`,
  });

  if (!result.ok) {
    return new NextResponse(result.body, { status: result.status, headers: { "Content-Type": "application/json" } });
  }

  let parsed: Array<{
    claimTitle: string;
    claimDescription: string;
    aiReasoning: string;
    counterargument: string;
    attorneyResponse: string;
    missingEvidenceItems: string[];
    strengthScore: number;
    riskLevel: "low" | "moderate" | "high";
  }>;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    return NextResponse.json({ error: "The model returned malformed data." }, { status: 502 });
  }

  if (!parsed.length) {
    return NextResponse.json({ error: "The model didn't return any claims for this case." }, { status: 502 });
  }

  const created = await db
    .insert(evidenceCompositions)
    .values(
      parsed.map((entry) => ({
        caseId,
        claimTitle: entry.claimTitle,
        claimDescription: entry.claimDescription,
        aiReasoning: entry.aiReasoning,
        counterargument: entry.counterargument,
        attorneyResponse: entry.attorneyResponse,
        missingEvidenceItems: entry.missingEvidenceItems,
        strengthScore: entry.strengthScore,
        riskLevel: entry.riskLevel,
        reviewStatus: "draft",
      }))
    )
    .returning();

  return NextResponse.json({ compositions: created });
}
