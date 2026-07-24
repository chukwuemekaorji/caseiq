import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { presentations, presentationSlides } from "@/db/schema";

async function getOrCreatePresentation(caseId: string) {
  const [existing] = await db.select().from(presentations).where(eq(presentations.caseId, caseId)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(presentations).values({ caseId }).returning();
  return created;
}

export async function GET(_req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const presentation = await getOrCreatePresentation(caseId);
  const slides = await db
    .select()
    .from(presentationSlides)
    .where(eq(presentationSlides.presentationId, presentation.id))
    .orderBy(asc(presentationSlides.order));
  return NextResponse.json({ presentation, slides });
}

export async function PATCH(req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const presentation = await getOrCreatePresentation(caseId);
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of ["title", "purpose", "audience", "status"] as const) {
    if (key in body) updates[key] = body[key];
  }

  const [updated] = await db
    .update(presentations)
    .set(updates)
    .where(eq(presentations.id, presentation.id))
    .returning();

  return NextResponse.json({ presentation: updated });
}
