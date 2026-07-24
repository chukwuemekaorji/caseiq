const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

export interface AnthropicCallOptions {
  system: string;
  user: string;
  json?: boolean;
}

export type AnthropicResult =
  | { ok: true; text: string }
  | { ok: false; status: number; body: string };

export async function callAnthropic({
  system,
  user,
  json = false,
}: AnthropicCallOptions): Promise<AnthropicResult> {
  const key = process.env.ANTHROPIC_API_KEY!;
  const prefill = json ? "[" : null;

  let upstream: Response;
  try {
    upstream = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system,
        messages: [
          { role: "user", content: user },
          ...(prefill ? [{ role: "assistant", content: prefill }] : []),
        ],
      }),
    });
  } catch {
    return { ok: false, status: 502, body: JSON.stringify({ error: "Could not reach Anthropic." }) };
  }

  const bodyText = await upstream.text();
  if (!upstream.ok) {
    return { ok: false, status: upstream.status, body: bodyText };
  }

  let data: { content?: { type: string; text: string }[] };
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

  return { ok: true, text: prefill ? prefill + text : text };
}
