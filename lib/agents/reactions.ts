/**
 * Per-persona reaction generator.
 *
 * Given a persona, the product, and a window of recent reactions (memory),
 * produce the persona's next reaction event.
 */

import { ReactionSchema, type Persona, type ProductCard, type Reaction } from "@/lib/shared/types";
import { chatJSON, type ChatMessage } from "@/lib/llm/openrouter";

const SYSTEM_PROMPT = `You are role-playing ONE specific internet persona reacting to a product launch on their platform.

Output ONE JSON object matching this Reaction shape:
{
  "id": string,                                                    // will be overwritten by caller; you can use ""
  "round": number,                                                  // echo back the round you are given
  "persona_id": string,                                             // echo back the persona_id you are given
  "platform": "reddit" | "twitter" | "tiktok",                     // matches the persona
  "action": "upvote" | "downvote" | "skip" | "comment" | "share" | "reply",
  "text": string | null,                                            // null if action is upvote/downvote/skip; required for comment/share/reply
  "parent_id": string | null,                                       // ONLY set if action is "reply"; must be one of the IDs in feed memory
  "sentiment": "positive" | "neutral" | "negative" | "controversial",
  "friction_points": string[],                                      // 0-3 short tags ("confusing positioning", "no docs", "bad pricing")
  "created_at": string                                               // ISO timestamp; you can use ""
}

Rules:
- Stay 100% in the persona's voice. Use their posting_style. Don't break character.
- Comments should feel real: 1-3 sentences max, platform-appropriate.
- React to BOTH the product and the recent feed memory — quote-reply, dunk, cosign, or change your mind based on what others said.
- Pick "action" thoughtfully:
  * "skip" if the persona wouldn't bother engaging
  * "upvote"/"downvote" for low-effort signal (no text needed)
  * "comment" or "share" for top-level posts
  * "reply" only when responding to a specific feed item — set parent_id to that item's id
- Sentiment must match the text tone honestly.
- Output JSON only. No prose. No code fences.`;

const REACTION_INPUT_SCHEMA = ReactionSchema.partial({
  id: true,
  created_at: true,
  parent_id: true,
  text: true,
  friction_points: true,
});

export type GenerateReactionOptions = {
  model?: string;
};

let reactionCounter = 0;

function nextReactionId(): string {
  reactionCounter += 1;
  // Compact unique id that's still readable in logs/feed memory.
  return `r_${Date.now().toString(36)}_${reactionCounter.toString(36)}`;
}

function summarizeMemory(memory: Reaction[]): string {
  if (!memory.length) return "(no prior reactions yet — you are early in the discourse)";
  return memory
    .slice(-12) // never overwhelm context — keep most recent / most influential
    .map((m) => {
      const text = m.text ? `"${m.text.slice(0, 200).replace(/\n/g, " ")}"` : "(no text)";
      return `- [${m.id}] @${m.persona_id} on ${m.platform} (${m.action}, ${m.sentiment}): ${text}`;
    })
    .join("\n");
}

export async function generateReaction(
  persona: Persona,
  product: ProductCard,
  memory: Reaction[],
  round: number,
  opts: GenerateReactionOptions = {},
): Promise<Reaction> {
  const personaBlock = JSON.stringify(persona, null, 2);
  const productBlock = JSON.stringify(
    {
      name: product.name,
      tagline: product.tagline,
      category: product.category,
      headline: product.headline,
      subheadline: product.subheadline,
      primary_cta: product.primary_cta,
      key_features: product.key_features,
      target_audience: product.target_audience,
      pricing: product.pricing,
      tone: product.tone,
      visual_style: product.visual_style,
      vibes: product.vibes,
      testimonials: product.testimonials.slice(0, 3),
      virality_hooks: product.virality_hooks,
      risk_factors: product.risk_factors,
    },
    null,
    2,
  );

  const userText = [
    `YOU ARE THIS PERSONA:\n${personaBlock}`,
    "",
    `PRODUCT (the launch you are reacting to):\n${productBlock}`,
    "",
    `RECENT FEED (top reactions from previous rounds — react to these too):\n${summarizeMemory(memory)}`,
    "",
    `ROUND: ${round}`,
    "",
    "Now produce ONE reaction JSON object as your persona.",
  ].join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userText },
  ];

  const raw = await chatJSON<unknown>(messages, {
    model: opts.model,
    temperature: 1.0,
    max_tokens: 320,
  });

  const merged = {
    ...(raw as Record<string, unknown>),
    persona_id: persona.id,
    platform: persona.platform,
    round,
  };

  // First permissive parse to catch missing optionals.
  const loose = REACTION_INPUT_SCHEMA.safeParse(merged);
  if (!loose.success) {
    throw new Error(
      `generateReaction: schema validation failed: ${loose.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }

  const filled: Reaction = {
    id: nextReactionId(),
    round,
    persona_id: persona.id,
    platform: persona.platform,
    action: loose.data.action,
    text: loose.data.text ?? null,
    parent_id: loose.data.parent_id ?? null,
    sentiment: loose.data.sentiment,
    friction_points: loose.data.friction_points ?? [],
    created_at: loose.data.created_at && loose.data.created_at.length > 0
      ? loose.data.created_at
      : new Date().toISOString(),
  };

  // Validate the parent_id points into our memory window if it's a reply.
  if (filled.action === "reply" && filled.parent_id) {
    const validParent = memory.some((m) => m.id === filled.parent_id);
    if (!validParent) {
      // Downgrade dangling replies to comments rather than throwing.
      filled.parent_id = null;
      filled.action = filled.text ? "comment" : "skip";
    }
  } else if (filled.action !== "reply") {
    filled.parent_id = null;
  }

  // Strip text on signal-only actions; require text on textual actions.
  if (filled.action === "upvote" || filled.action === "downvote" || filled.action === "skip") {
    filled.text = null;
  } else if (!filled.text || filled.text.trim().length === 0) {
    filled.action = "skip";
    filled.text = null;
  }

  return ReactionSchema.parse(filled);
}
