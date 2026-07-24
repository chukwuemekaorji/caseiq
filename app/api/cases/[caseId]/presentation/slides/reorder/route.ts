import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { presentationSlides } from "@/db/schema";

export async function POST(req: Request, context: { params: Promise<{ caseId: string }> }) {
  await context.params;
  const body = await req.json().catch(() => null);
  const order: string[] | undefined = body?.order;
  if (!Array.isArray(order)) {
    return NextResponse.json({ error: "order must be an array of slide IDs." }, { status: 400 });
  }

  await Promise.all(
    order.map((slideId, index) =>
      db.update(presentationSlides).set({ order: index, updatedAt: new Date() }).where(eq(presentationSlides.id, slideId))
    )
  );

  return NextResponse.json({ ok: true });
}
