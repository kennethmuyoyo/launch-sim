/**
 * Predefined internet archetype templates. Owner: John.
 *
 * The persona generator picks from these, weighted by how well they fit the ProductCard's
 * audience/category, and fills in concrete details (handle, exact pet peeves, posting quirks).
 */

export type ArchetypeTemplate = {
  archetype: string;
  platform: "reddit" | "twitter" | "tiktok";
  default_personality: string[];
  default_goals: string[];
  default_pet_peeves: string[];
  posting_style_examples: string[];
};

export const ARCHETYPES: ArchetypeTemplate[] = [
  // TODO(john): flesh these out. Starter set below — feel free to add/edit.
  {
    archetype: "Reddit Indie Hacker",
    platform: "reddit",
    default_personality: ["skeptical", "technical", "hates hype", "values moats"],
    default_goals: ["find tools that actually ship", "avoid VC bait"],
    default_pet_peeves: ["GPT wrappers", "vague pricing", "AI buzzwords"],
    posting_style_examples: ["lowercase, terse", "starts with 'tbh'", "ends with shrug"],
  },
  {
    archetype: "TikTok Productivity Creator",
    platform: "tiktok",
    default_personality: ["trend-seeking", "performative", "optimistic"],
    default_goals: ["get views", "find demo-able tools"],
    default_pet_peeves: ["boring UI", "long onboarding"],
    posting_style_examples: ["all-caps for emphasis", "emoji-heavy", "hooks like 'POV:'"],
  },
  {
    archetype: "VC Twitter Guy",
    platform: "twitter",
    default_personality: ["growth-obsessed", "name-drops", "pattern-matches"],
    default_goals: ["sound smart in public", "find the next breakout"],
    default_pet_peeves: ["small TAM", "no distribution story"],
    posting_style_examples: ["thread-bait openers", "'unlocking $X market'", "uses → arrows"],
  },
  {
    archetype: "Skeptical Senior Dev",
    platform: "reddit",
    default_personality: ["cynical", "deeply technical", "low patience"],
    default_goals: ["protect juniors from bad tools", "expose hand-waving"],
    default_pet_peeves: ["no docs", "'AI-powered' anything", "unclear deps"],
    posting_style_examples: ["paragraph-form", "code blocks", "ends with 'just my 2 cents'"],
  },
  {
    archetype: "Hype-Bro Founder",
    platform: "twitter",
    default_personality: ["bullish on everything", "performatively excited"],
    default_goals: ["build network", "look early"],
    default_pet_peeves: ["doomers", "haters"],
    posting_style_examples: ["'this is huge'", "🚀🚀🚀", "starts with 'BREAKING:'"],
  },
];
