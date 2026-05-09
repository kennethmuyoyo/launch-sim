"use client";

import type { ProductCard } from "@/lib/shared/types";

function Chip({
  label,
  tone,
}: {
  label: string;
  tone: "vibe" | "risk";
}) {
  const classes =
    tone === "vibe"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
      : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        classes,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export function ProductCardSummary({ product }: { product: ProductCard }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 backdrop-blur transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {product.name}
            </h2>
            {product.category && (
              <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {product.category}
              </span>
            )}
          </div>
          {product.tagline && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {product.tagline}
            </p>
          )}
        </div>
        <a
          href={product.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 truncate text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          {new URL(product.url).host}
        </a>
      </div>

      {(product.vibes.length > 0 || product.risk_factors.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.vibes.slice(0, 6).map((v) => (
            <Chip key={`v-${v}`} label={v} tone="vibe" />
          ))}
          {product.risk_factors.slice(0, 4).map((r) => (
            <Chip key={`r-${r}`} label={r} tone="risk" />
          ))}
        </div>
      )}
    </div>
  );
}
