/**
 * GET /api/run/:id/stream -> Server-Sent Events of RunEvents.
 *
 * Replays the run's history first, then streams new events as they're emitted.
 */

import { getRun, subscribe } from "@/lib/run-store";

export async function GET(_req: Request, ctx: RouteContext<"/api/run/[id]/stream">) {
  const { id } = await ctx.params;
  const run = getRun(id);
  if (!run) return new Response("not_found", { status: 404 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Replay history.
      for (const e of run.events) send(e);

      // If the run already finished, close.
      if (run.status === "done" || run.status === "error") {
        controller.close();
        return;
      }

      // Subscribe to future events.
      const unsubscribe = subscribe(run, (e) => {
        send(e);
        if (e.type === "status" && (e.status === "done" || e.status === "error")) {
          unsubscribe();
          controller.close();
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
