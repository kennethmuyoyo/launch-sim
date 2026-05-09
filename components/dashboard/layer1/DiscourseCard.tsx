"use client";

import { motion } from "motion/react";
import type { Persona, Reaction } from "@/lib/shared/types";

type Props = {
  reaction: Reaction;
  persona: Persona | null;
  index: number;
};

const PLATFORM_LABEL: Record<Reaction["platform"], string> = {
  reddit: "REDDIT",
  twitter: "X / TWITTER",
  tiktok: "TIKTOK",
};

const PLATFORM_GLYPH: Record<Reaction["platform"], string> = {
  reddit: "▲",
  twitter: "𝕏",
  tiktok: "♪",
};

const PLATFORM_ACCENT: Record<Reaction["platform"], string> = {
  reddit: "var(--ember)",
  twitter: "var(--electric)",
  tiktok: "var(--violet)",
};

const SENTIMENT_COLOR: Record<Reaction["sentiment"], string> = {
  positive: "var(--positive)",
  neutral: "var(--neutral)",
  negative: "var(--negative)",
  controversial: "var(--controversial)",
};

export function DiscourseCard({ reaction, persona, index }: Props) {
  const accent = PLATFORM_ACCENT[reaction.platform];
  const sentColor = SENTIMENT_COLOR[reaction.sentiment];
  const handle = persona?.display_name ?? "anon";
  const archetype = persona?.archetype ?? reaction.platform;

  const hasText = !!reaction.text;
  const isReply = reaction.action === "reply";

  // Pseudo-random metric so cards feel "alive" with engagement counts.
  const seed = (reaction.id.charCodeAt(0) || 1) * (index + 7);
  const upvotes = (seed % 740) + 12;
  const replyCount = (seed % 64) + 1;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 24, mass: 0.6 }}
      className="relative"
    >
      <div
        className="glass rounded-2xl p-4 hover:border-[var(--hairline-strong)] transition group"
        style={{ boxShadow: `0 0 0 1px ${accent}1a, 0 8px 30px -12px ${accent}33` }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold"
            style={{
              background: `${accent}1f`,
              color: accent,
              boxShadow: `inset 0 0 0 1px ${accent}33`,
            }}
          >
            {PLATFORM_GLYPH[reaction.platform]}
          </span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-semibold text-ink-1 truncate">
              {handle}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-ink-3 font-mono truncate">
              {PLATFORM_LABEL[reaction.platform]} · {archetype}
            </span>
          </div>
          <span className="ml-auto text-[10px] font-mono text-ink-3">
            r{reaction.round}
          </span>
        </div>

        {/* Body */}
        {hasText ? (
          <p className="text-[14px] leading-relaxed text-ink-1 whitespace-pre-line">
            {reaction.text}
          </p>
        ) : (
          <p className="text-[12px] uppercase tracking-widest font-mono text-ink-3">
            {reaction.action} {isReply && "↩"}
          </p>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center gap-4 text-[11px] text-ink-3 font-mono">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: sentColor, boxShadow: `0 0 6px ${sentColor}` }}
            />
            {reaction.sentiment}
          </span>

          {reaction.platform === "reddit" && (
            <>
              <span className="flex items-center gap-1"><span className="text-[var(--ember)]">▲</span> {upvotes}</span>
              <span>{replyCount} replies</span>
            </>
          )}
          {reaction.platform === "twitter" && (
            <>
              <span>{Math.floor(upvotes / 6)} qts</span>
              <span>{upvotes} ♥</span>
            </>
          )}
          {reaction.platform === "tiktok" && (
            <>
              <span>{upvotes * 3} ♥</span>
              <span>{Math.floor(upvotes / 3)} replies</span>
            </>
          )}

          {reaction.friction_points.length > 0 && (
            <span className="ml-auto truncate">
              <span className="text-ink-3">friction:</span>{" "}
              <span className="text-ink-2">{reaction.friction_points[0]}</span>
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
