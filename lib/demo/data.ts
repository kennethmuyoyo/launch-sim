/**
 * Demo dataset for the dashboard.
 *
 * The agents/scrape backends are still stubbed (they throw). To make the
 * frontend immediately demoable, we synthesize realistic RunEvents from
 * these scenarios. When the real backend lands, the dashboard consumes
 * the same RunEvent shape over SSE without changes.
 */

import type {
  Persona,
  ProductCard,
  Reaction,
} from "@/lib/shared/types";

export type DemoScenario = {
  key: string;
  url: string;
  product: Omit<ProductCard, "url" | "scraped_at">;
  personas: Omit<Persona, "id">[];
  /** Reactions are dripped out in order, one every ~250-600ms. */
  reactions: Array<
    Omit<Reaction, "id" | "persona_id" | "created_at"> & {
      /** Display name match against personas[].display_name to bind persona_id. */
      handle: string;
    }
  >;
  forecast: {
    launch_score: number;
    virality_potential: number;
    most_likely_audience: string[];
    biggest_viral_hook: string;
    biggest_weakness: string;
    reddit_reception: "love" | "mixed" | "hate" | "ignored";
    twitter_reception: "love" | "mixed" | "hate" | "ignored";
    tiktok_reception: "love" | "mixed" | "hate" | "ignored";
    sentiment_breakdown: { positive: number; neutral: number; negative: number; controversial: number };
    ux_friction: string[];
    predicted_hot_tweets: string[];
    narrative: string;
    /** Bonus presentational fields the dashboard surfaces. */
    metrics: {
      retention_risk: number; trust: number; differentiation: number;
      creator_shareability: number; onboarding_clarity: number;
      pricing_resistance: number; investor_appeal: number;
    };
    strengths: string[];
    weaknesses: string[];
  };
};

// -----------------------------------------------------------------------------
// Scenario A — clean winner ("DemoFlow", AI design tool)
// -----------------------------------------------------------------------------

const personasA: DemoScenario["personas"] = [
  { archetype: "Reddit Indie Hacker", display_name: "u/shipfast_or_die", platform: "reddit",
    personality: ["skeptical", "values moats"], goals: ["find tools that ship"],
    pet_peeves: ["GPT wrappers"], tech_savvy: 0.85, patience: 0.4,
    posting_style: "lowercase, terse", follower_weight: 0.55 },
  { archetype: "Skeptical Senior Dev", display_name: "u/null_pointer_dad", platform: "reddit",
    personality: ["cynical", "deeply technical"], goals: ["expose hand-waving"],
    pet_peeves: ["no docs"], tech_savvy: 0.95, patience: 0.3,
    posting_style: "paragraph-form", follower_weight: 0.7 },
  { archetype: "Reddit Indie Hacker", display_name: "u/saas_in_a_weekend", platform: "reddit",
    personality: ["pragmatic", "hates vapor"], goals: ["copy what works"],
    pet_peeves: ["fake testimonials"], tech_savvy: 0.7, patience: 0.5,
    posting_style: "lowercase", follower_weight: 0.4 },
  { archetype: "Design Twitter", display_name: "@kerning_warlord", platform: "twitter",
    personality: ["taste-driven", "petty"], goals: ["spot good craft"],
    pet_peeves: ["bad type"], tech_savvy: 0.6, patience: 0.6,
    posting_style: "single-line dunks", follower_weight: 0.78 },
  { archetype: "VC Twitter Guy", display_name: "@growth_arrows", platform: "twitter",
    personality: ["pattern-matcher"], goals: ["look early"],
    pet_peeves: ["small TAM"], tech_savvy: 0.5, patience: 0.5,
    posting_style: "→ arrows + thread bait", follower_weight: 0.85 },
  { archetype: "AI Twitter Researcher", display_name: "@latent_oracle", platform: "twitter",
    personality: ["nerdy", "literal"], goals: ["benchmark everything"],
    pet_peeves: ["vibe demos"], tech_savvy: 0.95, patience: 0.55,
    posting_style: "essay-thread", follower_weight: 0.72 },
  { archetype: "Hype-Bro Founder", display_name: "@zero_to_unicorn", platform: "twitter",
    personality: ["bullish on everything"], goals: ["build network"],
    pet_peeves: ["doomers"], tech_savvy: 0.4, patience: 0.7,
    posting_style: "🚀🚀🚀", follower_weight: 0.6 },
  { archetype: "TikTok Productivity Creator", display_name: "@notion_witch", platform: "tiktok",
    personality: ["performative", "warm"], goals: ["get views"],
    pet_peeves: ["boring UI"], tech_savvy: 0.5, patience: 0.7,
    posting_style: "POV: hooks", follower_weight: 0.8 },
  { archetype: "TikTok Builder Creator", display_name: "@ship_it_sara", platform: "tiktok",
    personality: ["enthusiastic"], goals: ["demo cool things"],
    pet_peeves: ["paywalls"], tech_savvy: 0.7, patience: 0.6,
    posting_style: "all-caps emphasis", follower_weight: 0.7 },
  { archetype: "Student Builder", display_name: "@cs_freshman", platform: "tiktok",
    personality: ["earnest", "broke"], goals: ["learn fast"],
    pet_peeves: ["paywall walls"], tech_savvy: 0.6, patience: 0.8,
    posting_style: "emoji-heavy", follower_weight: 0.3 },
];

