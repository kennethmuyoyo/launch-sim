"use client";

import { useEffect, useMemo, useRef } from "react";
import type { SentimentPoint } from "@/lib/dashboard/derive";

type Props = {
  series: SentimentPoint[];
  width?: number;
  height?: number;
};

/**
 * Live sentiment waveform — three flowing lines (positive / negative / momentum)
 * over a faint baseline grid. SVG-only; recomputes only when the series grows.
 *
 * When the series is empty we draw an idle pulse so the panel never looks dead.
 */
export function SentimentWaveform({ series, width = 760, height = 180 }: Props) {
  const idleRef = useRef<SVGSVGElement | null>(null);

  // Idle pulse driven by RAF when nothing has come in yet.
  useEffect(() => {
    if (series.length > 0) return;
    let raf = 0;
    const start = performance.now();
    const path = idleRef.current?.querySelector<SVGPathElement>("[data-idle-path]");
    if (!path) return;
    const tick = (t: number) => {
      const elapsed = (t - start) / 1000;
      const points: string[] = [];
      const N = 80;
      for (let i = 0; i < N; i++) {
        const x = (i / (N - 1)) * width;
        const y =
          height / 2 +
          Math.sin(i * 0.35 + elapsed * 1.6) * 6 +
          Math.sin(i * 0.13 + elapsed * 0.7) * 8;
        points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      path.setAttribute("d", points.join(" "));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [series.length, width, height]);

  const paths = useMemo(() => {
    if (series.length === 0) return null;
    const N = series.length;
    const last = series[N - 1];
    const total = last.pos + last.neu + last.neg + last.ctrl || 1;

    const xAt = (i: number) => (N === 1 ? width / 2 : (i / (N - 1)) * width);

    // Smoothed line — uses a ratio-of-running-totals so the curves stay bounded.
    const buildPath = (pick: (p: SentimentPoint) => number, baseY: number, amp: number) => {
      const pts = series.map((p, i) => {
        const denom = (p.pos + p.neu + p.neg + p.ctrl) || 1;
        const ratio = pick(p) / denom;
        const x = xAt(i);
        const y = baseY - ratio * amp;
        return [x, y] as const;
      });
      return smoothPath(pts);
    };

    const momentumPath = (() => {
      const pts = series.map((p, i) => {
        const x = xAt(i);
        const y = height - (p.momentum / 100) * (height - 16) - 8;
        return [x, y] as const;
      });
      return smoothPath(pts);
    })();

    return {
      total,
      pos: buildPath((p) => p.pos, height * 0.78, height * 0.65),
      neg: buildPath((p) => p.neg, height * 0.78, height * 0.65),
      momentum: momentumPath,
    };
  }, [series, width, height]);

  return (
    <div className="relative w-full" style={{ aspectRatio: `${width} / ${height}` }}>
      <svg
        ref={idleRef}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="wave-pos" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(87,225,164,0.45)" />
            <stop offset="100%" stopColor="rgba(87,225,164,0)" />
          </linearGradient>
          <linearGradient id="wave-neg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,122,138,0.40)" />
            <stop offset="100%" stopColor="rgba(255,122,138,0)" />
          </linearGradient>
          <linearGradient id="wave-mom" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--electric)" />
            <stop offset="50%" stopColor="var(--violet)" />
            <stop offset="100%" stopColor="var(--ember)" />
          </linearGradient>
        </defs>

        {/* baseline grid */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={0}
            x2={width}
            y1={height * t}
            y2={height * t}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="2 6"
          />
        ))}

        {paths ? (
          <>
            {/* Positive area */}
            <path
              d={`${paths.pos} L ${width} ${height} L 0 ${height} Z`}
              fill="url(#wave-pos)"
            />
            <path d={paths.pos} stroke="var(--positive)" strokeWidth="1.5" fill="none" />

            {/* Negative area (mirrored visually as a darker undertow) */}
            <path
              d={`${paths.neg} L ${width} ${height} L 0 ${height} Z`}
              fill="url(#wave-neg)"
              opacity={0.7}
            />
            <path d={paths.neg} stroke="var(--negative)" strokeWidth="1.2" fill="none" opacity={0.85} />

            {/* Momentum line */}
            <path
              d={paths.momentum}
              stroke="url(#wave-mom)"
              strokeWidth="2.2"
              fill="none"
              filter="drop-shadow(0 0 6px rgba(106,160,255,0.6))"
            />
          </>
        ) : (
          <path
            data-idle-path
            stroke="var(--electric)"
            strokeWidth="1.5"
            fill="none"
            opacity={0.6}
            filter="drop-shadow(0 0 6px rgba(106,160,255,0.4))"
          />
        )}
      </svg>
    </div>
  );
}

function smoothPath(points: ReadonlyArray<readonly [number, number]>): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const [x, y] = points[0];
    return `M ${x} ${y}`;
  }
  const out: string[] = [`M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    out.push(`Q ${x0.toFixed(1)} ${y0.toFixed(1)} ${cx.toFixed(1)} ${((y0 + y1) / 2).toFixed(1)}`);
  }
  const last = points[points.length - 1];
  out.push(`T ${last[0].toFixed(1)} ${last[1].toFixed(1)}`);
  return out.join(" ");
}
