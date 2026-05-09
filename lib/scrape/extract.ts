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

  const userContent: ChatMessage["content"] = capture.screenshotBase64
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
 * Heuristic extraction: PageCapture -> ProductCard. Owner: Ken.
 *
 * No-LLM baseline. Pulls obvious fields straight from the DOM (title, og:*, h1/h2,
 * CTA-shaped buttons, pricing keywords, testimonial signals). Smarter fields
 * (vibes, tone, virality_hooks, target_audience inference) are left empty for
 * the LLM extraction step to fill in later — it can read the same PageCapture
 * and merge results.
 */

import type { ProductCard } from "@/lib/shared/types";
import { ProductCardSchema } from "@/lib/shared/types";
import type { PageCapture } from "./playwright";

const PRICING_KEYWORDS = ["pricing", "free forever", "freemium", "free plan", "free tier", "subscription"];
const TESTIMONIAL_KEYWORDS = ["testimonial", "trusted by", "loved by", "what our customers", "what people are saying"];
const SOCIAL_PROOF_KEYWORDS = ["trusted by", "as seen on", "loved by", "users", "customers", "downloads"];

function pickMeta(meta: Record<string, string>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = meta[k];
    if (v && v.trim()) return v.trim();
  }
  return null;
}

function detectPricing(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("free forever") || lower.includes("100% free") || (lower.includes("free") && !lower.includes("free trial"))) {
    if (lower.match(/\$\s?\d/)) return "freemium";
    return "free";
  }
  const match = text.match(/\$\s?\d+(?:\.\d+)?\s?\/\s?(?:mo|month|year|yr)/i);
  if (match) return match[0].replace(/\s+/g, "");
  if (PRICING_KEYWORDS.some((k) => lower.includes(k))) return "freemium";
  return null;
}

function detectSocialProofStrength(text: string, capture: PageCapture): "none" | "weak" | "medium" | "strong" {
  const lower = text.toLowerCase();
  const hits = SOCIAL_PROOF_KEYWORDS.filter((k) => lower.includes(k)).length;
  const numericHit = /\b(\d{2,})\s+(users|customers|downloads|installs|developers)\b/i.test(text);
  const testimonialHit = TESTIMONIAL_KEYWORDS.some((k) => lower.includes(k));
  const screenshotHasLogos = false; // TODO(ken): could detect a "logo strip" by image clustering later

  let score = 0;
  score += hits > 0 ? 1 : 0;
  score += numericHit ? 2 : 0;
  score += testimonialHit ? 1 : 0;
  score += capture.headings.h2.length > 4 ? 1 : 0;
  if (screenshotHasLogos) score += 1;

  if (score === 0) return "none";
  if (score === 1) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}

function bestPrimaryCTA(buttons: string[]): string | null {
  const ranked = buttons
    .filter((b) => b.length > 1 && b.length < 40)
    .sort((a, b) => {
      const score = (s: string) => {
        const l = s.toLowerCase();
        if (/get started|sign up|try.*free|start free|join|book|download|install/.test(l)) return 3;
        if (/learn more|see how|read more/.test(l)) return 1;
        return 2;
      };
      return score(b) - score(a);
    });
  return ranked[0] ?? null;
}

function pickKeyFeatures(headings: PageCapture["headings"]): string[] {
  const candidates = [...headings.h2, ...headings.h3]
    .map((h) => h.replace(/\s+/g, " ").trim())
    .filter((h) => h.length > 4 && h.length < 80)
    .filter((h) => !/sign up|log in|pricing|faq|blog|contact|company|about/i.test(h));
  return Array.from(new Set(candidates)).slice(0, 8);
}

export async function extractProductCard(capture: PageCapture): Promise<ProductCard> {
  const meta = capture.metadata;
  const text = capture.textContent;

  const titleStem = capture.title.split(/[|—\-:]/)[0].trim();
  const name =
    pickMeta(meta, "og:site_name") ??
    pickMeta(meta, "application-name") ??
    (titleStem || capture.title || new URL(capture.finalUrl).hostname);

  const tagline = pickMeta(meta, "og:description", "twitter:description", "description");
  const headline = capture.headings.h1[0] ?? null;
  const subheadline = capture.headings.h2[0] ?? null;

  const card: ProductCard = {
    url: capture.url,
    scraped_at: new Date().toISOString(),

    name,
    tagline,
    category: null, // LLM will fill later
    headline,
    subheadline,
    primary_cta: bestPrimaryCTA(capture.buttons),
    key_features: pickKeyFeatures(capture.headings),
    target_audience: [],
    pricing: detectPricing(text),
    testimonials: [], // LLM will fill later
    social_proof_strength: detectSocialProofStrength(text, capture),
    visual_style: null,
    tone: null,
    vibes: [],
    screenshots: capture.screenshotDataUrl ? [capture.screenshotDataUrl] : [],
    virality_hooks: [],
    risk_factors: capture.blocked ? ["scraper_blocked"] : [],
  };

  return ProductCardSchema.parse(card);
}
