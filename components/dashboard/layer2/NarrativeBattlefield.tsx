"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import type { ProductCard, Reaction } from "@/lib/shared/types";
import { battlefield } from "@/lib/dashboard/derive";

type Props = {
  product: ProductCard | null;
  reactions: Reaction[];
};

type LaidNode = {
  id: string;
  label: string;
  side: "for" | "against";
  weight: number;
  x: number; // 0..1
  y: number; // 0..1
};

const W = 760;
const H = 520;

/**
 * Constellation of competing narratives. Two opposing clusters ("for" / "against")
 * each drift gently around an anchor point, with glowing connection lines that
 * pulse based on the tension between them. Looks like an epidemic propagation
 * map crossed with a galaxy.
 */
export function NarrativeBattlefield({ product, reactions }: Props) {
  const { nodes, links } = useMemo(() => battlefield(product, reactions), [product, reactions]);

  // Position nodes around two anchor points.
  const laid = useMemo<LaidNode[]>(() => {
    const fors = nodes.filter((n) => n.side === "for");
    const againsts = nodes.filter((n) => n.side === "against");
    const arr: LaidNode[] = [];
    fors.forEach((n, i) => {
      const angle = (-Math.PI / 2) + (i / Math.max(1, fors.length - 1)) * Math.PI * 0.7 - 0.35;
      arr.push({ ...n, x: 0.28 + Math.cos(angle) * 0.18, y: 0.5 + Math.sin(angle) * 0.32 });
    });
    againsts.forEach((n, i) => {
      const angle = (Math.PI / 2) + (i / Math.max(1, againsts.length - 1)) * Math.PI * 0.7 - 0.35;
      arr.push({ ...n, x: 0.72 + Math.cos(angle) * 0.18, y: 0.5 + Math.sin(angle) * 0.32 });
    });
    return arr;
  }, [nodes]);

  // Light "drift" animation via RAF.
  const ref = useRef<HTMLDivElement | null>(null);
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setT((prev) => prev + dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const driftOf = (n: LaidNode, i: number) => {
    const dx = Math.sin(t * 0.4 + i * 1.3) * 6;
    const dy = Math.cos(t * 0.5 + i * 0.9) * 6;
    return { dx, dy };
  };

  const nodeById = new Map(laid.map((n) => [n.id, n]));

  if (laid.length === 0) {
    return (
      <div className="glass-strong rounded-3xl p-8 h-[560px] flex items-center justify-center text-center">
        <div>
          <div className="text-eyebrow-bright mb-2">narrative battlefield</div>
          <div className="text-sm text-ink-2 max-w-sm">
            Once the room forms its first opinions, the two opposing narratives will arrange
            themselves here.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="glass-strong rounded-3xl overflow-hidden relative">
      {/* Header */}
      <div className="px-5 py-4 hairline-b flex items-center gap-3 flex-wrap">
        <span className="text-eyebrow-bright">narrative battlefield</span>
        <span className="text-xs font-mono text-ink-3">competing narratives · pulled from product hooks vs friction signals</span>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--positive)" }} />
            <span className="text-ink-2">FOR</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--negative)" }} />
            <span className="text-ink-2">AGAINST</span>
          </span>
        </div>
      </div>

      <div className="relative">
        {/* SVG connection lines */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-[480px] block"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="bf-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(87,225,164,0.55)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(255,122,138,0.55)" />
            </linearGradient>
            <radialGradient id="bf-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="rgba(106,160,255,0.12)" />
              <stop offset="100%" stopColor="rgba(106,160,255,0)" />
            </radialGradient>
            <filter id="bf-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          <rect width={W} height={H} fill="url(#bf-bg)" />

          {/* Anchor labels */}
          <text
            x={W * 0.18} y={28}
            fill="var(--positive)" opacity={0.7}
            fontFamily="var(--font-mono)" fontSize="10"
            letterSpacing="3"
            textAnchor="middle"
          >
            VIRAL HOOKS
          </text>
          <text
            x={W * 0.82} y={28}
            fill="var(--negative)" opacity={0.7}
            fontFamily="var(--font-mono)" fontSize="10"
            letterSpacing="3"
            textAnchor="middle"
          >
            COUNTER-NARRATIVES
          </text>
          <line
            x1={W / 2} y1={48} x2={W / 2} y2={H - 24}
            stroke="rgba(255,255,255,0.06)" strokeDasharray="2 8"
          />

          {/* Connection lines */}
          {links.map((l, idx) => {
            const a = nodeById.get(l.from);
            const b = nodeById.get(l.to);
            if (!a || !b) return null;
            const da = driftOf(a, idx);
            const db = driftOf(b, idx + 7);
            const x1 = a.x * W + da.dx;
            const y1 = a.y * H + da.dy;
            const x2 = b.x * W + db.dx;
            const y2 = b.y * H + db.dy;
            const opacity = 0.08 + l.tension * 0.4;
            const phase = (t * 1.2 + idx * 0.7) % 1;
            return (
              <g key={`${l.from}-${l.to}`}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="url(#bf-line)" strokeWidth={1 + l.tension * 1.5}
                  opacity={opacity}
                />
                {/* Particle pulse */}
                <circle
                  cx={x1 + (x2 - x1) * phase}
                  cy={y1 + (y2 - y1) * phase}
                  r={2}
                  fill={l.tension > 0.6 ? "var(--ember)" : "var(--electric)"}
                  opacity={0.6 + l.tension * 0.3}
                  filter="url(#bf-glow)"
                />
              </g>
            );
          })}

          {/* Nodes */}
          {laid.map((n, i) => {
            const { dx, dy } = driftOf(n, i);
            const cx = n.x * W + dx;
            const cy = n.y * H + dy;
            const r = 8 + n.weight * 14;
            const color = n.side === "for" ? "var(--positive)" : "var(--negative)";
            return (
              <g key={n.id} transform={`translate(${cx}, ${cy})`}>
                <circle r={r + 12} fill={color} opacity={0.08} />
                <circle r={r + 6} fill={color} opacity={0.15} />
                <circle r={r} fill={color} opacity={0.95} />
                <circle r={r - 3} fill="rgba(0,0,0,0.55)" />
              </g>
            );
          })}
        </svg>

        {/* HTML labels positioned on top */}
        <div className="absolute inset-0 pointer-events-none">
          {laid.map((n, i) => {
            const { dx, dy } = driftOf(n, i);
            const cx = n.x * 100 + (dx / W) * 100;
            const cy = n.y * 100 + (dy / H) * 100;
            const isFor = n.side === "for";
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4 }}
                className="absolute"
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  transform: "translate(-50%, calc(-50% + 22px))",
                }}
              >
                <div
                  className="px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap max-w-[200px] truncate text-center"
                  style={{
                    background: "rgba(8,8,12,0.78)",
                    border: `1px solid ${isFor ? "rgba(87,225,164,0.4)" : "rgba(255,122,138,0.4)"}`,
                    color: "var(--ink-1)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  {n.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
