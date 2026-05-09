"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Persona, ProductCard, Reaction } from "@/lib/shared/types";
import { timeline } from "@/lib/dashboard/derive";

type Props = {
  product: ProductCard | null;
  reactions: Reaction[];
  personas: Persona[];
};

const DAY_TO_LABEL = (round: number) => {
  if (round === 1) return "Day 1";
  if (round === 2) return "Day 3";
  if (round === 3) return "Day 5";
  if (round === 4) return "Day 7";
  if (round === 5) return "Day 10";
  return `Day ${round * 2}`;
};

export function TimelinePlayback({ product, reactions, personas }: Props) {
  const days = useMemo(() => timeline(reactions, product), [reactions, product]);
  const personaMap = useMemo(() => new Map(personas.map((p) => [p.id, p])), [personas]);

  // Track manual scrub vs. auto-advance: until the user clicks a marker,
  // the active round always trails the freshest data; once they pin a round
  // we respect their choice.
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const active = scrubIndex ?? Math.max(0, days.length - 1);

  if (days.length === 0) {
    return (
      <div className="glass-strong rounded-3xl p-10 text-center text-sm text-ink-3">
        Timeline will populate as the simulation progresses through rounds…
      </div>
    );
  }

  const day = days[Math.min(active, days.length - 1)];
  const sample = day.reactions.slice(0, 3);

  return (
    <div className="glass-strong rounded-3xl overflow-hidden">
      <div className="px-5 py-4 hairline-b flex items-center gap-3 flex-wrap">
        <span className="text-eyebrow-bright">launch timeline · scrub to replay</span>
        <span className="text-xs font-mono text-ink-3">simulating the first 10 days of internet response</span>
      </div>

      {/* Scrub track */}
      <div className="px-6 pt-7 pb-4">
        <div className="relative h-12">
          <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--hairline)]" />
          <div className="absolute inset-0 flex justify-between items-center">
            {days.map((d, idx) => {
              const isActive = idx === active;
              const total = d.positiveCount + d.negativeCount + d.controversialCount;
              const dominant =
                d.positiveCount >= d.negativeCount && d.positiveCount >= d.controversialCount
                  ? "var(--positive)"
                  : d.negativeCount >= d.controversialCount
                  ? "var(--negative)"
                  : "var(--controversial)";
              return (
                <button
                  key={d.day}
                  onClick={() => setScrubIndex(idx)}
                  className="group relative flex flex-col items-center gap-2"
                >
                  <span
                    className={`text-[10px] font-mono uppercase tracking-widest transition ${
                      isActive ? "text-ink-0" : "text-ink-3 group-hover:text-ink-1"
                    }`}
                  >
                    {DAY_TO_LABEL(d.day)}
                  </span>
                  <span
                    className="block rounded-full transition"
                    style={{
                      width: isActive ? 14 : 8,
                      height: isActive ? 14 : 8,
                      background: dominant,
                      boxShadow: isActive ? `0 0 16px ${dominant}` : `0 0 6px ${dominant}66`,
                      border: isActive ? "2px solid rgba(255,255,255,0.9)" : "none",
                    }}
                  />
                  <span className={`text-[10px] font-mono ${isActive ? "text-ink-1" : "text-ink-3"}`}>
                    {total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day card */}
      <div className="px-6 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-start"
          >
            <div>
              <div className="text-eyebrow">round {day.day}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight gradient-ink leading-tight">
                {day.headline}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <BadgeStat label="loves" value={day.positiveCount} color="var(--positive)" />
                <BadgeStat label="splits" value={day.controversialCount} color="var(--controversial)" />
                <BadgeStat label="hates" value={day.negativeCount} color="var(--negative)" />
              </div>
            </div>

            <div className="space-y-2">
              {sample.length === 0 ? (
                <div className="text-sm text-ink-3 italic">
                  No standout reactions captured this round.
                </div>
              ) : (
                sample.map((r) => {
                  const p = personaMap.get(r.persona_id);
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border border-[var(--hairline)] bg-[rgba(255,255,255,0.02)] p-3"
                    >
                      <div className="flex items-center gap-2 text-[11px] font-mono text-ink-3 mb-1">
                        <span className="uppercase tracking-widest">{r.platform}</span>
                        <span className="text-ink-2">{p?.display_name ?? "anon"}</span>
                        <span className="ml-auto" style={{ color: sentimentColor(r.sentiment) }}>
                          {r.sentiment}
                        </span>
                      </div>
                      <div className="text-sm text-ink-1">{r.text}</div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function BadgeStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-lg px-2.5 py-2 flex items-baseline justify-between"
      style={{ background: `${color}10`, border: `1px solid ${color}33` }}
    >
      <span className="text-eyebrow" style={{ color }}>
        {label}
      </span>
      <span className="font-mono text-sm tabular-nums text-ink-1">{value}</span>
    </div>
  );
}

function sentimentColor(s: Reaction["sentiment"]) {
  return s === "positive" ? "var(--positive)" :
    s === "negative" ? "var(--negative)" :
    s === "controversial" ? "var(--controversial)" :
    "var(--neutral)";
}
