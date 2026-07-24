import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { cases, timelineEvents } from "@/db/schema";

export async function GET() {
  const rows = await db
    .select({
      id: cases.id,
      clientName: cases.clientName,
      caseName: cases.caseName,
      matterNumber: cases.matterNumber,
      incidentDate: cases.incidentDate,
      createdAt: cases.createdAt,
      updatedAt: cases.updatedAt,
      eventCount: sql<number>`count(${timelineEvents.id})`.mapWith(Number),
    })
    .from(cases)
    .leftJoin(timelineEvents, eq(timelineEvents.caseId, cases.id))
    .groupBy(cases.id)
    .orderBy(desc(cases.createdAt));

  return NextResponse.json({ cases: rows });
}
