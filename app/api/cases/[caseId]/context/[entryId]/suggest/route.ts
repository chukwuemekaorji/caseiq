import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clientContextEntries } from "@/db/schema";
import { callAnthropic } from "@/backend/anthropicClient";

const SCHEMA = {
  type: "object",
  properties: {
    storyPointTitle: { type: "string" },
    storyPointDescription: { type: "string" },
    followUpQuestions: { type: "array", items: { type: "string" } },
    suggestedEvidence: { type: "array", items: { type: "string" } },
  },
  required: ["storyPointTitle", "storyPointDescription", "followUpQuestions", "suggestedEvidence"],
  additionalProperties: false,
};

export async function POST(
  _req: Request,
  context: { params: Promise<{ caseId: string; entryId: string }> }
) {
  const { caseId, entryId } = await context.params;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Anthropic API key is not configured on the server." }, { status: 500 });
  }

  const [entry] = await db
    .select()
    .from(clientContextEntries)
    .where(and(eq(clientContextEntries.id, entryId), eq(clientContextEntries.caseId, caseId)))
    .limit(1);

  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  const result = await callAnthropic({
    system:
      "You are helping a personal-injury attorney turn a client note into usable case material. Suggest a draft only — the attorney decides whether to use it.",
    schema: SCHEMA,
    user: `Client context note: "${entry.content}"

Suggest:
1. A short story-point title (six words max) and a one-paragraph description framing this as part of the client's injury story.
2. Two or three follow-up questions the attorney should ask the client to firm up this note.
3. Two or three concrete pieces of evidence that could support this note (e.g. "statement from spouse", "employer attendance records").`,
  });

  if (!result.ok) {
    return new NextResponse(result.body, { status: result.status, headers: { "Content-Type": "application/json" } });
  }

  try {
    const parsed = JSON.parse(result.text);
    return NextResponse.json({ suggestion: parsed });
  } catch {
    return NextResponse.json({ error: "The model returned malformed data." }, { status: 502 });
  }
}
