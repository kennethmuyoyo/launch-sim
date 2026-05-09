/**
 * Persona generator.
 *
 * Single batched LLM call: ProductCard + ARCHETYPES -> N concrete personas
 * stratified across reddit/twitter/tiktok and across archetypes.
 */

import { z } from "zod";
import { PersonaSchema, type Persona, type ProductCard } from "@/lib/shared/types";
import { chatJSON, type ChatMessage } from "@/lib/llm/openrouter";
import { ARCHETYPES } from "./archetypes";

const SYSTEM_PROMPT = `You are a casting director generating internet personas who will react to a product launch.

You will receive:
  1. A ProductCard describing a real landing page.
  2. A list of internet archetypes (Reddit indie hacker, TikTok productivity creator, etc.).
  3. A target persona count and a per-platform target distribution.

Return ONE JSON object with shape: { "personas": Persona[] }

Each Persona MUST follow this shape exactly:
{
  "id": string,                                       // unique within batch, e.g. "p_03"
  "archetype": string,                                // one of the provided archetypes (use the exact archetype name)
  "display_name": string,                             // platform-appropriate handle, e.g. "u/cynical_dev42", "@kerning_wars", "@studystreaks"
  "platform": "reddit" | "twitter" | "tiktok",       // must match the archetype
  "personality": string[],                            // 3-5 traits, mix of archetype defaults + product-specific tweaks
  "goals": string[],                                  // 1-3 concrete goals
  "pet_peeves": string[],                             // 2-4 specific peeves (lean on the ProductCard — what would they hate or love about THIS product?)
  "tech_savvy": number,                               // 0..1
  "patience": number,                                 // 0..1
  "posting_style": string,                            // one short phrase, e.g. "lowercase + shrug", "all-caps when excited", "thread of 6 tweets"
  "follower_weight": number                           // 0..1, social influence
}

Rules:
- Stay within the target counts per platform.
- Don't invent archetype names — pick from the provided list.
- Make personalities and pet_peeves feel SPECIFIC to the product, not generic.
- Vary posting_style heavily — the simulated feed must NOT sound uniform.
- Mix sentiment: some likely fans, some likely critics, some indifferent.
- Output JSON only — no prose, no code fences.`;

const PersonasResponseSchema = z.object({
  personas: z.array(PersonaSchema),
});

type PlatformDistribution = {
  reddit: number;
  twitter: number;
  tiktok: number;
};

function defaultDistribution(count: number): PlatformDistribution {
  // Slight Twitter weight because most discourse happens there.
  const twitter = Math.round(count * 0.4);
  const reddit = Math.round(count * 0.35);
  const tiktok = Math.max(1, count - twitter - reddit);
  return { twitter, reddit, tiktok };
}

export type GeneratePersonasOptions = {
  model?: string;
  distribution?: PlatformDistribution;
};

export async function generatePersonas(
  product: ProductCard,
  count = 30,
  opts: GeneratePersonasOptions = {},
): Promise<Persona[]> {
  const dist = opts.distribution ?? defaultDistribution(count);

  const archetypeBlock = ARCHETYPES.map(
    (a) =>
      `- ${a.archetype} [${a.platform}] | personality: ${a.default_personality.join(", ")} | goals: ${a.default_goals.join(", ")} | peeves: ${a.default_pet_peeves.join(", ")} | style examples: ${a.posting_style_examples.join(" / ")}`,
  ).join("\n");

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

  const userText = [
    `PRODUCT CARD:\n${productSummary}`,
    "",
    `AVAILABLE ARCHETYPES:\n${archetypeBlock}`,
    "",
    `TARGET COUNT: ${count}`,
    `TARGET DISTRIBUTION: reddit=${dist.reddit}, twitter=${dist.twitter}, tiktok=${dist.tiktok}`,
    "",
    "Generate the personas now. Return JSON: { \"personas\": Persona[] }.",
  ].join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userText },
  ];

  const raw = await chatJSON<unknown>(messages, {
    model: opts.model,
    temperature: 0.95,
    max_tokens: Math.min(4000, 220 * count),
  });

  // Be permissive: some models return { personas: [...] }, others a bare array.
  const normalized = Array.isArray(raw) ? { personas: raw } : raw;
  const parsed = PersonasResponseSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new Error(
      `generatePersonas: schema validation failed: ${parsed.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }

  // Ensure unique ids (LLMs sometimes repeat).
  const seen = new Set<string>();
  const personas = parsed.data.personas.map((p, i) => {
    let id = p.id || `p_${String(i + 1).padStart(2, "0")}`;
    if (seen.has(id)) id = `${id}_${i}`;
    seen.add(id);
    return { ...p, id };
  });

  return personas;
}
