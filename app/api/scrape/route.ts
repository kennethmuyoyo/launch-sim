/**
 * POST /api/scrape  { url } -> ProductCard
 *
 * Thin wrapper around lib/scrape so Ken can test his module in isolation
 * (without going through the full run/orchestrator pipeline).
 */

import { scrapeProductCard } from "@/lib/scrape";

export async function POST(req: Request) {
  let url: string;
  try {
    const body = await req.json();
    url = String(body.url ?? "");
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!url) return Response.json({ error: "url_required" }, { status: 400 });

  try {
    const card = await scrapeProductCard(url);
    return Response.json(card);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
