import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { evidenceItems } from "@/db/schema";

export async function GET(_req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const items = await db
    .select()
    .from(evidenceItems)
    .where(eq(evidenceItems.caseId, caseId))
    .orderBy(desc(evidenceItems.createdAt));
  return NextResponse.json({ items });
}

export async function POST(req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const body = await req.json().catch(() => null);

  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const [item] = await db
    .insert(evidenceItems)
    .values({
      caseId,
      title: body.title.trim(),
      category: typeof body.category === "string" ? body.category : "other",
      description: typeof body.description === "string" ? body.description : "",
      sourceDocumentUrl: typeof body.sourceDocumentUrl === "string" ? body.sourceDocumentUrl : null,
      providerOrAuthor: typeof body.providerOrAuthor === "string" ? body.providerOrAuthor : null,
      eventDate: typeof body.eventDate === "string" ? body.eventDate : null,
      strength: typeof body.strength === "string" ? body.strength : "moderate",
    })
    .returning();

  return NextResponse.json({ item });
}
