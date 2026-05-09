/**
 * Public entry for the agents module.
 *
 * The API route calls `runSimulation(product, onEvent)` and forwards events to the client.
 *
 * Lifecycle (the events runSimulation emits, in order):
 *   1. status: "generating_personas"
 *   2. personas: Persona[]
 *   3. status: "simulating"
 *   4. one "reaction" event per persona reaction across all rounds (emitted by orchestrator)
 *   5. status: "aggregating"
 *
 * runSimulation does NOT emit the final "forecast" or "done" events — the API route owns
 * that boundary so there is exactly ONE source of truth for terminal events.
 */

import type { Forecast, ProductCard, Reaction, RunEvent } from "@/lib/shared/types";
import { generatePersonas } from "./personas";
import { orchestrateRound, selectMemory } from "./orchestrator";
import { aggregateForecast } from "./forecast";

export type RunSimulationOptions = {
  personaCount?: number; // default 18 (kept small for free-tier latency)
  rounds?: number;       // default 3
  concurrency?: number;  // default 8
  topMemoryK?: number;   // default 12
  runId?: string;        // for forecast.run_id; defaults to a fresh uuid
  model?: string;        // override OPENROUTER_MODEL for this run
};

export async function runSimulation(
  product: ProductCard,
  onEvent: (e: RunEvent) => void,
  opts: RunSimulationOptions = {},
): Promise<Forecast> {
  const personaCount = opts.personaCount ?? 18;
  const rounds = opts.rounds ?? 3;
  const concurrency = opts.concurrency ?? 8;
  const topMemoryK = opts.topMemoryK ?? 12;
  const runId = opts.runId ?? cryptoRandomId();

  // ---- Personas ----
  onEvent({ type: "status", status: "generating_personas" });
  const personas = await generatePersonas(product, personaCount, { model: opts.model });
  onEvent({ type: "personas", personas });

  // ---- Rounds ----
  onEvent({ type: "status", status: "simulating" });
  const allReactions: Reaction[] = [];
  let memory: Reaction[] = [];

  for (let round = 1; round <= rounds; round++) {
    const roundReactions = await orchestrateRound(
      personas,
      product,
      memory,
      round,
      onEvent,
      { concurrency },
    );
    allReactions.push(...roundReactions);
    memory = selectMemory(allReactions, topMemoryK);
  }

  // ---- Aggregation ----
  onEvent({ type: "status", status: "aggregating" });
  const forecast = await aggregateForecast(runId, product, allReactions, { model: opts.model });

  // NOTE: we intentionally do NOT emit { type: "forecast" } or { type: "status", status: "done" }.
  // The API route owns those terminal events to keep one source of truth.
  return forecast;
}

function cryptoRandomId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
