/**
 * Final aggregation: raw reactions -> Forecast.
 *
 * Strategy:
 *   1. Count sentiment + per-platform reception deterministically from raw reactions.
 *   2. Pick top comments per platform deterministically (engagement score).
 *   3. Single LLM call to generate the soft analytical fields (launch_score,
 *      virality_potential, biggest_viral_hook, biggest_weakness, most_likely_audience,
 *      predicted_hot_tweets, ux_friction clustering, narrative summary).
 *   4. Merge deterministic + LLM fields and validate against ForecastSchema.
 *   5. If the LLM call fails or returns malformed output, fall back to a fully
 *      deterministic Forecast so the run never dies at the last step.
 */

import { z } from "zod";
import {
  ForecastSchema,
  type Forecast,
  type ProductCard,
  type Reaction,
} from "@/lib/shared/types";
import { chatJSON, type ChatMessage } from "@/lib/llm/openrouter";

type Platform = Reaction["platform"];
type Reception = Forecast["reddit_reception"];

const PLATFORMS: Platform[] = ["reddit", "twitter", "tiktok"];

// --- Public API ----------------------------------------------------------------

export type AggregateForecastOptions = {
  model?: string;
  topCommentsPerPlatform?: number;
};

export async function aggregateForecast(
  runId: string,
  product: ProductCard,
  reactions: Reaction[],
  opts: AggregateForecastOptions = {},
): Promise<Forecast> {
  const sentiment_breakdown = countSentiments(reactions);
  const perPlatform = countByPlatform(reactions);

  const reddit_reception = receptionFromCounts(perPlatform.reddit);
  const twitter_reception = receptionFromCounts(perPlatform.twitter);
  const tiktok_reception = receptionFromCounts(perPlatform.tiktok);

  const top_comments = pickTopComments(reactions, opts.topCommentsPerPlatform ?? 3);
  const ux_friction = clusterFriction(reactions);

  // Try the soft/narrative LLM call. If it fails for any reason we fall back to a
  // deterministic forecast — the run must always end with a valid Forecast.
  let llm: NarrativeFields | null = null;
  try {
    llm = await generateNarrative(product, reactions, {
      sentiment_breakdown,
      reddit_reception,
      twitter_reception,
      tiktok_reception,
      top_comments,
      ux_friction,
      model: opts.model,
    });
  } catch {
    llm = null;
  }

  const fallback = deterministicNarrative(product, reactions, sentiment_breakdown, {
    reddit_reception,
    twitter_reception,
    tiktok_reception,
  });

  const merged = {
    run_id: runId,
    product,
    launch_score: clamp0to100(llm?.launch_score ?? fallback.launch_score),
    virality_potential: clamp0to100(llm?.virality_potential ?? fallback.virality_potential),
    most_likely_audience:
      (llm?.most_likely_audience && llm.most_likely_audience.length > 0
        ? llm.most_likely_audience
        : fallback.most_likely_audience),
    biggest_viral_hook: llm?.biggest_viral_hook?.trim() || fallback.biggest_viral_hook,
    biggest_weakness: llm?.biggest_weakness?.trim() || fallback.biggest_weakness,
    reddit_reception,
    twitter_reception,
    tiktok_reception,
    sentiment_breakdown,
    top_comments,
    ux_friction:
      (llm?.ux_friction && llm.ux_friction.length > 0 ? llm.ux_friction : ux_friction),
    predicted_hot_tweets:
      (llm?.predicted_hot_tweets && llm.predicted_hot_tweets.length > 0
        ? llm.predicted_hot_tweets
        : fallback.predicted_hot_tweets),
    narrative: llm?.narrative?.trim() || fallback.narrative,
  };

  const parsed = ForecastSchema.safeParse(merged);
  if (parsed.success) return parsed.data;

  // If even the merged object fails validation, fall back fully and force a parse.
  return ForecastSchema.parse({
    run_id: runId,
    product,
    launch_score: fallback.launch_score,
    virality_potential: fallback.virality_potential,
    most_likely_audience: fallback.most_likely_audience,
    biggest_viral_hook: fallback.biggest_viral_hook,
    biggest_weakness: fallback.biggest_weakness,
    reddit_reception,
    twitter_reception,
    tiktok_reception,
    sentiment_breakdown,
    top_comments,
    ux_friction,
    predicted_hot_tweets: fallback.predicted_hot_tweets,
    narrative: fallback.narrative,
  });
}

