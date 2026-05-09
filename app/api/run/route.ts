/**
 * POST /api/run  { url } -> { runId }
 *
 * Creates a Run, kicks off scrape -> simulation in the background.
 * The dashboard then connects to /api/run/:id/stream for live events.
 */

import { runSimulation } from "@/lib/agents";
import { scrapeProductCard } from "@/lib/scrape";
import { createRun, emit } from "@/lib/run-store";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  let url: string;
  try {
    const body = await req.json();
    url = String(body.url ?? "");
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!url) return Response.json({ error: "url_required" }, { status: 400 });

  const run = createRun(url);

  // Fire-and-forget. Errors are surfaced via emit({type: "error"}).
  void (async () => {
    try {
      emit(run, { type: "status", status: "scraping" });
      const product = await scrapeProductCard(url);
      emit(run, { type: "product_card", product });

      // runSimulation emits its own status events
      // (generating_personas → personas → simulating → reactions → aggregating).
      // It does NOT emit `forecast` or `done` — that boundary lives here so there's
      // exactly one source of truth for terminal events.
      const forecast = await runSimulation(product, (e) => emit(run, e), { runId: run.id });

      emit(run, { type: "forecast", forecast });
      emit(run, { type: "status", status: "done" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      emit(run, { type: "error", message });
    }
  })();

  return Response.json({ runId: run.id });
}
