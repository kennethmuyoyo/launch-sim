# `lib/scrape` — Owner: **Ken**

Takes a URL, returns a fully-populated `ProductCard` (see `lib/shared/types.ts`).

## Responsibilities

1. Load the URL with Playwright (Chromium, `headless: true`).
2. Capture: page title, hero copy, primary CTA, full-page screenshot, nav links, pricing block (if present), testimonial blocks (if present), feature list, FAQ.
3. Optionally crawl 1–2 internal links (e.g. `/pricing`, `/about`) for richer context.
4. Feed the structured DOM dump + screenshot to the LLM (`lib/llm/openrouter.ts`) with a JSON schema prompt → produce a `ProductCard`.
5. Validate with `ProductCardSchema.parse(...)` before returning.

## Public API

```ts
import type { ProductCard } from "@/lib/shared/types";

export async function scrapeProductCard(url: string): Promise<ProductCard>;
```

The orchestrator (John) calls `scrapeProductCard(url)` once per run.

## Files

- `playwright.ts` — browser session helpers (launch, screenshot, dom dump).
- `extract.ts` — LLM-backed extraction: dom + screenshot → ProductCard.
- `index.ts` — public entry; composes playwright + extract.

## Notes

- Run `npm run playwright:install` once after cloning to get Chromium.
- Many landing pages are heavy SPAs — wait for `networkidle` and give a beat for hero animations.
- If the page blocks Playwright (CF challenge etc.), return a partial ProductCard with what you got and set `risk_factors: ["scraper_blocked"]` so the dashboard can flag it.
- Don't reach into `lib/agents` or `app/`. Your only output is `ProductCard`.
