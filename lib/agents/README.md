# `lib/agents` — Owner: **John**

Persona generation + simulation orchestrator. Turns a `ProductCard` into a stream of `Reaction` events and a final `Forecast`.

## Responsibilities

1. **Persona generation** (`personas.ts`): given a `ProductCard`, produce N personas (default 30) stratified across Reddit / Twitter / TikTok and across `archetypes.ts` archetypes that fit the product.
2. **Reaction generation** (`reactions.ts`): per-persona LLM call producing a `Reaction` (action + text + sentiment + friction points). Prompt includes the persona, the ProductCard, and a window of recent reactions (so agents react to each other, not just the page).
3. **Orchestration** (`orchestrator.ts`): tick loop. Per round:
   - Sample a subset of idle personas to react.
   - Run reaction calls concurrently with a semaphore (~10 at a time).
   - Top-K most upvoted/controversial reactions enter every persona's "feed memory" for next round.
   - Emit each event through a callback so the API route can stream it via SSE.
4. **Aggregation** (`forecast.ts`): once rounds are done, summarize raw events into a `Forecast`. One final LLM call for the narrative + hot-tweet generation.

## Public API

```ts
import type { ProductCard, Persona, RunEvent, Forecast } from "@/lib/shared/types";

export async function runSimulation(
  product: ProductCard,
  onEvent: (e: RunEvent) => void,
  opts?: { personaCount?: number; rounds?: number }
): Promise<Forecast>;
```

## Files

- `archetypes.ts` — predefined internet archetype templates ("Reddit Indie Hacker", "TikTok Productivity Creator", "VC Twitter Guy", "Skeptical Senior Dev", etc.).
- `personas.ts` — persona generator (LLM, single batched call).
- `reactions.ts` — per-persona reaction LLM call.
- `orchestrator.ts` — tick loop, concurrency, diffusion.
- `forecast.ts` — final aggregation.

## Notes

- Use `lib/llm/openrouter.ts` (free model). Keep persona reactions short — one comment, ~1–3 sentences.
- Posting style matters more than realism. Vary caps/lowercase/emoji density across personas so the feed doesn't read uniform.
- Don't reach into `lib/scrape` or `app/`. Your inputs are `ProductCard`, your outputs are `RunEvent`s + a `Forecast`.
- Emit events via the `onEvent` callback as they happen — the API route translates them to SSE for the dashboard.
