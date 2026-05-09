"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Persona, Reaction } from "@/lib/shared/types";
import { DiscourseCard } from "./DiscourseCard";

type Props = {
  reactions: Reaction[];
  personas: Persona[];
};

type Filter = "all" | "reddit" | "twitter" | "tiktok";

const FILTERS: Array<{ key: Filter; label: string; accent: string }> = [
  { key: "all", label: "all signal", accent: "var(--ink-1)" },
  { key: "reddit", label: "reddit", accent: "var(--ember)" },
  { key: "twitter", label: "twitter / x", accent: "var(--electric)" },
  { key: "tiktok", label: "tiktok", accent: "var(--violet)" },
];

export function LiveDiscourseFeed({ reactions, personas }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const personaMap = useMemo(
    () => new Map(personas.map((p) => [p.id, p])),
    [personas],
  );

  const filtered = useMemo(() => {
    const base = filter === "all" ? reactions : reactions.filter((r) => r.platform === filter);
    // Newest first, capped so the column doesn't grow forever.
    return [...base].reverse().slice(0, 60);
  }, [reactions, filter]);

  const counts = useMemo(() => {
    const c = { reddit: 0, twitter: 0, tiktok: 0, all: 0 };
    for (const r of reactions) {
      c[r.platform]++;
      c.all++;
    }
    return c;
  }, [reactions]);

  return (
    <section className="glass-strong rounded-3xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 hairline-b flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-eyebrow-bright">live discourse feed</span>
        </div>
        <div className="text-xs font-mono text-ink-3">
          ingesting {reactions.length} signals
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-full p-1 bg-[rgba(255,255,255,0.04)] border border-[var(--hairline)]">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition ${
                filter === f.key
                  ? "text-ink-0 bg-[rgba(255,255,255,0.08)]"
                  : "text-ink-3 hover:text-ink-1"
              }`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: f.accent, opacity: filter === f.key ? 1 : 0.5 }}
              />
              {f.label}
              <span className="text-ink-3">{counts[f.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed grid */}
      <div className="relative">
        <div
          className="absolute inset-x-0 top-0 h-10 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(11,11,16,0.9), transparent)" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-12 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(11,11,16,0.9), transparent)" }}
        />

        <div className="no-scrollbar h-[640px] overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <ul
              className="grid gap-4"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gridAutoRows: "auto",
              }}
            >
              <AnimatePresence initial={false}>
                {filtered.map((r, idx) => (
                  <motion.li
                    layout
                    key={r.id}
                    initial={{ opacity: 0, y: 14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 220, damping: 22, mass: 0.6 }}
                  >
                    <DiscourseCard
                      reaction={r}
                      persona={personaMap.get(r.persona_id) ?? null}
                      index={idx}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center">
      <div className="relative h-16 w-16 mb-6">
        <div
          className="absolute inset-0 rounded-full border border-[var(--electric)]/40"
          style={{ animation: "live-ping 1.6s ease-out infinite" }}
        />
        <div className="absolute inset-3 rounded-full bg-[var(--electric)]/30 blur-md" />
        <div className="absolute inset-5 rounded-full bg-[var(--electric)]" />
      </div>
      <div className="text-eyebrow-bright">tuning the antenna…</div>
      <div className="mt-2 max-w-sm text-sm text-ink-2">
        Spawning personas and pointing them at your launch. First reactions arrive in a few seconds.
      </div>
    </div>
  );
}
