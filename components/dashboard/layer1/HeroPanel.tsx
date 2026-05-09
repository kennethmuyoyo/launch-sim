"use client";

import { motion } from "motion/react";
import type { Forecast, Persona, ProductCard, Reaction } from "@/lib/shared/types";
import { liveMomentum, primaryNarrative, sentimentSeries } from "@/lib/dashboard/derive";
import { MomentumGauge } from "./MomentumGauge";
import { PrimaryNarrative } from "./PrimaryNarrative";
import { SentimentWaveform } from "./SentimentWaveform";

type Props = {
  product: ProductCard | null;
  personas: Persona[];
  reactions: Reaction[];
  forecast: Forecast | null;
};

/**
 * Hero panel — single vertical composition.
 *
 * Header → big gauge → narrative (full width) → sentiment legend + stats →
 * sentiment waveform. Vertical stack so the panel reads cleanly at any
 * width, including when it shares the row with the live discourse feed.
 */
export function HeroPanel({ product, personas, reactions, forecast }: Props) {
  const momentum = liveMomentum(reactions, forecast);
  const narrative = primaryNarrative(reactions, forecast, product);
  const series = sentimentSeries(reactions);
  const lastSeries = series[series.length - 1];
  const counts = lastSeries
    ? { pos: lastSeries.pos, neu: lastSeries.neu, neg: lastSeries.neg, ctrl: lastSeries.ctrl }
    : { pos: 0, neu: 0, neg: 0, ctrl: 0 };
  const total = counts.pos + counts.neu + counts.neg + counts.ctrl;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden glass-strong rounded-3xl"
    >
      <div className="absolute inset-0 noise pointer-events-none" aria-hidden />
      <div
        aria-hidden
        className="absolute -inset-x-12 -top-32 h-64 opacity-50 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(106,160,255,0.35), transparent 70%)",
        }}
      />

      <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:p-10">
        {/* Header strip */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="live-dot" />
          <span className="text-eyebrow-bright">internet reception · live</span>
          <span className="text-eyebrow text-ink-3 ml-1 truncate max-w-[40ch]">
            {product?.name ? `→ ${product.name}` : "→ awaiting target"}
          </span>
          <span className="ml-auto text-eyebrow text-ink-3">
            launch momentum
          </span>
        </div>

        {/* Big momentum gauge — centered focal point */}
        <div className="flex justify-center">
          <MomentumGauge score={momentum} loading={!forecast && reactions.length < 2} />
        </div>

        {/* Stats row — sits beneath the gauge */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-[520px] mx-auto w-full text-center">
          <Stat
            label="virality"
            value={
              forecast?.virality_potential ??
              Math.round((counts.pos / Math.max(1, total)) * 100)
            }
            suffix="%"
          />
          <Stat label="reach" value={personas.length} suffix=" personas" mono />
          <Stat label="signals" value={reactions.length} suffix="" mono />
        </div>

        <div className="h-px bg-[var(--hairline)]" />

        {/* Primary narrative — full panel width */}
        <PrimaryNarrative text={narrative} active={!forecast} />

        {/* Sentiment legend */}
        <SentimentLegend counts={counts} />

        {/* Waveform — full width at the bottom */}
        <div>
          <div className="text-eyebrow mb-2">sentiment activity</div>
          <SentimentWaveform series={series} height={140} />
        </div>
      </div>
    </motion.section>
  );
}

function Stat({
  label,
  value,
  suffix,
  mono,
}: {
  label: string;
  value: number;
  suffix: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className={`text-2xl font-semibold tracking-tight gradient-ink ${mono ? "font-mono" : ""}`}>
        {value}
        <span className="text-ink-3 text-sm font-normal">{suffix}</span>
      </div>
      <div className="mt-1 text-eyebrow">{label}</div>
    </div>
  );
}

function SentimentLegend({
  counts,
}: {
  counts: { pos: number; neu: number; neg: number; ctrl: number };
}) {
  const total = counts.pos + counts.neu + counts.neg + counts.ctrl;
  const items = [
    { key: "pos", label: "positive", count: counts.pos, color: "var(--positive)" },
    { key: "ctrl", label: "controversial", count: counts.ctrl, color: "var(--controversial)" },
    { key: "neu", label: "neutral", count: counts.neu, color: "var(--neutral)" },
    { key: "neg", label: "negative", count: counts.neg, color: "var(--negative)" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
      {items.map((it) => {
        const pct = total ? Math.round((it.count / total) * 100) : 0;
        return (
          <div key={it.key} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: it.color, boxShadow: `0 0 8px ${it.color}66` }}
            />
            <span className="text-ink-2">{it.label}</span>
            <span className="font-mono text-ink-1 tabular-nums">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}
