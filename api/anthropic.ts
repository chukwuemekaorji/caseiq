import { callAnthropic } from "../backend/anthropicClient";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Anthropic API key is not configured on the server." });
  }

  const { system, user, json = false, temperature = 0.2 } = req.body ?? {};
  if (typeof system !== "string" || typeof user !== "string") {
    return res.status(400).json({ error: "Invalid request payload." });
  }

  const result = await callAnthropic({ system, user, json, temperature });
  if (!result.ok) {
    res.status(result.status);
    res.setHeader("Content-Type", "application/json");
    return res.send(result.body);
  }

  return res.status(200).json({ text: result.text });
}
