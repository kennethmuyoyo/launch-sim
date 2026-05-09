"use client";

import Link from "next/link";
import type { ProductCard, RunStatus } from "@/lib/shared/types";

const STATUS_LABEL: Record<RunStatus, string> = {
  queued: "queued",
  scraping: "scraping landing page",
  generating_personas: "spawning personas",
  simulating: "simulating discourse",
  aggregating: "aggregating forecast",
  done: "transmission complete",
  error: "signal lost",
};

const STATUS_COLOR: Record<RunStatus, string> = {
  queued: "var(--ink-3)",
  scraping: "var(--electric)",
  generating_personas: "var(--violet)",
  simulating: "var(--ember)",
  aggregating: "var(--electric)",
  done: "var(--positive)",
  error: "var(--negative)",
};

type Props = {
  runId: string;
  url: string | null;
  status: RunStatus;
  product: ProductCard | null;
  reactionCount: number;
  personaCount: number;
};

export function TopBar({ runId, url, status, product, reactionCount, personaCount }: Props) {
  const dot = STATUS_COLOR[status];
  return (
    <div className="sticky top-0 z-30 hairline-b backdrop-blur-xl bg-[rgba(6,6,8,0.7)]">
      <div className="mx-auto max-w-[1400px] px-6 py-3 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{
              background:
                "conic-gradient(from 200deg, var(--electric) 0deg, var(--violet) 140deg, var(--ember) 260deg, var(--electric) 360deg)",
              filter: "saturate(1.2)",
            }}
          />
          <span className="font-semibold tracking-tight">Vibe</span>
          <span className="text-eyebrow ml-1 group-hover:text-ink-1 transition">
            launch sim
          </span>
        </Link>

        <span className="hidden sm:inline-block h-4 w-px bg-[var(--hairline)]" />

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: dot, boxShadow: `0 0 12px ${dot}` }}
          />
          <span className="font-mono text-xs text-ink-2 uppercase tracking-widest">
            {STATUS_LABEL[status]}
          </span>
        </div>

        <span className="hidden md:inline-block h-4 w-px bg-[var(--hairline)]" />

        <div className="hidden md:flex items-center gap-2 text-xs text-ink-2 font-mono truncate">
          <span className="text-ink-3">target →</span>
          <span className="truncate text-ink-1">
            {product?.url ?? url ?? "—"}
          </span>
          {product?.name && (
            <span className="text-ink-3">· {product.name}</span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-4 text-xs font-mono text-ink-3">
          <span>
            <span className="text-ink-1">{personaCount}</span> personas
          </span>
          <span className="hidden sm:inline">
            <span className="text-ink-1">{reactionCount}</span> reactions
          </span>
          <span className="hidden sm:inline truncate">
            run <span className="text-ink-1">{runId.slice(0, 8)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
