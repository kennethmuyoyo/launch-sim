/**
 * Thin OpenRouter client. Shared by lib/scrape (extraction) and lib/agents (personas, reactions, narrative).
 *
 * Set OPENROUTER_API_KEY and OPENROUTER_MODEL in .env.local. Defaults to a free model.
 *
 * Docs: https://openrouter.ai/docs
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
};

export type ChatOptions = {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
};

export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const model = opts.model ?? process.env.OPENROUTER_MODEL ?? "google/gemini-2.0-flash-exp:free";

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.OPENROUTER_REFERER ?? "http://localhost:3000",
      "X-Title": "Vibe App Launch Simulator",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.9,
      max_tokens: opts.max_tokens ?? 800,
      ...(opts.response_format ? { response_format: opts.response_format } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body}`);
  }

  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

export async function chatJSON<T>(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<T> {
  const raw = await chat(messages, { ...opts, response_format: { type: "json_object" } });
  // Some free models still return code-fenced JSON — strip if present.
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned) as T;
}
