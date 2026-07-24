import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { generatedNarratives } from "@/db/schema";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ caseId: string; narrativeId: string }> }
) {
  const { caseId, narrativeId } = await context.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.attorneyVersion === "string") {
    updates.attorneyVersion = body.attorneyVersion;
    updates.status = "edited";
  }
  if (typeof body.status === "string") updates.status = body.status;

  const [narrative] = await db
    .update(generatedNarratives)
    .set(updates)
    .where(and(eq(generatedNarratives.id, narrativeId), eq(generatedNarratives.caseId, caseId)))
    .returning();

  if (!narrative) return NextResponse.json({ error: "Narrative not found." }, { status: 404 });
  return NextResponse.json({ narrative });
}
