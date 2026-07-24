import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { cases, importBatches, timelineEvents } from "@/db/schema";

/**
 * Priority 0 has no case switcher yet — this always resolves to the most
 * recently created case. Once Priority 1 adds real case selection, this
 * route is replaced by an authenticated "my cases" list.
 */
export async function GET() {
  const [latestCase] = await db.select().from(cases).orderBy(desc(cases.createdAt)).limit(1);

  if (!latestCase) {
    return NextResponse.json({ case: null, diagnostics: null, events: [] });
  }

  const batches = await db
    .select()
    .from(importBatches)
    .where(eq(importBatches.caseId, latestCase.id))
    .orderBy(importBatches.createdAt);

  const events = await db
    .select()
    .from(timelineEvents)
    .where(eq(timelineEvents.caseId, latestCase.id))
    .orderBy(timelineEvents.eventDate);

  const diagnostics = batches.length
    ? {
        fileNames: batches.flatMap((batch) => batch.fileNames),
        totalRows: batches.reduce((sum, batch) => sum + batch.totalRows, 0),
        importedCount: batches.reduce((sum, batch) => sum + batch.importedCount, 0),
        skippedCount: batches.reduce((sum, batch) => sum + batch.skippedCount, 0),
      }
    : null;

  return NextResponse.json({ case: latestCase, diagnostics, events });
}
