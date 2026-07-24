import { NextResponse } from "next/server";
import { callAnthropic } from "@/backend/anthropicClient";

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Anthropic API key is not configured on the server." }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const { system, user, schema } = body ?? {};
  if (typeof system !== "string" || typeof user !== "string") {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const result = await callAnthropic({ system, user, schema });
  if (!result.ok) {
    return new NextResponse(result.body, {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return NextResponse.json({ text: result.text });
}
