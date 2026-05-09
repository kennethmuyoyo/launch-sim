/**
 * GET /api/run/:id/stream -> Server-Sent Events of RunEvents.
 *
 * Replays the run's history first, then streams new events as they're emitted.
 */

import { getRun, subscribe } from "@/lib/run-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: RouteContext<"/api/run/[id]/stream">) {
  const { id } = await ctx.params;
  const run = getRun(id);
  if (!run) return new Response("not_found", { status: 404 });

  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const safeEnqueue = (chunk: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(chunk);
        } catch {
          // Controller already closed (client disconnected). Tear down.
          teardown();
        }
      };

      const send = (data: unknown) => {
        safeEnqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const teardown = () => {
        if (closed) return;
        closed = true;
        if (unsubscribe) unsubscribe();
        if (heartbeat) clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      // Heartbeat keeps proxies from idling out the connection.
      heartbeat = setInterval(() => {
        safeEnqueue(encoder.encode(`: heartbeat\n\n`));
      }, 15_000);

      // Replay history.
      for (const e of run.events) send(e);

      // If the run already finished, close.
      if (run.status === "done" || run.status === "error") {
        teardown();
        return;
      }

      // Subscribe to future events.
      unsubscribe = subscribe(run, (e) => {
        send(e);
        if (e.type === "status" && (e.status === "done" || e.status === "error")) {
          teardown();
        }
      });

      // Client disconnect.
      req.signal.addEventListener("abort", teardown);
    },
    cancel() {
      closed = true;
      if (unsubscribe) unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
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
