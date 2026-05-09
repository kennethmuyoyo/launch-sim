/**
 * Client-side demo simulator.
 *
 * Emits a sequence of RunEvents that mirrors what John's orchestrator will
 * eventually emit over SSE. The dashboard derives all view state from these
 * events — when the real backend is wired up, the dashboard works unchanged.
 */

import type {
  Forecast,
  Persona,
  ProductCard,
  Reaction,
  RunEvent,
} from "@/lib/shared/types";
import { pickScenario, type DemoScenario } from "@/lib/demo/data";

type Cancel = () => void;

export type DemoSpeed = "live" | "fast";

const SCHEDULE = {
  live: {
    afterScrape: 1500,
    afterCard: 700,
    afterPersonaStatus: 600,
    afterPersonas: 800,
    minReactionGap: 240,
    maxReactionGap: 720,
    afterReactions: 900,
    afterAggregate: 700,
  },
  fast: {
    afterScrape: 600,
    afterCard: 300,
    afterPersonaStatus: 200,
    afterPersonas: 300,
    minReactionGap: 80,
    maxReactionGap: 220,
    afterReactions: 400,
    afterAggregate: 300,
  },
} as const;

export function startDemoStream(
  url: string,
  onEvent: (e: RunEvent) => void,
  speed: DemoSpeed = "live",
): Cancel {
  const scenario = pickScenario(url);
  const sched = SCHEDULE[speed];
  const timers: Array<ReturnType<typeof setTimeout>> = [];

  let now = 0;
  const at = (delay: number, fn: () => void) => {
    now += delay;
    timers.push(setTimeout(fn, now));
  };

  // 1. status: scraping
  at(0, () => onEvent({ type: "status", status: "scraping" }));

  // 2. product_card
  const product = inflateProduct(scenario);
  at(sched.afterScrape, () => onEvent({ type: "product_card", product }));

  // 3. status: generating_personas
  at(sched.afterCard, () => onEvent({ type: "status", status: "generating_personas" }));

  // 4. personas
  const personas = inflatePersonas(scenario);
  at(sched.afterPersonaStatus, () => onEvent({ type: "personas", personas }));

  // 5. status: simulating
  at(sched.afterPersonas, () => onEvent({ type: "status", status: "simulating" }));

  // 6. reactions, dripped
  const personaByHandle = new Map(personas.map((p) => [p.display_name, p]));
  scenario.reactions.forEach((r) => {
    const persona = personaByHandle.get(r.handle);
    if (!persona) return;
    const gap =
      sched.minReactionGap +
      Math.floor(Math.random() * (sched.maxReactionGap - sched.minReactionGap));
    at(gap, () => {
      const reaction: Reaction = {
        id: cryptoId(),
        round: r.round,
        persona_id: persona.id,
        platform: r.platform,
        action: r.action,
        text: r.text,
        parent_id: r.parent_id,
        sentiment: r.sentiment,
        friction_points: r.friction_points,
        created_at: new Date().toISOString(),
      };
      onEvent({ type: "reaction", reaction });
    });
  });

  // 7. status: aggregating
  at(sched.afterReactions, () =>
    onEvent({ type: "status", status: "aggregating" }),
  );

  // 8. forecast
  at(sched.afterAggregate, () => {
    const forecast = inflateForecast(scenario, product, []);
    onEvent({ type: "forecast", forecast });
  });

  // 9. status: done
  at(400, () => onEvent({ type: "status", status: "done" }));

  return () => timers.forEach(clearTimeout);
}

function inflateProduct(s: DemoScenario): ProductCard {
  return {
    url: s.url,
    scraped_at: new Date().toISOString(),
    ...s.product,
  };
}

function inflatePersonas(s: DemoScenario): Persona[] {
  return s.personas.map((p) => ({ id: cryptoId(), ...p }));
}

function inflateForecast(
  s: DemoScenario,
  product: ProductCard,
  _reactions: Reaction[],
): Forecast {
  return {
    run_id: cryptoId(),
    product,
    launch_score: s.forecast.launch_score,
    virality_potential: s.forecast.virality_potential,
    most_likely_audience: s.forecast.most_likely_audience,
    biggest_viral_hook: s.forecast.biggest_viral_hook,
    biggest_weakness: s.forecast.biggest_weakness,
    reddit_reception: s.forecast.reddit_reception,
    twitter_reception: s.forecast.twitter_reception,
    tiktok_reception: s.forecast.tiktok_reception,
    sentiment_breakdown: s.forecast.sentiment_breakdown,
    top_comments: [],
    ux_friction: s.forecast.ux_friction,
    predicted_hot_tweets: s.forecast.predicted_hot_tweets,
    narrative: s.forecast.narrative,
  };
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

/**
 * Pull demo-only "view extras" — fields that aren't in the strict
 * Forecast schema yet but the dashboard renders (metrics grid breakdown,
 * strengths/weaknesses lists). Keyed off the URL the demo was started for.
 */
export function getViewExtras(url: string) {
  const s = pickScenario(url);
  return {
    metrics: s.forecast.metrics,
    strengths: s.forecast.strengths,
    weaknesses: s.forecast.weaknesses,
  };
}
