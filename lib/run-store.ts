/**
 * In-memory run state, keyed by runId. No DB for the hackathon.
 *
 * The /api/run POST route creates a Run, kicks off scrape -> agents in the background,
 * and the SSE route streams events from the Run's event log.
 */

import type { Forecast, Persona, ProductCard, RunEvent, RunStatus } from "@/lib/shared/types";

export type Run = {
  id: string;
  url: string;
  status: RunStatus;
  product: ProductCard | null;
  personas: Persona[];
  events: RunEvent[];
  forecast: Forecast | null;
  error: string | null;
  subscribers: Set<(e: RunEvent) => void>;
};

const runs = new Map<string, Run>();

export function createRun(url: string): Run {
  const id = crypto.randomUUID();
  const run: Run = {
    id,
    url,
    status: "queued",
    product: null,
    personas: [],
    events: [],
    forecast: null,
    error: null,
    subscribers: new Set(),
  };
  runs.set(id, run);
  return run;
}

export function getRun(id: string): Run | undefined {
  return runs.get(id);
}

export function emit(run: Run, event: RunEvent) {
  run.events.push(event);
  if (event.type === "status") run.status = event.status;
  if (event.type === "product_card") run.product = event.product;
  if (event.type === "personas") run.personas = event.personas;
  if (event.type === "forecast") run.forecast = event.forecast;
  if (event.type === "error") {
    run.error = event.message;
    run.status = "error";
  }
  for (const sub of run.subscribers) sub(event);
}

export function subscribe(run: Run, fn: (e: RunEvent) => void): () => void {
  run.subscribers.add(fn);
  return () => run.subscribers.delete(fn);
}
