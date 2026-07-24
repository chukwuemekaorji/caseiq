import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { evidenceItems } from "@/db/schema";

const PATCHABLE = [
  "title",
  "category",
  "description",
  "strength",
  "verificationStatus",
  "reviewStatus",
  "attorneyNotes",
  "includedInPresentation",
  "confidential",
] as const;

export async function PATCH(
  req: Request,
  context: { params: Promise<{ caseId: string; evidenceId: string }> }
) {
  const { caseId, evidenceId } = await context.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of PATCHABLE) {
    if (key in body) updates[key] = body[key];
  }

  const [item] = await db
    .update(evidenceItems)
    .set(updates)
    .where(and(eq(evidenceItems.id, evidenceId), eq(evidenceItems.caseId, caseId)))
    .returning();

  if (!item) return NextResponse.json({ error: "Evidence item not found." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ caseId: string; evidenceId: string }> }
) {
  const { caseId, evidenceId } = await context.params;
  await db.delete(evidenceItems).where(and(eq(evidenceItems.id, evidenceId), eq(evidenceItems.caseId, caseId)));
  return NextResponse.json({ ok: true });
}
