/**
 * Smoke test for lib/scrape. Owner: Ken.
 *
 *   npm run smoke:scrape                              # uses defaults below
 *   npm run smoke:scrape -- https://foo.com           # one URL
 *   npm run smoke:scrape -- https://a.com https://b.com  # multiple
 *   npm run smoke:scrape -- --quiet https://foo.com   # only print key fields
 *
 * For each URL: runs scrapeProductCard, prints a readable summary, and saves the
 * full ProductCard (including screenshot data URL) to scripts/.smoke-out/ so you
 * can diff results across iterations.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Load .env.local so OPENROUTER_API_KEY etc. are available when running via `tsx`.
// (Next.js loads it automatically; `tsx scripts/...` does not.)
const envPath = join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const rawLine of readFileSync(envPath, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

import type { ProductCard } from "../lib/shared/types";
import { scrapeProductCard } from "../lib/scrape";
import { closeBrowser } from "../lib/scrape/playwright";

const DEFAULT_URLS = [
  "https://lovable.dev",
  "https://v0.app",
  "https://example.com",
];

const OUT_DIR = join(process.cwd(), "scripts", ".smoke-out");

type Args = { quiet: boolean; urls: string[] };

function parseArgs(argv: string[]): Args {
  const out: Args = { quiet: false, urls: [] };
  for (const a of argv) {
    if (a === "--quiet" || a === "-q") out.quiet = true;
    else if (a.startsWith("--")) {
      console.error(`Unknown flag: ${a}`);
      process.exit(2);
    } else out.urls.push(a);
  }
  if (!out.urls.length) out.urls = DEFAULT_URLS;
  return out;
}

function summarize(card: ProductCard): Record<string, unknown> {
  return {
    name: card.name,
    tagline: card.tagline,
    headline: card.headline,
    subheadline: card.subheadline,
    primary_cta: card.primary_cta,
    pricing: card.pricing,
    social_proof_strength: card.social_proof_strength,
    key_features: card.key_features,
    screenshots: card.screenshots.map((s) => `<${s.length} char data URL>`),
    risk_factors: card.risk_factors,
    empty_fields: Object.entries(card)
      .filter(([, v]) => v === null || (Array.isArray(v) && v.length === 0))
      .map(([k]) => k),
  };
}

function slugFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/[^a-z0-9.-]/gi, "_");
  } catch {
    return url.replace(/[^a-z0-9.-]/gi, "_");
  }
}

function saveFullCard(url: string, card: ProductCard): string {
  mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = join(OUT_DIR, `${slugFromUrl(url)}-${stamp}.json`);
  writeFileSync(file, JSON.stringify(card, null, 2));
  return file;
}

async function main() {
  const { quiet, urls } = parseArgs(process.argv.slice(2));
  const results: { url: string; ok: boolean; ms: number; error?: string }[] = [];

  for (const url of urls) {
    process.stdout.write(`\n=== ${url} ===\n`);
    const t0 = Date.now();
    try {
      const card = await scrapeProductCard(url);
      const ms = Date.now() - t0;
      const file = saveFullCard(url, card);

      if (quiet) {
        const s = summarize(card);
        console.log(`name        : ${s.name}`);
        console.log(`tagline     : ${s.tagline}`);
        console.log(`headline    : ${s.headline}`);
        console.log(`primary_cta : ${s.primary_cta}`);
        console.log(`pricing     : ${s.pricing}`);
        console.log(`features (${(s.key_features as string[]).length}): ${(s.key_features as string[]).join(" | ")}`);
        console.log(`empty       : ${(s.empty_fields as string[]).join(", ")}`);
      } else {
        console.dir(summarize(card), { depth: null, colors: process.stdout.isTTY });
      }
      console.log(`saved       : ${file}`);
      console.log(`took        : ${ms}ms`);
      results.push({ url, ok: true, ms });
    } catch (err) {
      const ms = Date.now() - t0;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`FAILED in ${ms}ms — ${message}`);
      results.push({ url, ok: false, ms, error: message });
    }
  }

  await closeBrowser();

  console.log("\n=== summary ===");
  for (const r of results) {
    const status = r.ok ? "OK " : "ERR";
    console.log(`${status}  ${r.ms.toString().padStart(5)}ms  ${r.url}${r.error ? `  — ${r.error}` : ""}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  void closeBrowser().finally(() => process.exit(1));
});
