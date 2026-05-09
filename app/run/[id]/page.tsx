/**
 * Live run view. Owner: Juno.
 *
 * Connects to /api/run/:id/stream (SSE), renders three panels as data streams in:
 *   1. Reddit thread (filter reactions where platform === "reddit")
 *   2. Twitter discourse (platform === "twitter")
 *   3. TikTok comments (platform === "tiktok")
 *
 * When the final `forecast` event arrives, swap to the dashboard layout:
 *   launch score gauge, virality potential, biggest viral hook,
 *   biggest weakness, sentiment breakdown bars, top comments, hot tweets.
 *
 * Stub below — replace with real components in components/.
 */

"use client";

import { use, useEffect, useState } from "react";
import type { RunEvent } from "@/lib/shared/types";

export default function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [events, setEvents] = useState<RunEvent[]>([]);

  useEffect(() => {
    const es = new EventSource(`/api/run/${id}/stream`);
    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as RunEvent;
        setEvents((prev) => [...prev, event]);
      } catch {
        // ignore malformed
      }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [id]);

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Run {id.slice(0, 8)}</h1>
        <p className="text-sm text-zinc-500">
          {events.length} events streamed. Juno: replace this with the three-panel discourse view + forecast dashboard.
        </p>
      </header>

      <pre className="overflow-auto rounded-lg bg-zinc-900 p-4 text-xs text-zinc-100">
        {events.map((e, i) => (
          <div key={i}>{JSON.stringify(e)}</div>
        ))}
      </pre>
    </main>
  );
}
