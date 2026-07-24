import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { generatedNarratives } from "@/db/schema";

export async function GET(_req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  const narratives = await db
    .select()
    .from(generatedNarratives)
    .where(eq(generatedNarratives.caseId, caseId));
  return NextResponse.json({ narratives });
}
