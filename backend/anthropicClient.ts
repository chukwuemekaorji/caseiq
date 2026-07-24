const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

export interface AnthropicCallOptions {
  system: string;
  user: string;
  /** JSON schema for structured output. Omit for a plain-text response. */
  schema?: object;
}

export type AnthropicResult =
  | { ok: true; text: string }
  | { ok: false; status: number; body: string };

export async function callAnthropic({ system, user, schema }: AnthropicCallOptions): Promise<AnthropicResult> {
  const key = process.env.ANTHROPIC_API_KEY!;

  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: 8192,
    // This model enables extended thinking by default on harder prompts, and
    // thinking tokens count against max_tokens — on a big case context, thinking
    // alone can consume the entire budget and leave nothing for the actual
    // answer (observed as an empty response). We never surface a reasoning
    // trace to the user, so disable it outright.
    thinking: { type: "disabled" },
    system,
    messages: [{ role: "user", content: user }],
  };

  if (schema) {
    body.output_config = { format: { type: "json_schema", schema } };
  }

  let upstream: Response;
  try {
    upstream = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 502, body: JSON.stringify({ error: "Could not reach Anthropic." }) };
  }

  const bodyText = await upstream.text();
  if (!upstream.ok) {
    return { ok: false, status: upstream.status, body: bodyText };
  }

  let data: { content?: { type: string; text: string }[]; stop_reason?: string };
  try {
    data = JSON.parse(bodyText);
  } catch {
    return { ok: false, status: 502, body: JSON.stringify({ error: "Anthropic returned malformed data." }) };
  }

  const text = data.content
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
    .trim();

  if (!text) {
    return { ok: false, status: 502, body: JSON.stringify({ error: "Anthropic returned an empty response." }) };
  }

  return { ok: true, text };
}
