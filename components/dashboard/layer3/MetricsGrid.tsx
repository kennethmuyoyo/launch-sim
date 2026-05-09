"use client";

import { motion } from "motion/react";
import type { MetricCell } from "@/lib/dashboard/derive";

type Props = {
  metrics: MetricCell[];
  ready?: boolean;
};

export function MetricsGrid({ metrics, ready = true }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((m, i) => (
        <MetricCard key={m.key} metric={m} ready={ready} delay={i * 0.04} />
      ))}
    </div>
  );
}

function MetricCard({
  metric,
  ready,
  delay,
}: {
  metric: MetricCell;
  ready: boolean;
  delay: number;
}) {
  const { label, value, hint, tone } = metric;
  const accent =
    tone === "good" ? "var(--positive)" :
    tone === "warn" ? "var(--controversial)" :
    tone === "bad" ? "var(--negative)" :
    "var(--electric)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay }}
      className="glass rounded-2xl p-4 inner-ring relative overflow-hidden"
      style={{ boxShadow: `0 0 0 1px ${accent}10, 0 8px 30px -16px ${accent}33` }}
    >
      <div
        aria-hidden
        className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-30 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)`, filter: "blur(20px)" }}
      />

      <div className="relative">
        <div className="text-eyebrow text-ink-3">{label}</div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-semibold tabular-nums tracking-tight gradient-ink">
            {ready ? Math.round(value) : "—"}
          </span>
          <span className="text-sm text-ink-3">/100</span>
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: ready ? `${value}%` : "0%" }}
            transition={{ duration: 0.9, delay: delay + 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
            style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
          />
        </div>

        {hint && (
          <div className="mt-2 text-[11px] text-ink-3 leading-snug">{hint}</div>
        )}
      </div>
    </motion.div>
  );
}
