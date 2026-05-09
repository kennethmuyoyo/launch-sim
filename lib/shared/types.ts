/**
 * Cross-module integration contracts.
 *
 * These types are the seam between Ken's scrape module, John's agents/orchestrator,
 * and Juno's dashboard. Changes here need a heads-up to all three owners.
 */

import { z } from "zod";

// -----------------------------------------------------------------------------
// ProductCard — emitted by lib/scrape, consumed by lib/agents and the dashboard.
// -----------------------------------------------------------------------------

export const ProductCardSchema = z.object({
  url: z.string().url(),
  scraped_at: z.string(), // ISO timestamp

  name: z.string(),
  tagline: z.string().nullable(),
  category: z.string().nullable(), // e.g. "AI study app", "SaaS dashboard", "game"

  headline: z.string().nullable(),
  subheadline: z.string().nullable(),
  primary_cta: z.string().nullable(),

  key_features: z.array(z.string()).default([]),
  target_audience: z.array(z.string()).default([]),
  pricing: z.string().nullable(), // "freemium", "$X/mo", "free", etc.

  testimonials: z.array(z.string()).default([]),
  social_proof_strength: z.enum(["none", "weak", "medium", "strong"]).default("none"),

  visual_style: z.string().nullable(), // e.g. "Apple-inspired", "brutalist", "playful"
  tone: z.string().nullable(),         // e.g. "minimalist", "hype-bro", "earnest"
  vibes: z.array(z.string()).default([]),

  screenshots: z.array(z.string()).default([]), // base64 or URLs

  virality_hooks: z.array(z.string()).default([]),
  risk_factors: z.array(z.string()).default([]),
});

export type ProductCard = z.infer<typeof ProductCardSchema>;

// -----------------------------------------------------------------------------
// Persona — generated from a ProductCard, consumed by the reaction LLM.
// -----------------------------------------------------------------------------

export const PersonaSchema = z.object({
  id: z.string(),
  archetype: z.string(),       // e.g. "Reddit Indie Hacker", "TikTok Productivity Creator"
  display_name: z.string(),    // username-style handle
  platform: z.enum(["reddit", "twitter", "tiktok"]),
  personality: z.array(z.string()), // ["skeptical", "technical", "hates hype"]
  goals: z.array(z.string()),
  pet_peeves: z.array(z.string()),
  tech_savvy: z.number().min(0).max(1),
  patience: z.number().min(0).max(1),
  posting_style: z.string(),   // "lowercase, terse", "all caps when excited", "essay-poster"
  follower_weight: z.number().min(0).max(1), // social influence weight
});

export type Persona = z.infer<typeof PersonaSchema>;

// -----------------------------------------------------------------------------
// Reaction events — streamed live from orchestrator, rendered by Juno's UI.
// -----------------------------------------------------------------------------

export const ReactionSchema = z.object({
  id: z.string(),
  round: z.number(),
  persona_id: z.string(),
  platform: z.enum(["reddit", "twitter", "tiktok"]),
  action: z.enum(["upvote", "downvote", "skip", "comment", "share", "reply"]),
  text: z.string().nullable(),         // comment / tweet / reply body
  parent_id: z.string().nullable(),    // for replies — points to another reaction id
  sentiment: z.enum(["positive", "neutral", "negative", "controversial"]),
  friction_points: z.array(z.string()).default([]),
  created_at: z.string(),
});

export type Reaction = z.infer<typeof ReactionSchema>;

// -----------------------------------------------------------------------------
// Forecast — final aggregated output for Juno's dashboard.
// -----------------------------------------------------------------------------

export const ForecastSchema = z.object({
  run_id: z.string(),
  product: ProductCardSchema,

  launch_score: z.number().min(0).max(100),
  virality_potential: z.number().min(0).max(100),

  most_likely_audience: z.array(z.string()),
  biggest_viral_hook: z.string(),
  biggest_weakness: z.string(),

  reddit_reception: z.enum(["love", "mixed", "hate", "ignored"]),
  twitter_reception: z.enum(["love", "mixed", "hate", "ignored"]),
  tiktok_reception: z.enum(["love", "mixed", "hate", "ignored"]),

  sentiment_breakdown: z.object({
    positive: z.number(),
    neutral: z.number(),
    negative: z.number(),
    controversial: z.number(),
  }),

  top_comments: z.array(ReactionSchema), // verbatim, highest-engagement
  ux_friction: z.array(z.string()),       // clustered friction points
  predicted_hot_tweets: z.array(z.string()),

  narrative: z.string(), // free-form summary paragraph
});

export type Forecast = z.infer<typeof ForecastSchema>;

// -----------------------------------------------------------------------------
// Run lifecycle — what the dashboard polls/streams.
// -----------------------------------------------------------------------------

export type RunStatus =
  | "queued"
  | "scraping"
  | "generating_personas"
  | "simulating"
  | "aggregating"
  | "done"
  | "error";

export type RunEvent =
  | { type: "status"; status: RunStatus }
  | { type: "product_card"; product: ProductCard }
  | { type: "personas"; personas: Persona[] }
  | { type: "reaction"; reaction: Reaction }
  | { type: "forecast"; forecast: Forecast }
  | { type: "error"; message: string };
