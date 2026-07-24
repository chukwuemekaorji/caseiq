import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clientContextEntries } from "@/db/schema";

const PATCHABLE = ["verified", "aiUsable", "confidential", "category", "content", "tags"] as const;

export async function PATCH(
  req: Request,
  context: { params: Promise<{ caseId: string; entryId: string }> }
) {
  const { caseId, entryId } = await context.params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of PATCHABLE) {
    if (key in body) updates[key] = body[key];
  }

  const [entry] = await db
    .update(clientContextEntries)
    .set(updates)
    .where(and(eq(clientContextEntries.id, entryId), eq(clientContextEntries.caseId, caseId)))
    .returning();

  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  return NextResponse.json({ entry });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ caseId: string; entryId: string }> }
) {
  const { caseId, entryId } = await context.params;
  await db
    .delete(clientContextEntries)
    .where(and(eq(clientContextEntries.id, entryId), eq(clientContextEntries.caseId, caseId)));
  return NextResponse.json({ ok: true });
}
