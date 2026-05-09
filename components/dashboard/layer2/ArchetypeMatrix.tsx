"use client";

import { motion } from "motion/react";
import type { Persona, Reaction } from "@/lib/shared/types";
import { archetypeSentiment } from "@/lib/dashboard/derive";

type Props = {
  personas: Persona[];
  reactions: Reaction[];
};

const PLATFORM_GLYPH: Record<Persona["platform"], string> = {
  reddit: "▲",
  twitter: "𝕏",
  tiktok: "♪",
};

const PLATFORM_ACCENT: Record<Persona["platform"], string> = {
  reddit: "var(--ember)",
  twitter: "var(--electric)",
  tiktok: "var(--violet)",
};

export function ArchetypeMatrix({ personas, reactions }: Props) {
  const rows = archetypeSentiment(personas, reactions);

  return (
    <div className="glass-strong rounded-3xl overflow-hidden">
      <div className="px-5 py-4 hairline-b flex items-center gap-3">
        <span className="text-eyebrow-bright">archetype sentiment matrix</span>
        <span className="text-xs font-mono text-ink-3">how each tribe is reading the launch</span>
      </div>

      {rows.length === 0 ? (
        <div className="p-10 text-center text-sm text-ink-3">
          Waiting for personas to spawn…
        </div>
      ) : (
        <ul className="divide-y divide-[var(--hairline)]">
          {rows.map((row, idx) => {
            const accent = PLATFORM_ACCENT[row.platform];
            const total = row.positive + row.neutral + row.negative + row.controversial;
            const verdict = verdictOf(row);
            return (
              <motion.li
                key={row.archetype}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.4 }}
                className="px-5 py-3 flex items-center gap-4"
              >
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold"
                  style={{
                    background: `${accent}1f`,
                    color: accent,
                    boxShadow: `inset 0 0 0 1px ${accent}33`,
                  }}
                >
                  {row.avatar || PLATFORM_GLYPH[row.platform]}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-ink-1 font-medium truncate">{row.archetype}</span>
                    <span className="text-eyebrow text-ink-3 ml-1">
                      {PLATFORM_GLYPH[row.platform]} {row.platform}
                    </span>
                  </div>
                  <div className="mt-2">
                    <SentimentBar row={row} />
                  </div>
                </div>

                <div className="text-right shrink-0 w-28">
                  <div
                    className="text-xs font-mono uppercase tracking-widest"
                    style={{ color: verdict.color }}
                  >
                    {verdict.label}
                  </div>
                  <div className="text-[11px] font-mono text-ink-3">
                    {total} {total === 1 ? "signal" : "signals"}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SentimentBar({
  row,
}: {
  row: { positive: number; neutral: number; negative: number; controversial: number };
}) {
  const total = row.positive + row.neutral + row.negative + row.controversial;
  if (total === 0) {
    return (
      <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <motion.div
          className="h-full"
          style={{ background: "linear-gradient(to right, rgba(106,160,255,0.4), rgba(180,140,255,0.4))" }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    );
  }
  const segments = [
    { val: row.positive, color: "var(--positive)" },
    { val: row.controversial, color: "var(--controversial)" },
    { val: row.neutral, color: "var(--neutral)" },
    { val: row.negative, color: "var(--negative)" },
  ];
  return (
    <div className="h-2 rounded-full overflow-hidden flex bg-[rgba(255,255,255,0.04)]">
      {segments.map((s, i) => {
        const pct = (s.val / total) * 100;
        if (pct === 0) return null;
        return (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6 }}
            style={{
              background: s.color,
              boxShadow: `0 0 8px ${s.color}55`,
            }}
          />
        );
      })}
    </div>
  );
}

function verdictOf(row: { positive: number; neutral: number; negative: number; controversial: number }) {
  const total = row.positive + row.neutral + row.negative + row.controversial;
  if (total === 0) return { label: "listening", color: "var(--ink-3)" };
  const dominant = (
    [
      ["LOVES IT", row.positive, "var(--positive)"],
      ["TORN", row.controversial, "var(--controversial)"],
      ["DOESN'T BUY", row.negative, "var(--negative)"],
      ["MEH", row.neutral, "var(--neutral)"],
    ] as const
  ).reduce((best, cur) => (cur[1] > best[1] ? cur : best));
  return { label: dominant[0], color: dominant[2] };
}
