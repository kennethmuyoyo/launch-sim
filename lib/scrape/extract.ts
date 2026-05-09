/**
 * LLM extraction: PageCapture -> ProductCard.
 *
 * Uses lib/llm/openrouter.ts with response_format: json_object. The prompt instructs
 * the model to return strict JSON matching ProductCardSchema (we still validate after).
 */

import { ProductCardSchema, type ProductCard } from "@/lib/shared/types";
import { chatJSON, type ChatMessage } from "@/lib/llm/openrouter";
import type { PageCapture } from "./playwright";

const SYSTEM_PROMPT = `You are a senior product marketer reverse-engineering a landing page into a structured "ProductCard" JSON.

Your job: extract positioning, tone, audience, and viral hooks from the raw page content the user pastes. Be opinionated and specific. Return ONE valid JSON object — no prose, no code fences.

Required JSON shape (all keys MUST be present; use null or [] when unknown):

{
  "url": string,                       // echo back the input URL
  "scraped_at": string,                // ISO timestamp (echo back what user gives)
  "name": string,                      // product name
  "tagline": string | null,            // short positioning line
  "category": string | null,           // e.g. "AI study app", "SaaS dashboard", "indie game"
  "headline": string | null,           // hero headline
  "subheadline": string | null,        // supporting line under hero
  "primary_cta": string | null,        // exact CTA button text if findable
  "key_features": string[],            // 3-7 feature bullets in plain language
  "target_audience": string[],         // who this is for, 1-4 segments
  "pricing": string | null,            // "free", "freemium", "$X/mo", etc., or null
  "testimonials": string[],            // verbatim quotes if present
  "social_proof_strength": "none" | "weak" | "medium" | "strong",
  "visual_style": string | null,       // e.g. "Apple-inspired minimal", "brutalist", "playful"
  "tone": string | null,               // e.g. "minimalist", "hype-bro", "earnest", "techbro"
  "vibes": string[],                   // 2-5 short vibe tags
  "screenshots": string[],             // leave [] — caller fills this
  "virality_hooks": string[],          // what could go viral about this — be honest
  "risk_factors": string[]             // weaknesses/red flags a skeptic would call out
}

Be concise. Do NOT invent features the page doesn't claim. Match the page's own tone in your descriptions.`;

const MAX_HTML_FOR_PROMPT = 8_000;
const MAX_TEXT_FOR_PROMPT = 9_000;

export type ExtractOptions = {
  model?: string;
};

export async function extractProductCard(
  capture: PageCapture,
  opts: ExtractOptions = {},
): Promise<ProductCard> {
  const scrapedAt = new Date().toISOString();

  const navLines = capture.navLinks
    .slice(0, 20)
    .map((l) => `- ${l.text}  ->  ${l.href}`)
    .join("\n");

  const metaLines = Object.entries(capture.metadata)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const userText = [
    `INPUT URL: ${capture.url}`,
    `FINAL URL (after redirects): ${capture.finalUrl}`,
    `SCRAPED_AT: ${scrapedAt}`,
    `PAGE TITLE: ${capture.title}`,
    "",
    `OG / META TAGS:\n${metaLines || "(none)"}`,
    "",
    `NAV / TOP LINKS:\n${navLines || "(none)"}`,
    "",
    `VISIBLE TEXT (truncated):\n${capture.textContent.slice(0, MAX_TEXT_FOR_PROMPT)}`,
    "",
    `HTML SNIPPET (truncated):\n${capture.htmlSnippet.slice(0, MAX_HTML_FOR_PROMPT)}`,
    "",
    "Now produce the JSON ProductCard.",
  ].join("\n");

  // Most reliable free OpenRouter models are text-only. Enabling vision is opt-in
  // (OPENROUTER_VISION=1) because vision-capable free models are aggressively
  // rate-limited (Google) or are reasoning models that burn tokens on internal CoT.
  const useVision = process.env.OPENROUTER_VISION === "1" && Boolean(capture.screenshotBase64);
  const userContent: ChatMessage["content"] = useVision
    ? [
        { type: "text", text: userText },
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${capture.screenshotBase64}` },
        },
      ]
    : userText;

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];

  const raw = await chatJSON<unknown>(messages, {
    model: opts.model,
    temperature: 0.3,
    max_tokens: 1400,
  });

  const merged = {
    ...(raw as Record<string, unknown>),
    url: capture.url,
    scraped_at: scrapedAt,
    screenshots: capture.screenshotBase64
      ? [`data:image/jpeg;base64,${capture.screenshotBase64.slice(0, 64)}…`]
      : [],
  };

  const parsed = ProductCardSchema.safeParse(merged);
  if (!parsed.success) {
    throw new Error(
      `extractProductCard: schema validation failed: ${parsed.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}
