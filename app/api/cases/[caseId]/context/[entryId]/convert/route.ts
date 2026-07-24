import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clientContextEntries, storyPoints, evidenceItems } from "@/db/schema";

export async function POST(
  req: Request,
  context: { params: Promise<{ caseId: string; entryId: string }> }
) {
  const { caseId, entryId } = await context.params;
  const body = await req.json().catch(() => null);
  const as = body?.as;

  const [entry] = await db
    .select()
    .from(clientContextEntries)
    .where(and(eq(clientContextEntries.id, entryId), eq(clientContextEntries.caseId, caseId)))
    .limit(1);

  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  if (as === "story-point") {
    const [point] = await db
      .insert(storyPoints)
      .values({
        caseId,
        title: entry.content.slice(0, 80),
        description: entry.content,
        eventDate: entry.eventDate,
        category: "other",
        sourceContextIds: [entry.id],
        aiGenerated: false,
        attorneyApproved: true,
      })
      .returning();
    return NextResponse.json({ storyPoint: point });
  }

  if (as === "evidence") {
    const [item] = await db
      .insert(evidenceItems)
      .values({
        caseId,
        title: entry.content.slice(0, 80),
        category: "client-statement",
        description: entry.content,
        eventDate: entry.eventDate,
        providerOrAuthor: entry.sourceName,
      })
      .returning();
    return NextResponse.json({ evidenceItem: item });
  }

  return NextResponse.json({ error: "Unknown conversion target." }, { status: 400 });
}
