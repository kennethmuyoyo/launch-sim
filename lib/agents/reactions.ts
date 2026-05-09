/**
 * Per-persona reaction generator. Owner: John.
 *
 * Given a persona, the product, and a window of recent reactions (memory),
 * produce the persona's next reaction event.
 */

import type { Persona, ProductCard, Reaction } from "@/lib/shared/types";

export async function generateReaction(
  _persona: Persona,
  _product: ProductCard,
  _memory: Reaction[],
  _round: number,
): Promise<Reaction> {
  // TODO(john): build prompt with persona voice + recent feed, call OpenRouter
  throw new Error("generateReaction not yet implemented");
}
