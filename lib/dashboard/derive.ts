/**
 * Derivations: RunEvent[] -> view state for the dashboard.
 *
 * Everything the cinematic dashboard renders is computed from the typed
 * RunEvent stream defined in lib/shared/types.ts. No mutation, no extra
 * shapes coming back from the server. When the real backend emits the
 * same events as the demo simulator, the dashboard works unchanged.
 */

import type {
  Forecast,
  Persona,
  ProductCard,
  Reaction,
  RunEvent,
  RunStatus,
} from "@/lib/shared/types";

export type DerivedState = {
  status: RunStatus;
  product: ProductCard | null;
  personas: Persona[];
  reactions: Reaction[];
  forecast: Forecast | null;
  errorMessage: string | null;
};

export function derive(events: RunEvent[]): DerivedState {
  let status: RunStatus = "queued";
  let product: ProductCard | null = null;
  let personas: Persona[] = [];
  const reactions: Reaction[] = [];
  let forecast: Forecast | null = null;
  let errorMessage: string | null = null;

  for (const e of events) {
    switch (e.type) {
      case "status": status = e.status; break;
      case "product_card": product = e.product; break;
      case "personas": personas = e.personas; break;
      case "reaction": reactions.push(e.reaction); break;
      case "forecast": forecast = e.forecast; break;
      case "error": errorMessage = e.message; status = "error"; break;
    }
  }

  return { status, product, personas, reactions, forecast, errorMessage };
}

// -----------------------------------------------------------------------------
// Momentum + sentiment series
// -----------------------------------------------------------------------------

export type SentimentPoint = { i: number; pos: number; neu: number; neg: number; ctrl: number; momentum: number };

export function sentimentSeries(reactions: Reaction[]): SentimentPoint[] {
  const out: SentimentPoint[] = [];
  let pos = 0, neu = 0, neg = 0, ctrl = 0;
  reactions.forEach((r, i) => {
    if (r.sentiment === "positive") pos++;
    else if (r.sentiment === "negative") neg++;
    else if (r.sentiment === "controversial") ctrl++;
    else neu++;
    const total = pos + neu + neg + ctrl || 1;
    const momentum = Math.round(((pos + ctrl * 0.6 - neg) / total) * 50 + 50);
    out.push({ i, pos, neu, neg, ctrl, momentum });
  });
  return out;
}

export function liveMomentum(reactions: Reaction[], forecast: Forecast | null): number {
  if (forecast) return forecast.launch_score;
  const series = sentimentSeries(reactions);
  if (series.length === 0) return 0;
  return series[series.length - 1].momentum;
}

// -----------------------------------------------------------------------------
// Primary narrative (one-line emotional read of the room)
// -----------------------------------------------------------------------------

export function primaryNarrative(
  reactions: Reaction[],
  forecast: Forecast | null,
  product: ProductCard | null,
): string {
  if (forecast) {
    const hook = trimSentence(forecast.biggest_viral_hook);
    const weakness = trimSentence(forecast.biggest_weakness);
    return `People love ${lcFirst(hook)} but worry about ${lcFirst(weakness)}.`;
  }
  if (reactions.length === 0) {
    if (product) return `Listening for the first reactions to ${product.name}…`;
    return "Listening for the first reactions…";
  }

  const counts = countSentiment(reactions);
  const topPos = topFriction(reactions, "positive");
  const topNeg = topFriction(reactions, "negative");

  if (counts.positive > counts.negative + counts.controversial) {
    return `The room is leaning warm — ${topPos ?? "early signal looks clean"}.`;
  }
  if (counts.negative > counts.positive) {
    return `Skepticism arriving fast — ${topNeg ?? "a few hard takes landing first"}.`;
  }
  if (counts.controversial > 0) {
    return `The discourse is splitting — fans and skeptics arriving in the same breath.`;
  }
  return `The internet is forming an opinion in real time.`;
}

function countSentiment(reactions: Reaction[]) {
  const counts = { positive: 0, neutral: 0, negative: 0, controversial: 0 };
  for (const r of reactions) counts[r.sentiment]++;
  return counts;
}

function topFriction(reactions: Reaction[], sentiment: Reaction["sentiment"]): string | null {
  const matches = reactions.filter((r) => r.sentiment === sentiment && r.text);
  if (matches.length === 0) return null;
  const newest = matches[matches.length - 1];
  return trimSentence(newest.text!);
}

