"use client";

import { motion } from "motion/react";

type Props = {
  index: 1 | 2 | 3;
  eyebrow: string;
  title: string;
  description?: string;
};

const ACCENT: Record<Props["index"], string> = {
  1: "var(--electric)",
  2: "var(--violet)",
  3: "var(--ember)",
};

export function LayerHeader({ index, eyebrow, title, description }: Props) {
  const accent = ACCENT[index];
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-md font-mono text-[11px] font-bold"
          style={{
            background: `${accent}22`,
            color: accent,
            boxShadow: `inset 0 0 0 1px ${accent}33, 0 0 24px ${accent}22`,
          }}
        >
          0{index}
        </span>
        <span className="text-eyebrow" style={{ color: accent }}>
          {eyebrow}
        </span>
        <span className="flex-1 h-px bg-[var(--hairline)]" />
      </div>
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight gradient-ink">
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-2xl text-sm text-ink-2">{description}</p>
      )}
    </motion.header>
  );
}
