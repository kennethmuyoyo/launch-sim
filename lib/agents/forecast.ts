/**
 * Final aggregation: raw reactions -> Forecast. Owner: John.
 */

import type { Forecast, ProductCard, Reaction } from "@/lib/shared/types";

export async function aggregateForecast(
  _runId: string,
  _product: ProductCard,
  _reactions: Reaction[],
): Promise<Forecast> {
  // TODO(john): cluster sentiment, pick top comments, run narrative-summary LLM call
  throw new Error("aggregateForecast not yet implemented");
}
