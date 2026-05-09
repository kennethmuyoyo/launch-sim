"use client";

import { motion } from "motion/react";
import type { Forecast } from "@/lib/shared/types";

type Props = {
  forecast: Forecast | null;
  strengths: string[];
  weaknesses: string[];
};

export function StrengthsWeaknesses({ forecast, strengths, weaknesses }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Column
        kind="strength"
        title="Viral hooks"
        eyebrow="WHY THE INTERNET LIKES THIS"
        items={strengths}
        accent="var(--positive)"
        glyph="↗"
      />
      <Column
        kind="weakness"
        title="Critical weaknesses"
        eyebrow="WHERE THE INTERNET PUSHES BACK"
        items={weaknesses}
        accent="var(--negative)"
        glyph="↘"
      />

      {forecast && (
        <div className="md:col-span-2 glass rounded-2xl p-5 inner-ring">
          <div className="text-eyebrow-bright">narrative summary · synthesized read</div>
          <p className="mt-3 text-base leading-relaxed text-ink-1 italic">
            “{forecast.narrative}”
          </p>
        </div>
      )}
    </div>
  );
}

function Column({
  kind,
  title,
  eyebrow,
  items,
  accent,
  glyph,
}: {
  kind: "strength" | "weakness";
  title: string;
  eyebrow: string;
  items: string[];
  accent: string;
  glyph: string;
}) {
  return (
    <div
      className="glass rounded-2xl p-5 inner-ring relative overflow-hidden"
      style={{ boxShadow: `0 0 0 1px ${accent}10` }}
    >
      <div
        aria-hidden
        className="absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-25 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)`, filter: "blur(28px)" }}
      />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-sm"
            style={{ background: `${accent}1f`, color: accent, boxShadow: `inset 0 0 0 1px ${accent}33` }}
          >
            {glyph}
          </span>
          <div className="text-eyebrow" style={{ color: accent }}>{eyebrow}</div>
        </div>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-ink-0">{title}</h3>

        <ul className="mt-4 space-y-2">
          {items.length === 0 ? (
            <li className="text-sm text-ink-3 italic">
              Forming verdicts as the discourse settles…
            </li>
          ) : (
            items.map((it, idx) => (
              <motion.li
                key={`${kind}-${idx}`}
                initial={{ opacity: 0, x: kind === "strength" ? -8 : 8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="flex items-start gap-3 text-sm text-ink-1"
              >
                <span
                  className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: accent, boxShadow: `0 0 8px ${accent}aa` }}
                />
                <span>{it}</span>
              </motion.li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
