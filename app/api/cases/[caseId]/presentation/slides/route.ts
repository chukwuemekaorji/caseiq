import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { presentations, presentationSlides } from "@/db/schema";

async function getOrCreatePresentation(caseId: string) {
  const [existing] = await db.select().from(presentations).where(eq(presentations.caseId, caseId)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(presentations).values({ caseId }).returning();
  return created;
}

export async function POST(req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const presentation = await getOrCreatePresentation(caseId);
  const body = await req.json().catch(() => ({}));

  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${presentationSlides.order}), -1)`.mapWith(Number) })
    .from(presentationSlides)
    .where(eq(presentationSlides.presentationId, presentation.id));

  const [slide] = await db
    .insert(presentationSlides)
    .values({
      presentationId: presentation.id,
      order: maxOrder + 1,
      templateType: typeof body.templateType === "string" ? body.templateType : "content",
      title: typeof body.title === "string" ? body.title : "New slide",
      elements: Array.isArray(body.elements) ? body.elements : [],
      presenterNotes: typeof body.presenterNotes === "string" ? body.presenterNotes : null,
    })
    .returning();

  return NextResponse.json({ slide });
}
