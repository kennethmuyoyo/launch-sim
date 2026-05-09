/**
 * LLM extraction: PageCapture -> ProductCard. Owner: Ken.
 *
 * Uses lib/llm/openrouter.ts. Prompt should ask for strict JSON matching ProductCardSchema.
 */

import type { ProductCard } from "@/lib/shared/types";
import type { PageCapture } from "./playwright";

export async function extractProductCard(_capture: PageCapture): Promise<ProductCard> {
  // TODO(ken): build the prompt, call OpenRouter, parse with ProductCardSchema
  throw new Error("extractProductCard not yet implemented");
}
