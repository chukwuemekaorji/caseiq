import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { cases, importBatches, timelineEvents } from "@/db/schema";

export async function GET(_req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;

  const [caseRecord] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  const batches = await db
    .select()
    .from(importBatches)
    .where(eq(importBatches.caseId, caseId))
    .orderBy(importBatches.createdAt);

  const events = await db
    .select()
    .from(timelineEvents)
    .where(eq(timelineEvents.caseId, caseId))
    .orderBy(timelineEvents.eventDate);

  const diagnostics = batches.length
    ? {
        fileNames: batches.flatMap((batch) => batch.fileNames),
        totalRows: batches.reduce((sum, batch) => sum + batch.totalRows, 0),
        importedCount: batches.reduce((sum, batch) => sum + batch.importedCount, 0),
        skippedCount: batches.reduce((sum, batch) => sum + batch.skippedCount, 0),
      }
    : null;

  return NextResponse.json({ case: caseRecord, diagnostics, events });
}

export async function PATCH(req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const body = await req.json().catch(() => null);
  const incidentDate = typeof body?.incidentDate === "string" ? body.incidentDate : null;

  await db
    .update(cases)
    .set({ incidentDate, updatedAt: new Date() })
    .where(eq(cases.id, caseId));

  return NextResponse.json({ ok: true });
}
