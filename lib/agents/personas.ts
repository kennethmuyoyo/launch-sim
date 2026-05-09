/**
 * Persona generator. Owner: John.
 *
 * Single batched LLM call: ProductCard + ARCHETYPES -> N concrete personas.
 */

import type { Persona, ProductCard } from "@/lib/shared/types";

export async function generatePersonas(
  _product: ProductCard,
  _count = 30,
): Promise<Persona[]> {
  // TODO(john): build prompt, call OpenRouter, validate with PersonaSchema
  throw new Error("generatePersonas not yet implemented");
}
