import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { evidenceCompositions } from "@/db/schema";

export async function GET(_req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const items = await db
    .select()
    .from(evidenceCompositions)
    .where(eq(evidenceCompositions.caseId, caseId))
    .orderBy(desc(evidenceCompositions.createdAt));
  return NextResponse.json({ compositions: items });
}

export async function POST(req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.claimTitle !== "string" || !body.claimTitle.trim()) {
    return NextResponse.json({ error: "Claim title is required." }, { status: 400 });
  }

  const [item] = await db
    .insert(evidenceCompositions)
    .values({
      caseId,
      claimTitle: body.claimTitle.trim(),
      claimDescription: typeof body.claimDescription === "string" ? body.claimDescription : "",
    })
    .returning();

  return NextResponse.json({ composition: item });
}
