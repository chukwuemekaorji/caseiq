import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { evidenceCompositions } from "@/db/schema";

const PATCHABLE = [
  "claimTitle",
  "claimDescription",
  "attorneyReasoning",
  "attorneyResponse",
  "missingEvidenceItems",
  "strengthScore",
  "riskLevel",
  "reviewStatus",
  "includedInPresentation",
] as const;

export async function PATCH(
  req: Request,
  context: { params: Promise<{ caseId: string; compositionId: string }> }
) {
  const { caseId, compositionId } = await context.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of PATCHABLE) {
    if (key in body) updates[key] = body[key];
  }

  const [item] = await db
    .update(evidenceCompositions)
    .set(updates)
    .where(and(eq(evidenceCompositions.id, compositionId), eq(evidenceCompositions.caseId, caseId)))
    .returning();

  if (!item) return NextResponse.json({ error: "Composition not found." }, { status: 404 });
  return NextResponse.json({ composition: item });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ caseId: string; compositionId: string }> }
) {
  const { caseId, compositionId } = await context.params;
  await db
    .delete(evidenceCompositions)
    .where(and(eq(evidenceCompositions.id, compositionId), eq(evidenceCompositions.caseId, caseId)));
  return NextResponse.json({ ok: true });
}