// --- Deterministic counters ----------------------------------------------------

function countSentiments(reactions: Reaction[]): Forecast["sentiment_breakdown"] {
  const out = { positive: 0, neutral: 0, negative: 0, controversial: 0 };
  for (const r of reactions) {
    if (r.action === "skip" && !r.text) continue;
    out[r.sentiment] += 1;
  }
  return out;
}

function countByPlatform(reactions: Reaction[]): Record<Platform, Forecast["sentiment_breakdown"]> {
  const out: Record<Platform, Forecast["sentiment_breakdown"]> = {
    reddit: { positive: 0, neutral: 0, negative: 0, controversial: 0 },
    twitter: { positive: 0, neutral: 0, negative: 0, controversial: 0 },
    tiktok: { positive: 0, neutral: 0, negative: 0, controversial: 0 },
  };
  for (const r of reactions) {
    if (r.action === "skip" && !r.text) continue;
    out[r.platform][r.sentiment] += 1;
  }
  return out;
}

function receptionFromCounts(c: Forecast["sentiment_breakdown"]): Reception {
  const total = c.positive + c.neutral + c.negative + c.controversial;
  if (total < 3) return "ignored";

  const pos = c.positive / total;
  const neg = c.negative / total;
  const ctl = c.controversial / total;

  if (ctl >= 0.25) return "mixed";
  if (pos - neg >= 0.25 && pos >= 0.4) return "love";
  if (neg - pos >= 0.25 && neg >= 0.4) return "hate";
  if (pos < 0.15 && neg < 0.15) return "ignored";
  return "mixed";
}

function pickTopComments(reactions: Reaction[], perPlatform: number): Reaction[] {
  const score = (r: Reaction) => {
    let s = 0;
    if (!r.text) return -1;
    if (r.sentiment === "controversial") s += 4;
    if (r.sentiment === "negative") s += 2.5;
    if (r.sentiment === "positive") s += 2;
    if (r.action === "share") s += 2;
    if (r.action === "reply") s += 1.5;
    if (r.action === "comment") s += 1;
    if (r.text) s += Math.min(2.5, r.text.length / 100);
    if (r.friction_points.length) s += Math.min(1.5, r.friction_points.length * 0.5);
    s += r.round * 0.25;
    return s;
  };

  const out: Reaction[] = [];
  for (const platform of PLATFORMS) {
    const top = reactions
      .filter((r) => r.platform === platform && r.text)
      .sort((a, b) => score(b) - score(a))
      .slice(0, perPlatform);
    out.push(...top);
  }
  return out;
}

function clusterFriction(reactions: Reaction[]): string[] {
  const counts = new Map<string, number>();
  for (const r of reactions) {
    for (const fp of r.friction_points) {
      const key = fp.trim().toLowerCase();
      if (!key) continue;
      // Skip the synthetic agent_error tags emitted by the orchestrator on failure.
      if (key.startsWith("agent_error:")) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k]) => k);
}

// --- Narrative LLM call --------------------------------------------------------

type NarrativeFields = {
  launch_score?: number;
  virality_potential?: number;
  most_likely_audience?: string[];
  biggest_viral_hook?: string;
  biggest_weakness?: string;
  predicted_hot_tweets?: string[];
  ux_friction?: string[];
  narrative?: string;
};

