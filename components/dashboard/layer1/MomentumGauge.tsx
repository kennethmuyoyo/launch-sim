"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "motion/react";

type Props = {
  /** 0..100 */
  score: number;
  loading?: boolean;
};

const SIZE = 320;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUM = 2 * Math.PI * RADIUS;

export function MomentumGauge({ score, loading }: Props) {
  // Spring the displayed score toward the target so jumps feel live.
  const spring = useSpring(0, { stiffness: 60, damping: 18, mass: 0.8 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    spring.set(score);
  }, [score, spring]);

  useEffect(() => {
    return spring.on("change", (v) => setDisplay(v));
  }, [spring]);

  const dash = useTransform(spring, (v) => `${(v / 100) * CIRCUM} ${CIRCUM}`);

  const verdict =
    display >= 80 ? "Breakout signal" :
    display >= 65 ? "Strong reception" :
    display >= 50 ? "Mixed but moving" :
    display >= 35 ? "Cool reception" :
    "Skeptical room";

  return (
    <div className="relative flex flex-col items-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="overflow-visible">
        <defs>
          <linearGradient id="mom-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--electric)" />
            <stop offset="55%" stopColor="var(--violet)" />
            <stop offset="100%" stopColor="var(--ember)" />
          </linearGradient>
          <filter id="mom-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Faint grid ticks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
          const x1 = SIZE / 2 + Math.cos(angle) * (RADIUS + 16);
          const y1 = SIZE / 2 + Math.sin(angle) * (RADIUS + 16);
          const x2 = SIZE / 2 + Math.cos(angle) * (RADIUS + 22);
          const y2 = SIZE / 2 + Math.sin(angle) * (RADIUS + 22);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          );
        })}

        {/* Background ring */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={STROKE}
          fill="none"
        />

        {/* Progress ring */}
        <motion.circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          stroke="url(#mom-grad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ strokeDasharray: dash, filter: "url(#mom-glow)" }}
        />

        {/* Inner faint disc */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS - STROKE - 4}
          fill="rgba(255,255,255,0.015)"
          stroke="rgba(255,255,255,0.04)"
        />
      </svg>

      {/* Number overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-eyebrow mb-1">launch momentum</div>
        <div className="flex items-baseline gap-1">
          <span className="text-7xl font-semibold tabular-nums tracking-tight gradient-ink">
            {Math.round(display)}
          </span>
          <span className="text-2xl font-medium text-ink-3">/100</span>
        </div>
        <div
          className="mt-2 text-xs uppercase tracking-[0.2em] font-mono"
          style={{
            color: display >= 60 ? "var(--positive)" : display >= 40 ? "var(--controversial)" : "var(--negative)",
          }}
        >
          {loading ? "calibrating…" : verdict}
        </div>
      </div>

      {/* Outer rotating accent */}
      <div
        aria-hidden
        className="absolute inset-0 spin-slow pointer-events-none"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, rgba(106,160,255,0.25) 8%, transparent 14%, transparent 100%)",
          maskImage:
            `radial-gradient(circle, transparent ${RADIUS - 1}px, black ${RADIUS}px, black ${RADIUS + 12}px, transparent ${RADIUS + 14}px)`,
          WebkitMaskImage:
            `radial-gradient(circle, transparent ${RADIUS - 1}px, black ${RADIUS}px, black ${RADIUS + 12}px, transparent ${RADIUS + 14}px)`,
        }}
      />
    </div>
  );
}
