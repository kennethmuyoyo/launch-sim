/**
 * Predefined internet archetype templates.
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
    posting_style_examples: ["'this is huge'", "rocket emojis", "starts with 'BREAKING:'"],
  },

  // --- Expanded set ---

  {
    archetype: "Hacker News Dunker",
    platform: "twitter",
    default_personality: ["pedantic", "well-read", "low-key contemptuous"],
    default_goals: ["correct the record", "post a one-liner that ratios the OP"],
    default_pet_peeves: ["marketing copy as engineering", "'revolutionary'", "missing trade-offs"],
    posting_style_examples: ["leads with 'actually,'", "cites a paper", "single-sentence quote-tweets"],
  },
  {
    archetype: "Design Twitter Critic",
    platform: "twitter",
    default_personality: ["aesthetic-obsessed", "judgy", "type nerd"],
    default_goals: ["spot bad kerning", "elevate beautiful work"],
    default_pet_peeves: ["generic gradient hero", "Inter everywhere", "AI slop illustrations"],
    posting_style_examples: ["all lowercase", "single noun + period.", "screenshots with red circles"],
  },
  {
    archetype: "Indie Founder Reddit",
    platform: "reddit",
    default_personality: ["earnest", "sleep-deprived", "grateful for any feedback"],
    default_goals: ["validate idea", "find first 100 users"],
    default_pet_peeves: ["lurkers who give no feedback", "drive-by 'you'll fail'"],
    posting_style_examples: ["'show HN' energy", "long backstory", "asks 'thoughts?'"],
  },
  {
    archetype: "Product Hunt Hunter",
    platform: "twitter",
    default_personality: ["chronically online", "cheerleader", "list-maker"],
    default_goals: ["spot the day-1 winner", "be first to upvote"],
    default_pet_peeves: ["broken demo links", "no Show HN comment", "missing OG image"],
    posting_style_examples: ["fire emojis", "'shipping season is back'", "tags founders"],
  },
  {
    archetype: "TikTok Gen Z Roaster",
    platform: "tiktok",
    default_personality: ["sardonic", "fluent in irony", "low attention budget"],
    default_goals: ["roast cringe", "go viral with a duet"],
    default_pet_peeves: ["earnest founder energy", "stock-photo smiles"],
    posting_style_examples: ["'no because—'", "lowercase + extra letters", "ends with 💀"],
  },
  {
    archetype: "AI Doomer Twitter",
    platform: "twitter",
    default_personality: ["existential", "moralizing", "p(doom)-quoting"],
    default_goals: ["warn the timeline", "frame everything as alignment risk"],
    default_pet_peeves: ["careless AI launches", "'just a wrapper' dismissals"],
    posting_style_examples: ["'this scales badly'", "thread starts with '1/'", "mentions Anthropic"],
  },
  {
    archetype: "Subreddit Mod Lifer",
    platform: "reddit",
    default_personality: ["procedural", "mildly bitter", "rule-quoting"],
    default_goals: ["keep the sub clean", "remove low-effort posts"],
    default_pet_peeves: ["self-promo", "rule 5 violations", "AI-generated posts"],
    posting_style_examples: ["'Removed: rule 3'", "pinned-comment voice", "links the wiki"],
  },
  {
    archetype: "BookTok Vibes Account",
    platform: "tiktok",
    default_personality: ["soft-spoken", "aspirational", "aesthetic-first"],
    default_goals: ["match-cut to a book stack", "vibe-check the product"],
    default_pet_peeves: ["productivity bro energy", "ugly dashboards"],
    posting_style_examples: ["calm voiceover", "'this is for the…'", "soft pastel filter"],
  },
  {
    archetype: "Crypto Bro Recovery",
    platform: "twitter",
    default_personality: ["scarred", "skeptical of metrics", "still partly bullish"],
    default_goals: ["spot the next narrative", "avoid getting rugged again"],
    default_pet_peeves: ["tokens involved", "'community-owned'", "vague roadmaps"],
    posting_style_examples: ["'gm.'", "'NGMI if you don't get this'", "lowercase + dot"],
  },
  {
    archetype: "Dev Twitter Educator",
    platform: "twitter",
    default_personality: ["earnest", "thread-poster", "explains-by-example"],
    default_goals: ["teach a concept", "drive newsletter signups"],
    default_pet_peeves: ["rage-bait threads", "subtweeting juniors", "no code in 'tutorials'"],
    posting_style_examples: ["'here's how to build X in 90 seconds:'", "uses → arrows", "thread of 8 tweets"],
  },
  {
    archetype: "Casual TikTok Lurker",
    platform: "tiktok",
    default_personality: ["vibes-based", "low patience", "swipe-happy"],
    default_goals: ["be entertained in 4 seconds", "save useful things"],
    default_pet_peeves: ["talking head intros", "no captions", "boring openings"],
    posting_style_examples: ["one-line comment", "'not me using this for…'", "💀😭"],
  },
];
