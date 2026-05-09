/**
 * Public entry for the agents module. Owner: John.
 *
 * The API route calls `runSimulation(product, onEvent)` and forwards events to the client.
 */

import type { Forecast, ProductCard, RunEvent } from "@/lib/shared/types";

export type RunSimulationOptions = {
  personaCount?: number; // default 30
  rounds?: number;       // default 5
};

export async function runSimulation(
  _product: ProductCard,
  _onEvent: (e: RunEvent) => void,
  _opts: RunSimulationOptions = {},
): Promise<Forecast> {
  // TODO(john): implement
  // 1. personas = generatePersonas(product, count)        -> personas.ts
  // 2. for round in rounds:
  //      reactions = await orchestrateRound(personas, product, memory) -> orchestrator.ts
  //      onEvent({type: "reaction", ...}) for each
  // 3. forecast = aggregate(product, allReactions)         -> forecast.ts
  throw new Error("runSimulation not yet implemented");
}
