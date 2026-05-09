"use client";

import type { Reaction } from "@/lib/shared/types";

type Props = {
  reactions: Reaction[];
};

/**
 * Bottom-of-hero ticker — Bloomberg-terminal-style scroll of latest events.
 * Pure CSS marquee so it stays cheap at 60fps.
 */
export function StatusTicker({ reactions }: Props) {
  const items = reactions.slice(-30);
  if (items.length === 0) {
    return (
      <div className="hairline-t hairline-b bg-[rgba(0,0,0,0.3)]">
        <div className="mx-auto max-w-[1400px] px-6 py-2 text-xs font-mono text-ink-3">
          waiting for the first signal …
        </div>
      </div>
    );
  }

  // Duplicate the items so the marquee loop is seamless.
  const stream = [...items, ...items];

  return (
    <div className="hairline-t hairline-b bg-[rgba(0,0,0,0.3)] overflow-hidden">
      <div className="mx-auto max-w-[1400px] relative">
        <div className="absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-[#060608] to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-[#060608] to-transparent pointer-events-none" />
        <div className="marquee-track flex gap-10 py-2 whitespace-nowrap font-mono text-xs">
          {stream.map((r, idx) => (
            <span key={idx} className="flex items-center gap-2 text-ink-2">
              <span className="text-ink-3">[{r.platform}]</span>
              <Dot s={r.sentiment} />
              <span className="truncate max-w-[44ch]">{r.text ?? r.action}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dot({ s }: { s: Reaction["sentiment"] }) {
  const color =
    s === "positive" ? "var(--positive)" :
    s === "negative" ? "var(--negative)" :
    s === "controversial" ? "var(--controversial)" :
    "var(--neutral)";
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
    />
  );
}
