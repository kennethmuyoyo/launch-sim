/**
 * Round-based simulation orchestrator.
 *
 * Runs reaction calls concurrently behind a semaphore, emits each event through the
 * provided callback as soon as it lands. The caller is responsible for picking
 * which reactions feed back into "memory" between rounds — see selectMemory().
 */

import type { Persona, ProductCard, Reaction, RunEvent } from "@/lib/shared/types";
import { generateReaction } from "./reactions";

export type OrchestrateOptions = {
  concurrency?: number;
  sampleFraction?: number; // fraction of personas asked to react each round (1.0 = all)
  jitterMs?: number;        // small stagger to keep the UI feeling alive
};

export async function orchestrateRound(
  personas: Persona[],
  product: ProductCard,
  memory: Reaction[],
  round: number,
  onEvent: (e: RunEvent) => void,
  opts: OrchestrateOptions = {},
): Promise<Reaction[]> {
  const concurrency = Math.max(1, opts.concurrency ?? 8);
  const sampleFraction = clamp01(opts.sampleFraction ?? 0.85);
  const jitterMs = Math.max(0, opts.jitterMs ?? 80);

  const sample = sampleSubset(personas, sampleFraction);
  const reactions: Reaction[] = [];

  let cursor = 0;
  const queue = sample;

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    for (;;) {
      const i = cursor;
      cursor += 1;
      if (i >= queue.length) return;

      const persona = queue[i];
      try {
        if (jitterMs) await sleep(Math.floor(Math.random() * jitterMs));
        const reaction = await generateReaction(persona, product, memory, round);
        reactions.push(reaction);
        onEvent({ type: "reaction", reaction });
      } catch (err) {
        // One persona's failure must not kill the round. Log to event log via skip.
        const message = err instanceof Error ? err.message : String(err);
        // Surface as a synthetic skip so the UI knows the persona was attempted.
        const skip: Reaction = {
          id: `r_skip_${persona.id}_r${round}`,
          round,
          persona_id: persona.id,
          platform: persona.platform,
          action: "skip",
          text: null,
          parent_id: null,
          sentiment: "neutral",
          friction_points: [`agent_error:${truncate(message, 80)}`],
          created_at: new Date().toISOString(),
        };
        reactions.push(skip);
        onEvent({ type: "reaction", reaction: skip });
      }
    }
  });

  await Promise.all(workers);
  return reactions;
}

/**
 * Choose which reactions become "feed memory" for the next round.
 *
 * Heuristic: keep the strongest signals (controversial > strong sentiment > shares > replies)
 * plus a few recent items, capped at topK.
 */
export function selectMemory(all: Reaction[], topK = 12): Reaction[] {
  const score = (r: Reaction) => {
    let s = 0;
    if (r.sentiment === "controversial") s += 4;
    if (r.sentiment === "negative") s += 2.5;
    if (r.sentiment === "positive") s += 2;
    if (r.action === "share") s += 2;
    if (r.action === "reply") s += 1.5;
    if (r.action === "comment") s += 1;
    if (r.text) s += Math.min(2, r.text.length / 120);
    if (r.friction_points.length) s += Math.min(1.5, r.friction_points.length * 0.5);
    s += r.round * 0.25; // bias toward recent rounds
    return s;
  };

  return [...all]
    .filter((r) => r.action !== "skip" || r.text) // skips with no text are pure noise
    .sort((a, b) => score(b) - score(a))
    .slice(0, topK);
}

function sampleSubset<T>(arr: T[], fraction: number): T[] {
  if (fraction >= 1) return arr.slice();
  const n = Math.max(1, Math.round(arr.length * fraction));
  // Fisher-Yates partial shuffle.
  const copy = arr.slice();
  for (let i = copy.length - 1; i > copy.length - 1 - n; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(copy.length - n);
}

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
