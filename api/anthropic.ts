const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "Anthropic API key is not configured on the server." });
  }

  const { system, user, json = false, temperature = 0.2 } = req.body ?? {};
  if (typeof system !== "string" || typeof user !== "string") {
    return res.status(400).json({ error: "Invalid request payload." });
  }

  const prefill = json ? "[" : null;

  let upstream;
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
        temperature,
        system,
        messages: [
          { role: "user", content: user },
          ...(prefill ? [{ role: "assistant", content: prefill }] : []),
        ],
      }),
    });
  } catch {
    return res.status(502).json({ error: "Could not reach Anthropic." });
  }

  const bodyText = await upstream.text();
  if (!upstream.ok) {
    return res.status(upstream.status).send(bodyText);
  }

  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    return res.status(502).json({ error: "Anthropic returned malformed data." });
  }

  const text = data?.content
    ?.filter((part: { type: string }) => part.type === "text")
    .map((part: { text: string }) => part.text)
    .join("")
    .trim();

  if (!text) {
    return res.status(502).json({ error: "Anthropic returned an empty response." });
  }

  return res.status(200).json({ text: prefill ? prefill + text : text });
}