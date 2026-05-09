"use client";

export function ViralHookCard({ hook }: { hook: string }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 dark:border-emerald-900/60 dark:from-emerald-950/40 dark:to-zinc-950">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
        <span aria-hidden>✨</span>
        Biggest viral hook
      </div>
      <p className="mt-2 text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
        {hook}
      </p>
    </div>
  );
}