const reactionsA: DemoScenario["reactions"] = [
  { handle: "@kerning_warlord", round: 1, platform: "twitter", action: "comment",
    text: "the onboarding video is criminally well-edited. who did the kerning here.",
    parent_id: null, sentiment: "positive", friction_points: [] },
  { handle: "u/shipfast_or_die", round: 1, platform: "reddit", action: "comment",
    text: "tbh this looks like another AI wrapper but the demo is undeniable",
    parent_id: null, sentiment: "controversial", friction_points: ["wrapper perception"] },
  { handle: "@notion_witch", round: 1, platform: "tiktok", action: "comment",
    text: "wait i actually want this 😭 the cursor demo got me",
    parent_id: null, sentiment: "positive", friction_points: [] },
  { handle: "@growth_arrows", round: 1, platform: "twitter", action: "comment",
    text: "→ AI design tools is a real wedge\n→ distribution is the question\n→ watching closely",
    parent_id: null, sentiment: "neutral", friction_points: [] },
  { handle: "u/null_pointer_dad", round: 1, platform: "reddit", action: "comment",
    text: "Looks slick but I've been burned by demo-driven launches before. Where's the changelog? What's the rate limit story? Show me the boring stuff.",
    parent_id: null, sentiment: "negative", friction_points: ["thin docs", "no changelog"] },
  { handle: "@cs_freshman", round: 2, platform: "tiktok", action: "comment",
    text: "free tier?? please say there's a free tier 🥲",
    parent_id: null, sentiment: "neutral", friction_points: ["pricing unclear"] },
  { handle: "@latent_oracle", round: 2, platform: "twitter", action: "comment",
    text: "the value prop here is actually the cursor — not the AI. that's the wedge they should be marketing.",
    parent_id: null, sentiment: "positive", friction_points: ["positioning underselling craft"] },
  { handle: "@ship_it_sara", round: 2, platform: "tiktok", action: "comment",
    text: "OKAY but how it generates the spec docs is INSANE",
    parent_id: null, sentiment: "positive", friction_points: [] },
  { handle: "u/saas_in_a_weekend", round: 2, platform: "reddit", action: "comment",
    text: "if this lets me skip the 4 hours of figma busywork i do every monday i'm in",
    parent_id: null, sentiment: "positive", friction_points: [] },
  { handle: "@zero_to_unicorn", round: 2, platform: "twitter", action: "comment",
    text: "BREAKING: the design tooling layer is finally getting unbundled. this is HUGE 🚀",
    parent_id: null, sentiment: "positive", friction_points: [] },
  { handle: "u/null_pointer_dad", round: 3, platform: "reddit", action: "comment",
    text: "Re: the wrapper take — I changed my mind a bit after watching the diff view. The collab piece is non-trivial and not GPT-4-shaped.",
    parent_id: null, sentiment: "positive", friction_points: [] },
  { handle: "@kerning_warlord", round: 3, platform: "twitter", action: "comment",
    text: "okay one nit: the pricing page H1 has a phantom 1px. fix it. otherwise A+",
    parent_id: null, sentiment: "neutral", friction_points: ["pricing page typo"] },
  { handle: "@notion_witch", round: 3, platform: "tiktok", action: "comment",
    text: "POV: you finally found the design tool that doesn't make you cry",
    parent_id: null, sentiment: "positive", friction_points: [] },
  { handle: "u/shipfast_or_die", round: 3, platform: "reddit", action: "comment",
    text: "my concern: what's the moat in 6 months when figma ships their version of this. anyone else thinking about that.",
    parent_id: null, sentiment: "controversial", friction_points: ["defensibility vs Figma"] },
  { handle: "@latent_oracle", round: 3, platform: "twitter", action: "comment",
    text: "actually their model isn't fine-tuned on stock UIs — it's trained on the user's own component library at runtime. that's the real moat.",
    parent_id: null, sentiment: "positive", friction_points: [] },
  { handle: "@ship_it_sara", round: 4, platform: "tiktok", action: "comment",
    text: "trying this for tonight's video — if it works i'm canceling figma",
    parent_id: null, sentiment: "positive", friction_points: [] },
  { handle: "@growth_arrows", round: 4, platform: "twitter", action: "comment",
    text: "PMF signal: 3 different design twitter accounts dunking on competitors WITHIN 2 hours of launch",
    parent_id: null, sentiment: "positive", friction_points: [] },
  { handle: "u/saas_in_a_weekend", round: 4, platform: "reddit", action: "comment",
    text: "ok so the retention question is fair. but honestly even as a one-shot tool this is worth $20",
    parent_id: null, sentiment: "positive", friction_points: ["retention question"] },
  { handle: "@cs_freshman", round: 4, platform: "tiktok", action: "comment",
    text: "students get free??? im literally crying",
    parent_id: null, sentiment: "positive", friction_points: [] },
  { handle: "@zero_to_unicorn", round: 5, platform: "twitter", action: "comment",
    text: "calling it now: 100k weekly active in 3 months",
    parent_id: null, sentiment: "controversial", friction_points: [] },
  { handle: "u/null_pointer_dad", round: 5, platform: "reddit", action: "comment",
    text: "Final verdict: surprisingly substantive. Marketing site oversells, product undersells. Ship the diff view to the homepage.",
    parent_id: null, sentiment: "positive", friction_points: ["homepage doesn't show diff view"] },
  { handle: "@notion_witch", round: 5, platform: "tiktok", action: "comment",
    text: "scripting a video on this rn — it deserves the algorithm",
    parent_id: null, sentiment: "positive", friction_points: [] },
];

