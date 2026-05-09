/**
 * Round-based simulation orchestrator. Owner: John.
 *
 * Runs reaction calls concurrently (semaphore), updates memory between rounds,
 * emits events through the provided callback.
 */

import type { Persona, ProductCard, Reaction, RunEvent } from "@/lib/shared/types";

export async function orchestrateRound(
  _personas: Persona[],
  _product: ProductCard,
  _memory: Reaction[],
  _round: number,
  _onEvent: (e: RunEvent) => void,
): Promise<Reaction[]> {
  // TODO(john): sample subset, run generateReaction with concurrency limit, emit events
  throw new Error("orchestrateRound not yet implemented");
}
