import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { cases } from "@/db/schema";

export async function PATCH(req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const body = await req.json().catch(() => null);
  const incidentDate = typeof body?.incidentDate === "string" ? body.incidentDate : null;

  await db
    .update(cases)
    .set({ incidentDate, updatedAt: new Date() })
    .where(eq(cases.id, caseId));

  return NextResponse.json({ ok: true });
}