export const SCENARIOS: DemoScenario[] = [
  {
    key: "clean-winner",
    url: "https://demoflow.app",
    product: {
      name: "DemoFlow",
      tagline: "Design at the speed of thought.",
      category: "AI design tool",
      headline: "Generate, edit, and ship UI without leaving your codebase.",
      subheadline: "Your component library, with a brain.",
      primary_cta: "Start free",
      key_features: ["AI-generated components", "Live diff view", "Cursor-native"],
      target_audience: ["Indie hackers", "Frontend devs", "Design-eng hybrids"],
      pricing: "Free tier · Pro $20/mo",
      testimonials: [],
      social_proof_strength: "medium",
      visual_style: "Apple-inspired, generous whitespace",
      tone: "earnest, founder-mode",
      vibes: ["calm", "premium", "demo-able"],
      screenshots: [],
      virality_hooks: [
        "Cursor-native demo",
        "AI generates from your real component library",
        "Live diff view between AI suggestion and current code",
      ],
      risk_factors: [
        "Perceived as another AI wrapper",
        "Figma will likely ship a competing feature",
      ],
    },
    personas: personasA,
    reactions: reactionsA,
    forecast: {
      launch_score: 82,
      virality_potential: 74,
      most_likely_audience: ["Frontend devs", "Design-engineering hybrids", "Indie founders"],
      biggest_viral_hook: "The cursor-native demo — devs share it within 60 seconds.",
      biggest_weakness: "Defensibility against Figma ships in 6 months.",
      reddit_reception: "mixed",
      twitter_reception: "love",
      tiktok_reception: "love",
      sentiment_breakdown: { positive: 0.62, neutral: 0.18, negative: 0.10, controversial: 0.10 },
      ux_friction: [
        "Pricing page H1 has a 1px alignment bug",
        "Homepage doesn't show the diff view (the actual viral moment)",
        "Free tier limits unclear above the fold",
      ],
      predicted_hot_tweets: [
        "the cursor-native demo is the kind of thing that makes you cancel figma at 1am",
        "their model isn't trained on stock UIs — it adapts to your component library at runtime. that's the moat.",
        "design eng is being unbundled in real time",
      ],
      narrative:
        "Internet read: people love the craft, suspect the moat. Design Twitter is doing the marketing for free. The skeptics flip after they see the diff view — bury it on the homepage and you'll lose 30% of the conversion.",
      metrics: {
        retention_risk: 38, trust: 71, differentiation: 64, creator_shareability: 88,
        onboarding_clarity: 81, pricing_resistance: 26, investor_appeal: 77,
      },
      strengths: [
        "Visually undeniable — instantly screenshot-worthy",
        "Cursor-native angle differentiates inside the dev mindshare",
        "Diff view is the unfair viral hook",
        "Onboarding video earns credibility from design Twitter",
      ],
      weaknesses: [
        "Reads as 'AI wrapper' on first glance",
        "Defensibility unclear once Figma ships parity",
        "Free tier limits hidden — students bounce",
      ],
    },
  },
];

export function pickScenario(url: string): DemoScenario {
  // Stable hash → scenario index. Keeps the same URL deterministic.
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % SCENARIOS.length;
  const base = SCENARIOS[idx];
  // Re-bind URL so screenshots show what the user pasted.
  return { ...base, url };
}
