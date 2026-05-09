"use client";

function tone(score: number): { stroke: string; label: string; text: string } {
  if (score >= 75)
    return { stroke: "#10b981", label: "Crushed it", text: "text-emerald-500" };
  if (score >= 55)
    return { stroke: "#84cc16", label: "Solid launch", text: "text-lime-500" };
  if (score >= 40)
    return { stroke: "#f59e0b", label: "Mid", text: "text-amber-500" };
  if (score >= 25)
    return { stroke: "#f97316", label: "Wobble", text: "text-orange-500" };
  return { stroke: "#ef4444", label: "Roast incoming", text: "text-red-500" };
}

export function LaunchScoreGauge({ score }: { score: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  const t = tone(safe);

  const cx = 100;
  const cy = 100;
  const r = 80;
  const circumference = Math.PI * r;
  const dash = (safe / 100) * circumference;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Launch score
      </div>

      <div className="relative mt-2 flex justify-center">
        <svg viewBox="0 0 200 120" className="w-full max-w-[260px]">
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="currentColor"
            className="text-zinc-200 dark:text-zinc-800"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={t.stroke}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: "stroke-dasharray 700ms ease-out" }}
          />
        </svg>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
          <div
            className={[
              "text-5xl font-black tabular-nums leading-none",
              t.text,
            ].join(" ")}
          >
            {safe}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-widest text-zinc-500">
            / 100
          </div>
        </div>
      </div>

      <div className="mt-3 text-center text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {t.label}
      </div>
    </div>
  );
}