const NarrativeSchema = z.object({
  launch_score: z.number().min(0).max(100).optional(),
  virality_potential: z.number().min(0).max(100).optional(),
  most_likely_audience: z.array(z.string()).optional(),
  biggest_viral_hook: z.string().optional(),
  biggest_weakness: z.string().optional(),
  predicted_hot_tweets: z.array(z.string()).optional(),
  ux_friction: z.array(z.string()).optional(),
  narrative: z.string().optional(),
});

const NARRATIVE_SYSTEM = `You are an internet-launch analyst. Given a ProductCard plus the simulated discourse it generated (raw counts + top comments), return ONE JSON object summarizing the launch.

Required JSON shape:
{
  "launch_score": number,                 // 0..100, holistic "would this land?"
  "virality_potential": number,           // 0..100
  "most_likely_audience": string[],       // 1-3 short audience segments
  "biggest_viral_hook": string,           // single sentence
  "biggest_weakness": string,             // single sentence — be honest
  "predicted_hot_tweets": string[],       // 3-5 short tweet-style lines that would actually rip on this launch
  "ux_friction": string[],                // 3-6 clustered, deduped friction points (improve on the raw list you're given)
  "narrative": string                      // 4-7 sentence editorial summary of how the launch would actually play out
}

Rules:
- Be specific to THIS product. No generic advice.
- Use the actual sentiment counts and reception levels — don't contradict them. (If reddit_reception is "hate", launch_score should not be 90.)
- "predicted_hot_tweets" should sound like real Twitter — short, punchy, sometimes critical.
- Keep the narrative tight and editorial, not bullet-pointed.
- Output JSON only. No prose. No code fences.`;