function trimSentence(s: string): string {
  const cleaned = s.trim().replace(/^[“"']+|[“"']+$/g, "");
  if (cleaned.length <= 90) return cleaned;
  return cleaned.slice(0, 87).trimEnd() + "…";
}

function lcFirst(s: string): string {
  return s.length === 0 ? s : s[0].toLowerCase() + s.slice(1);
}

// -----------------------------------------------------------------------------
// Narrative battlefield: opposing themes from product hooks vs friction
// -----------------------------------------------------------------------------

export type BattlefieldNode = {
  id: string;
  label: string;
  side: "for" | "against";
  weight: number; // 0..1 — how loud is this narrative right now
};

export type BattlefieldLink = { from: string; to: string; tension: number };

export function battlefield(
  product: ProductCard | null,
  reactions: Reaction[],
): { nodes: BattlefieldNode[]; links: BattlefieldLink[] } {
  const forSide = (product?.virality_hooks ?? []).slice(0, 4);
  const againstSide = dedupe([
    ...(product?.risk_factors ?? []),
    ...reactions.flatMap((r) => r.friction_points),
  ]).slice(0, 4);

  const totalReactions = reactions.length || 1;
  const nodes: BattlefieldNode[] = [];

  forSide.forEach((label, idx) => {
    const weight = 0.45 + idx * 0.05 + reactionsMentioning(label, reactions, "positive") / totalReactions;
    nodes.push({ id: `for-${idx}`, label, side: "for", weight: Math.min(1, weight) });
  });
  againstSide.forEach((label, idx) => {
    const weight = 0.4 + idx * 0.05 + reactionsMentioning(label, reactions, "negative") / totalReactions;
    nodes.push({ id: `against-${idx}`, label, side: "against", weight: Math.min(1, weight) });
  });

  const links: BattlefieldLink[] = [];
  for (const f of nodes.filter((n) => n.side === "for")) {
    for (const a of nodes.filter((n) => n.side === "against")) {
      links.push({ from: f.id, to: a.id, tension: (f.weight + a.weight) / 2 });
    }
  }
  return { nodes, links };
}

function reactionsMentioning(needle: string, reactions: Reaction[], sentiment: Reaction["sentiment"]): number {
  if (!needle) return 0;
  const n = needle.toLowerCase();
  return reactions.filter((r) =>
    r.sentiment === sentiment &&
    (r.text?.toLowerCase().includes(n) || r.friction_points.some((fp) => fp.toLowerCase().includes(n))),
  ).length;
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// -----------------------------------------------------------------------------
// Archetype sentiment matrix
// -----------------------------------------------------------------------------

export type ArchetypeRow = {
  archetype: string;
  platform: Persona["platform"];
  positive: number; neutral: number; negative: number; controversial: number;
  samples: number;
  avatar: string; // initials
};

export function archetypeSentiment(personas: Persona[], reactions: Reaction[]): ArchetypeRow[] {
  const personaById = new Map(personas.map((p) => [p.id, p]));
  const groups = new Map<string, ArchetypeRow>();

  // Seed every archetype so the matrix is full from frame 1.
  for (const p of personas) {
    if (!groups.has(p.archetype)) {
      groups.set(p.archetype, {
        archetype: p.archetype,
        platform: p.platform,
        positive: 0, neutral: 0, negative: 0, controversial: 0,
        samples: 0,
        avatar: initials(p.archetype),
      });
    }
  }

  for (const r of reactions) {
    const persona = personaById.get(r.persona_id);
    if (!persona) continue;
    const row = groups.get(persona.archetype);
    if (!row) continue;
    row[r.sentiment]++;
    row.samples++;
  }

  return Array.from(groups.values()).sort((a, b) => b.samples - a.samples);
}

function initials(s: string): string {
  return s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// -----------------------------------------------------------------------------
// Launch timeline playback (rounds → days)
// -----------------------------------------------------------------------------

export type TimelineDay = {
  day: number;
  headline: string;
  reactions: Reaction[];
  positiveCount: number; negativeCount: number; controversialCount: number;
};

const DAY_HEADLINE_TEMPLATES = [
  "Early signal — {audience} pick it up",
  "Reddit takes shape — {emotion}",
  "Twitter quote-thread phase — {emotion}",
  "Creators amplify — {emotion}",
  "Discourse stabilizes — {emotion}",
  "Long tail — {emotion}",
  "Counter-narratives surface — {emotion}",
  "Retention questions rise",
  "Founder defends positioning",
  "Settle into long-term sentiment",
];

export function timeline(reactions: Reaction[], product: ProductCard | null): TimelineDay[] {
  const byRound = new Map<number, Reaction[]>();
  for (const r of reactions) {
    if (!byRound.has(r.round)) byRound.set(r.round, []);
    byRound.get(r.round)!.push(r);
  }
  const rounds = Array.from(byRound.keys()).sort((a, b) => a - b);
  const audience = product?.target_audience?.[0] ?? "early adopters";

  return rounds.map((round, idx) => {
    const list = byRound.get(round)!;
    const pos = list.filter((r) => r.sentiment === "positive").length;
    const neg = list.filter((r) => r.sentiment === "negative").length;
    const ctrl = list.filter((r) => r.sentiment === "controversial").length;
    const emotion =
      pos > neg + ctrl ? "warm reception" :
      neg > pos ? "skeptical wave" :
      ctrl > 0 ? "split takes" :
      "neutral activity";
    const tmpl = DAY_HEADLINE_TEMPLATES[idx % DAY_HEADLINE_TEMPLATES.length];
    const headline = tmpl.replace("{audience}", audience).replace("{emotion}", emotion);
    return {
      day: round,
      headline,
      reactions: list,
      positiveCount: pos,
      negativeCount: neg,
      controversialCount: ctrl,
    };
  });
}

// -----------------------------------------------------------------------------
// Metric grid — fall back gracefully if forecast doesn't carry the extras
// -----------------------------------------------------------------------------

export type MetricCell = { key: string; label: string; value: number; tone: "good" | "warn" | "bad" | "neutral"; hint?: string };

export function metricGrid(
  forecast: Forecast | null,
  reactions: Reaction[],
  extras?: {
    retention_risk?: number; trust?: number; differentiation?: number;
    creator_shareability?: number; onboarding_clarity?: number;
    pricing_resistance?: number; investor_appeal?: number;
  },
): MetricCell[] {
  const counts = countSentiment(reactions);
  const total = reactions.length || 1;
  const pos = counts.positive / total;

  const v = (n: number | undefined, fallback: number) =>
    typeof n === "number" ? Math.round(n) : Math.round(fallback);

  return [
    {
      key: "virality",
      label: "Virality",
      value: forecast?.virality_potential ?? Math.round(pos * 100),
      tone: forecast && forecast.virality_potential >= 60 ? "good" : pos >= 0.5 ? "good" : "neutral",
      hint: "Predicted breakout reach",
    },
    {
      key: "trust",
      label: "Trust",
      value: v(extras?.trust, 50 + counts.positive * 4 - counts.negative * 6),
      tone: "neutral",
      hint: "Believability of claims",
    },
    {
      key: "differentiation",
      label: "Differentiation",
      value: v(extras?.differentiation, 50),
      tone: "neutral",
      hint: "Distance from the pack",
    },
    {
      key: "creator",
      label: "Creator shareability",
      value: v(extras?.creator_shareability, 40 + counts.positive * 5),
      tone: "good",
      hint: "Likelihood to be screen-recorded",
    },
    {
      key: "onboarding",
      label: "Onboarding clarity",
      value: v(extras?.onboarding_clarity, 65),
      tone: "neutral",
      hint: "First-30-second comprehension",
    },
    {
      key: "retention",
      label: "Retention risk",
      value: v(extras?.retention_risk, 30 + counts.controversial * 4),
      tone: "warn",
      hint: "Likelihood of week-2 churn",
    },
    {
      key: "pricing",
      label: "Pricing resistance",
      value: v(extras?.pricing_resistance, 25),
      tone: "neutral",
      hint: "Friction at the paywall",
    },
    {
      key: "investor",
      label: "Investor appeal",
      value: v(extras?.investor_appeal, 60),
      tone: "good",
      hint: "How VC Twitter reads the moat",
    },
  ];
}
