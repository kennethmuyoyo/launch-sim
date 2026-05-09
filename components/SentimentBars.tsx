"use client";

import type { Forecast } from "@/lib/shared/types";

const LABELS: Array<{
  key: keyof Forecast["sentiment_breakdown"];
  label: string;
  bar: string;
  dot: string;
  text: string;
}> = [
  {
    key: "positive",
    label: "Positive",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "neutral",
    label: "Neutral",
    bar: "bg-zinc-400",
    dot: "bg-zinc-400",
    text: "text-zinc-500 dark:text-zinc-400",
  },
  {
    key: "negative",
    label: "Negative",
    bar: "bg-rose-500",
    dot: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
  },
  {
    key: "controversial",
    label: "Controversial",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
];

export function SentimentBars({
  breakdown,
}: {
  breakdown: Forecast["sentiment_breakdown"];
}) {
  const total = Math.max(
    1,
    breakdown.positive + breakdown.neutral + breakdown.negative + breakdown.controversial
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Sentiment breakdown
      </div>

      <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        {LABELS.map((l) => {
          const pct = (breakdown[l.key] / total) * 100;
          return (
            <div
              key={l.key}
              className={[
                "h-full transition-all duration-500 ease-out",
                l.bar,
              ].join(" ")}
              style={{ width: `${pct}%` }}
              title={`${l.label}: ${breakdown[l.key]}`}
            />
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {LABELS.map((l) => (
          <div key={l.key} className="flex items-center gap-1.5">
            <span className={["h-2 w-2 rounded-full", l.dot].join(" ")} />
            <span className="text-zinc-500">{l.label}</span>
            <span className={["ml-auto font-semibold tabular-nums", l.text].join(" ")}>
              {breakdown[l.key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
