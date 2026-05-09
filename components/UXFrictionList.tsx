"use client";

export function UXFrictionList({ items }: { items: string[] }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          UX friction
        </div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-400">
          clustered
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
          No friction surfaced — clean experience.
        </p>
      ) : (
        <ol className="mt-3 space-y-2">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <span className="text-sm leading-snug text-zinc-800 dark:text-zinc-100">
                {item}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
