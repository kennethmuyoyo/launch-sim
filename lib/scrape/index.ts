/**
 * Public entry for the scrape module.
 *
 * The orchestrator calls `scrapeProductCard(url)` once per run.
 *
 * If Playwright is blocked (CF challenge, anti-bot, network error) we still try to
 * return a best-effort partial ProductCard with `risk_factors: ["scraper_blocked"]`
 * so the dashboard can flag it instead of crashing the run.
 */

import { ProductCardSchema, type ProductCard } from "@/lib/shared/types";
import { capturePage } from "./playwright";
import { extractProductCard } from "./extract";

export async function scrapeProductCard(url: string): Promise<ProductCard> {
  let captureErr: unknown = null;

  try {
    const capture = await capturePage(url);

    // Even if capture succeeded, extraction might fail (LLM JSON drift, schema, etc.).
    try {
      return await extractProductCard(capture);
    } catch (extractErr) {
      // Build a deterministic fallback from what Playwright DID see, with a clear risk flag.
      return buildFallbackFromCapture(url, capture, extractErr);
    }
  } catch (err) {
    captureErr = err;
  }

  // Capture itself failed (anti-bot, timeout, DNS, etc.). Return scraper-blocked stub.
  return buildBlockedFallback(url, captureErr);
}

function buildFallbackFromCapture(
  url: string,
  capture: { title: string; metadata: Record<string, string>; textContent: string },
  err: unknown,
): ProductCard {
  const message = err instanceof Error ? err.message : String(err);
  const desc =
    capture.metadata["og:description"] ??
    capture.metadata["twitter:description"] ??
    capture.metadata["description"] ??
    null;

  const guessName =
    capture.metadata["og:site_name"] ??
    (capture.title?.split(/[—|·\-:]/)[0]?.trim() || capture.title) ??
    new URL(url).hostname;

  return ProductCardSchema.parse({
    url,
    scraped_at: new Date().toISOString(),
    name: guessName || "Unknown",
    tagline: desc,
    category: null,
    headline: capture.metadata["og:title"] ?? capture.title ?? null,
    subheadline: desc,
    primary_cta: null,
    key_features: [],
    target_audience: [],
    pricing: null,
    testimonials: [],
    social_proof_strength: "none",
    visual_style: null,
    tone: null,
    vibes: [],
    screenshots: [],
    virality_hooks: [],
    risk_factors: ["llm_extraction_failed", `extract_error:${truncate(message, 120)}`],
  });
}

function buildBlockedFallback(url: string, err: unknown): ProductCard {
  const message = err instanceof Error ? err.message : String(err);
  return ProductCardSchema.parse({
    url,
    scraped_at: new Date().toISOString(),
    name: safeHostname(url),
    tagline: null,
    category: null,
    headline: null,
    subheadline: null,
    primary_cta: null,
    key_features: [],
    target_audience: [],
    pricing: null,
    testimonials: [],
    social_proof_strength: "none",
    visual_style: null,
    tone: null,
    vibes: [],
    screenshots: [],
    virality_hooks: [],
    risk_factors: ["scraper_blocked", `capture_error:${truncate(message, 120)}`],
  });
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
 */

import type { ProductCard } from "@/lib/shared/types";
import { extractProductCard } from "./extract";
import { llmEnrich } from "./extract-llm";
import { capturePage } from "./playwright";

export async function scrapeProductCard(url: string): Promise<ProductCard> {
  const capture = await capturePage(url);
  const baseline = await extractProductCard(capture);

  // No key? Skip enrichment — the demo still works on the heuristic baseline.
  if (!process.env.OPENROUTER_API_KEY) return baseline;

  try {
    return await llmEnrich(baseline, capture);
  } catch (err) {
    // Free-tier rate limits, malformed JSON, etc. — fall back rather than fail the run.
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[scrape] llmEnrich failed, falling back to baseline: ${message}`);
    return baseline;
  }
}
