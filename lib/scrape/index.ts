/**
 * Public entry for the scrape module. Owner: Ken.
 *
 * The orchestrator calls `scrapeProductCard(url)` once per run.
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
