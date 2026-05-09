"use client";

import { useEffect, useState } from "react";
import type { RunEvent } from "@/lib/shared/types";
import { startDemoStream } from "@/lib/demo/simulator";

const DEMO_PREFIX = "demo-";
const FALLBACK_DEMO_URL = "https://demoflow.app";

export type RunSource = {
  events: RunEvent[];
  /** URL the run was started for (sniffed from sessionStorage for demo runs). */
  url: string | null;
  isDemo: boolean;
};

/**
 * Subscribes to a run's RunEvent stream.
 *
 * - `demo-*` ids run an in-process simulator that mirrors the real backend.
 * - All other ids open an SSE connection to /api/run/:id/stream.
 *
 * The dashboard never branches on `isDemo` — both produce the same shape.
 */
export function useRunEvents(id: string): RunSource {
  // Reset all per-run state during render when the id changes — the React 19
  // "adjust-state-on-prop-change" pattern keeps us out of cascading renders.
  const [activeId, setActiveId] = useState(id);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [url, setUrl] = useState<string | null>(() => deriveUrl(id));

  if (activeId !== id) {
    setActiveId(id);
    setEvents([]);
    setUrl(deriveUrl(id));
  }

  const isDemo = id.startsWith(DEMO_PREFIX);

  useEffect(() => {
    if (isDemo) {
      const demoUrl = deriveUrl(id) ?? FALLBACK_DEMO_URL;
      const cancel = startDemoStream(demoUrl, (e) =>
        setEvents((prev) => [...prev, e]),
      );
      return cancel;
    }

    const es = new EventSource(`/api/run/${id}/stream`);
    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as RunEvent;
        setEvents((prev) => [...prev, event]);
      } catch {
        /* ignore malformed */
      }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [id, isDemo]);

  return { events, url, isDemo };
}

function deriveUrl(id: string): string | null {
  if (typeof window === "undefined") return null;
  if (!id.startsWith(DEMO_PREFIX)) return null;
  try {
    const raw = window.sessionStorage.getItem(`run:${id}`);
    if (raw) {
      const parsed = JSON.parse(raw) as { url?: string };
      if (parsed.url) return parsed.url;
    }
  } catch {
    /* sessionStorage unavailable */
  }
  return FALLBACK_DEMO_URL;
}
