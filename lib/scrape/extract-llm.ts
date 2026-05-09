/**
 * LLM enrichment: fills the soft fields of a baseline ProductCard. Owner: Ken.
 *
 * Inputs:  baseline ProductCard (from heuristic extract.ts) + the original PageCapture
 * Outputs: ProductCard with category / target_audience / tone / visual_style / vibes /
 *          virality_hooks / testimonials populated. Existing baseline fields are kept.
 *
 * Strategy: send the screenshot (data URL) + a trimmed page-text dump to a vision-capable
 * model and ask for ONLY the soft fields as JSON. We don't ask the LLM to re-extract
 * what the heuristic already got right — keeps the prompt cheap and reduces hallucination
 * surface area.
 */

import { chatJSON } from "@/lib/llm/openrouter";
import { ProductCardSchema, type ProductCard } from "@/lib/shared/types";
import type { PageCapture } from "./playwright";

const SYSTEM_PROMPT = `You analyze landing pages for a product-launch simulator.
Given the page's text and a screenshot, infer the soft signals (category, audience, tone, vibes, etc.).
Be terse. Output ONLY valid JSON matching the schema the user describes — no markdown, no commentary.`;

type Enrichment = {
  category: string | null;
  target_audience: string[];
  testimonials: string[];
  visual_style: string | null;
  tone: string | null;
  vibes: string[];
  virality_hooks: string[];
};

function buildUserText(baseline: ProductCard, capture: PageCapture): string {
  return `URL: ${baseline.url}
Page title: ${capture.title}

What the heuristic extractor already got (do NOT contradict these unless clearly wrong):
- name: ${baseline.name}
- tagline: ${baseline.tagline ?? "(none)"}
- headline: ${baseline.headline ?? "(none)"}
- subheadline: ${baseline.subheadline ?? "(none)"}
- primary_cta: ${baseline.primary_cta ?? "(none)"}
- pricing: ${baseline.pricing ?? "(none)"}
- key_features: ${baseline.key_features.join(" | ") || "(none)"}

Trimmed page text:
${capture.textContent.slice(0, 6000)}

Fill in EXACTLY this JSON (no extra keys, no markdown):
{
  "category":        "2–5 word product category, e.g. 'AI study app', 'design tool', 'CRM'",
  "target_audience": ["who is this FOR — up to 5 short labels, e.g. 'students', 'indie hackers'"],
  "testimonials":    ["verbatim user quotes visible on the page; empty array if none"],
  "visual_style":    "short phrase, e.g. 'minimalist + Apple-inspired', 'brutalist', 'playful'",
  "tone":            "one of: minimalist | hype-bro | earnest | technical | playful | formal | mysterious",
  "vibes":           ["3–5 single-word descriptors of the page's overall feeling"],
  "virality_hooks":  ["1–3 short phrases describing what would make people share this"]
}`;
}

export async function llmEnrich(
  baseline: ProductCard,
  capture: PageCapture,
): Promise<ProductCard> {
  // Text-only by default. Most reliable free OpenRouter models aren't vision-capable
  // (vision-capable free Google models are aggressively rate-limited). The page text
  // we already capture is rich enough for category/audience/tone/vibes inference.
  // Set OPENROUTER_VISION=1 to attach the screenshot for vision-capable paid models.
  const userText = buildUserText(baseline, capture);
  const screenshot = baseline.screenshots[0];
  const useVision = process.env.OPENROUTER_VISION === "1" && Boolean(screenshot);

  const result = await chatJSON<Enrichment>(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: useVision
          ? [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: screenshot! } },
            ]
          : userText,
      },
    ],
    { temperature: 0.4, max_tokens: 800 },
  );

  const merged: ProductCard = {
    ...baseline,
    category: result.category ?? baseline.category,
    target_audience: result.target_audience?.length ? result.target_audience : baseline.target_audience,
    testimonials: result.testimonials?.length ? result.testimonials : baseline.testimonials,
    visual_style: result.visual_style ?? baseline.visual_style,
    tone: result.tone ?? baseline.tone,
    vibes: result.vibes?.length ? result.vibes : baseline.vibes,
    virality_hooks: result.virality_hooks?.length ? result.virality_hooks : baseline.virality_hooks,
  };

  return ProductCardSchema.parse(merged);
}
