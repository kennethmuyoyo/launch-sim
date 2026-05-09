"use client";

export function WeaknessCard({ weakness }: { weakness: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5 dark:border-rose-900/60 dark:from-rose-950/40 dark:to-zinc-950">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
        <span aria-hidden>⚠️</span>
        Biggest weakness
      </div>
      <p className="mt-2 text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
        {weakness}
      </p>
    </div>
  );
}
