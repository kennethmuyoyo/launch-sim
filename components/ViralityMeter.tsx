"use client";

function bandFor(value: number): string {
  if (value >= 80) return "going nuclear";
  if (value >= 60) return "trending hard";
  if (value >= 40) return "moderate buzz";
  if (value >= 20) return "niche pickup";
  return "no traction";
}

export function ViralityMeter({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  const band = bandFor(safe);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Virality potential
        </div>
        <div className="text-2xl font-black tabular-nums text-zinc-900 dark:text-zinc-100">
          {safe}
          <span className="ml-0.5 text-xs font-medium text-zinc-500">/100</span>
        </div>
      </div>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 transition-all duration-700 ease-out"
          style={{ width: `${safe}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500">
        <span>silent</span>
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
          {band}
        </span>
        <span>nuclear</span>
      </div>
    </div>
  );
}