async function generateNarrative(
  product: ProductCard,
  reactions: Reaction[],
  ctx: {
    sentiment_breakdown: Forecast["sentiment_breakdown"];
    reddit_reception: Reception;
    twitter_reception: Reception;
    tiktok_reception: Reception;
    top_comments: Reaction[];
    ux_friction: string[];
    model?: string;
  },
): Promise<NarrativeFields> {
  const productSummary = JSON.stringify(
    {
      name: product.name,
      tagline: product.tagline,
      category: product.category,
      headline: product.headline,
      subheadline: product.subheadline,
      key_features: product.key_features,
      target_audience: product.target_audience,
      pricing: product.pricing,
      tone: product.tone,
      visual_style: product.visual_style,
      vibes: product.vibes,
      virality_hooks: product.virality_hooks,
      risk_factors: product.risk_factors,
    },
    null,
    2,
  );

  const topCommentsBlock = ctx.top_comments
    .map(
      (r) =>
        `- [${r.platform}] (${r.sentiment}, ${r.action}) "${(r.text ?? "").slice(0, 240).replace(/\n/g, " ")}"`,
    )
    .join("\n");

  // Trim a sample of additional reactions so the LLM has texture without blowing up tokens.
  const sample = reactions
    .filter((r) => r.text)
    .slice(0, 24)
    .map((r) => `- [${r.platform}|${r.sentiment}] ${(r.text ?? "").slice(0, 160).replace(/\n/g, " ")}`)
    .join("\n");

  const userText = [
    `PRODUCT:\n${productSummary}`,
    "",
    `OVERALL SENTIMENT COUNTS: ${JSON.stringify(ctx.sentiment_breakdown)}`,
    `RECEPTION: reddit=${ctx.reddit_reception}, twitter=${ctx.twitter_reception}, tiktok=${ctx.tiktok_reception}`,
    "",
    `TOP COMMENTS PER PLATFORM:\n${topCommentsBlock || "(none)"}`,
    "",
    `RAW SAMPLE OF REACTIONS:\n${sample || "(none)"}`,
    "",
    `RAW UX FRICTION TAGS (cluster/clean these):\n${ctx.ux_friction.join(", ") || "(none)"}`,
    "",
    `TOTAL REACTIONS: ${reactions.length}`,
    "",
    "Now produce the JSON forecast summary.",
  ].join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: NARRATIVE_SYSTEM },
    { role: "user", content: userText },
  ];

  const raw = await chatJSON<unknown>(messages, {
    model: ctx.model,
    temperature: 0.7,
    max_tokens: 900,
  });

  const parsed = NarrativeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `aggregateForecast: narrative validation failed: ${parsed.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

// --- Deterministic fallback narrative -----------------------------------------

function deterministicNarrative(
  product: ProductCard,
  reactions: Reaction[],
  sentiment: Forecast["sentiment_breakdown"],
  perPlatform: { reddit_reception: Reception; twitter_reception: Reception; tiktok_reception: Reception },
): Required<Pick<NarrativeFields,
  "launch_score" | "virality_potential" | "most_likely_audience" |
  "biggest_viral_hook" | "biggest_weakness" | "predicted_hot_tweets" | "narrative"
>> {
  const total = sentiment.positive + sentiment.neutral + sentiment.negative + sentiment.controversial;
  const positiveShare = total > 0 ? sentiment.positive / total : 0;
  const negativeShare = total > 0 ? sentiment.negative / total : 0;
  const controversialShare = total > 0 ? sentiment.controversial / total : 0;

  const launch_score = Math.round(
    clamp0to100(40 + positiveShare * 50 - negativeShare * 35 + controversialShare * 5),
  );
  const virality_potential = Math.round(
    clamp0to100(35 + controversialShare * 60 + positiveShare * 25 + negativeShare * 20),
  );

  const audience = product.target_audience.length
    ? product.target_audience.slice(0, 3)
    : ["early adopters curious about this category"];

  const hook =
    product.virality_hooks[0] ??
    (positiveShare > 0.4
      ? `${product.name} clicks emotionally with its core audience.`
      : `${product.name} has a polarizing angle the internet wants to argue about.`);

  const weakness =
    product.risk_factors.find((r) => !r.startsWith("scraper_blocked")) ??
    (negativeShare > 0.3
      ? "Skeptics are calling out vague positioning — clarity will determine whether momentum holds."
      : "Generic-feeling positioning makes it easy to scroll past.");

  // Synthesize a few short "hot tweets" from the strongest reactions.
  const predicted_hot_tweets = reactions
    .filter((r) => r.text && (r.sentiment === "controversial" || r.sentiment === "negative" || r.sentiment === "positive"))
    .sort((a, b) => (b.text?.length ?? 0) - (a.text?.length ?? 0))
    .slice(0, 4)
    .map((r) => (r.text ?? "").slice(0, 240));

  if (predicted_hot_tweets.length === 0) {
    predicted_hot_tweets.push(
      `tried ${product.name}. unclear who this is for tbh.`,
      `actually impressed by ${product.name} — this is a real wedge.`,
    );
  }

  const receptionLine = `reddit ${perPlatform.reddit_reception}, twitter ${perPlatform.twitter_reception}, tiktok ${perPlatform.tiktok_reception}`;
  const narrative = [
    `${product.name} would land as ${perPlatform.twitter_reception === "love" ? "a clear winner on" : "a moderate signal across"} ${receptionLine}.`,
    `Across ${total} simulated reactions, sentiment skewed ${positiveShare >= negativeShare ? "positive" : "negative"} (${Math.round(positiveShare * 100)}% positive, ${Math.round(negativeShare * 100)}% negative, ${Math.round(controversialShare * 100)}% controversial).`,
    `The strongest pull is ${hook.toLowerCase().startsWith("the ") ? hook : "the angle around " + hook.toLowerCase()}, while the loudest pushback centers on ${weakness.toLowerCase()}.`,
    `Expect a ${controversialShare > 0.2 ? "spiky, debate-driven" : "steady, niche-first"} reception — virality potential reads as ${virality_potential}/100.`,
  ].join(" ");

  return {
    launch_score,
    virality_potential,
    most_likely_audience: audience,
    biggest_viral_hook: hook,
    biggest_weakness: weakness,
    predicted_hot_tweets,
    narrative,
  };
}

// --- Helpers -------------------------------------------------------------------

function clamp0to100(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(100, x));
}
