/**
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
