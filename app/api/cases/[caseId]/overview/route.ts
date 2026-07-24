import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  cases,
  timelineEvents,
  clientContextEntries,
  evidenceItems,
  evidenceCompositions,
  generatedNarratives,
  presentations,
} from "@/db/schema";

export async function GET(_req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;

  const [caseRecord] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  const [[eventRow], [contextRow], [evidenceRow], compositions, narratives, presentationRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(timelineEvents)
      .where(eq(timelineEvents.caseId, caseId)),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(clientContextEntries)
      .where(eq(clientContextEntries.caseId, caseId)),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(evidenceItems)
      .where(eq(evidenceItems.caseId, caseId)),
    db.select().from(evidenceCompositions).where(eq(evidenceCompositions.caseId, caseId)),
    db.select().from(generatedNarratives).where(eq(generatedNarratives.caseId, caseId)),
    db.select().from(presentations).where(eq(presentations.caseId, caseId)),
  ]);

  return NextResponse.json({
    case: caseRecord,
    eventCount: eventRow?.count ?? 0,
    contextCount: contextRow?.count ?? 0,
    evidenceCount: evidenceRow?.count ?? 0,
    compositionCount: compositions.length,
    approvedCompositionCount: compositions.filter((c) => c.reviewStatus === "approved").length,
    narrativeCount: narratives.length,
    approvedNarrativeCount: narratives.filter((n) => n.status === "approved").length,
    presentationCount: presentationRows.length,
    latestPresentationStatus: presentationRows[0]?.status ?? null,
  });
}
