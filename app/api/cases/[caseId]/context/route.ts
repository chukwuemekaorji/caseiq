import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clientContextEntries } from "@/db/schema";

export async function GET(_req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const entries = await db
    .select()
    .from(clientContextEntries)
    .where(eq(clientContextEntries.caseId, caseId))
    .orderBy(desc(clientContextEntries.createdAt));
  return NextResponse.json({ entries });
}

export async function POST(req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const body = await req.json().catch(() => null);

  if (!body || typeof body.content !== "string" || !body.content.trim()) {
    return NextResponse.json({ error: "Note content is required." }, { status: 400 });
  }

  const [entry] = await db
    .insert(clientContextEntries)
    .values({
      caseId,
      content: body.content.trim(),
      category: typeof body.category === "string" ? body.category : "uncategorized",
      sourceType: typeof body.sourceType === "string" ? body.sourceType : "attorney",
      sourceName: typeof body.sourceName === "string" ? body.sourceName : null,
      confidential: !!body.confidential,
      aiUsable: body.confidential ? false : true,
    })
    .returning();

  return NextResponse.json({ entry });
}
