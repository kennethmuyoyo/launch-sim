/**
 * GET /api/run/:id -> snapshot of the Run (status, product, personas, forecast, error).
 *
 * Used by the dashboard for initial hydrate before connecting the SSE stream.
 */

import { getRun } from "@/lib/run-store";

export async function GET(_req: Request, ctx: RouteContext<"/api/run/[id]">) {
  const { id } = await ctx.params;
  const run = getRun(id);
  if (!run) return Response.json({ error: "not_found" }, { status: 404 });

  return Response.json({
    id: run.id,
    url: run.url,
    status: run.status,
    product: run.product,
    personas: run.personas,
    forecast: run.forecast,
    error: run.error,
    eventCount: run.events.length,
  });
}
