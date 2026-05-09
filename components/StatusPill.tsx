"use client";

import type { RunStatus } from "@/lib/shared/types";

const STATUS_META: Record<
  RunStatus,
  { label: string; hint: string; classes: string; pulse: boolean }
> = {
  queued: {
    label: "Queued",
    hint: "waiting for a worker",
    classes: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    pulse: true,
  },
  scraping: {
    label: "Scraping",
    hint: "reading the landing page",
    classes: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    pulse: true,
  },
  generating_personas: {
    label: "Casting personas",
    hint: "spinning up internet citizens",
    classes:
      "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    pulse: true,
  },
  simulating: {
    label: "Simulating discourse",
    hint: "live reactions are streaming in",
    classes:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    pulse: true,
  },
  aggregating: {
    label: "Aggregating",
    hint: "scoring the launch",
    classes:
      "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300",
    pulse: true,
  },
  done: {
    label: "Forecast ready",
    hint: "the verdict is in",
    classes:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    pulse: false,
  },
  error: {
    label: "Error",
    hint: "something broke mid-simulation",
    classes: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    pulse: false,
  },
};

export function StatusPill({ status }: { status: RunStatus }) {
  const meta = STATUS_META[status];
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={[
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium tracking-wide",
          meta.classes,
        ].join(" ")}
      >
        <span
          className={[
            "h-1.5 w-1.5 rounded-full bg-current",
            meta.pulse ? "animate-pulse" : "",
          ].join(" ")}
        />
        {meta.label}
      </span>
      <span className="hidden text-xs text-zinc-500 sm:inline">
        {meta.hint}
      </span>
    </div>
  );
}
