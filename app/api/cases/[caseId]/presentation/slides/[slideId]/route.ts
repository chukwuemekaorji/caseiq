import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { presentationSlides } from "@/db/schema";

const PATCHABLE = ["title", "templateType", "elements", "presenterNotes", "attorneyApproved", "order"] as const;

export async function PATCH(req: Request, context: { params: Promise<{ caseId: string; slideId: string }> }) {
  const { slideId } = await context.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of PATCHABLE) {
    if (key in body) updates[key] = body[key];
  }

  const [slide] = await db.update(presentationSlides).set(updates).where(eq(presentationSlides.id, slideId)).returning();
  if (!slide) return NextResponse.json({ error: "Slide not found." }, { status: 404 });
  return NextResponse.json({ slide });
}

export async function DELETE(_req: Request, context: { params: Promise<{ caseId: string; slideId: string }> }) {
  const { slideId } = await context.params;
  await db.delete(presentationSlides).where(eq(presentationSlides.id, slideId));
  return NextResponse.json({ ok: true });
}
