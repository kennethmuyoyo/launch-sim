/**
 * POST /api/run  { url } -> { runId }
 *
 * Creates a Run, kicks off scrape -> simulation in the background.
 * The dashboard then connects to /api/run/:id/stream for live events.
 */

import { runSimulation } from "@/lib/agents";
import { scrapeProductCard } from "@/lib/scrape";
import { createRun, emit } from "@/lib/run-store";

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

      emit(run, { type: "status", status: "generating_personas" });
      // simulating + persona events are emitted by runSimulation through onEvent
      const forecast = await runSimulation(product, (e) => emit(run, e));

      emit(run, { type: "forecast", forecast });
      emit(run, { type: "status", status: "done" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      emit(run, { type: "error", message });
    }
  })();

  return Response.json({ runId: run.id });
}
