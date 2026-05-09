/**
 * Public entry for the scrape module. Owner: Ken.
 *
 * The orchestrator calls `scrapeProductCard(url)` once per run.
 * Implementation lives in playwright.ts + extract.ts.
 */

import type { ProductCard } from "@/lib/shared/types";

export async function scrapeProductCard(url: string): Promise<ProductCard> {
  // TODO(ken): implement
  // 1. const dom = await capturePage(url)  -> playwright.ts
  // 2. const card = await extractProductCard(dom)  -> extract.ts (LLM)
  // 3. return ProductCardSchema.parse(card)
  throw new Error(`scrapeProductCard not yet implemented (url=${url})`);
}
