"use client";

import type { Persona, Reaction } from "@/lib/shared/types";
import { Avatar } from "./Avatar";

const PLATFORM_META: Record<
  Reaction["platform"],
  { label: string; tag: string; cls: string }
> = {
  reddit: {
    label: "Reddit",
    tag: "r/",
    cls: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  twitter: {
    label: "Twitter / X",
    tag: "@",
    cls: "bg-zinc-900/10 text-zinc-700 dark:bg-zinc-100/10 dark:text-zinc-200",
  },
  tiktok: {
    label: "TikTok",
    tag: "@",
    cls: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
};

const SENTIMENT_TAG: Record<Reaction["sentiment"], string> = {
  positive: "🟢 positive",
  neutral: "⚪ neutral",
  negative: "🔴 negative",
  controversial: "🟡 controversial",
};

export function TopComments({
  comments,
  personas,
}: {
  comments: Reaction[];
  personas: Persona[];
}) {
  const personaMap = new Map(personas.map((p) => [p.id, p]));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Top comments
        </div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-400">
          verbatim
        </div>
      </div>

      <ul className="mt-3 space-y-3">
        {comments.length === 0 && (
          <li className="text-sm text-zinc-500">No standout comments yet.</li>
        )}
        {comments.map((c) => {
          const persona = personaMap.get(c.persona_id);
          const handle = persona?.display_name ?? `anon_${c.persona_id.slice(0, 4)}`;
          const meta = PLATFORM_META[c.platform];
          return (
            <li
              key={c.id}
              className="flex gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <Avatar seed={handle} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      meta.cls,
                    ].join(" ")}
                  >
                    {meta.label}
                  </span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {meta.tag}
                    {handle.replace(/^@/, "")}
                  </span>
                  <span className="ml-auto text-[10px] text-zinc-500">
                    {SENTIMENT_TAG[c.sentiment]}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-snug text-zinc-800 dark:text-zinc-100">
                  “{c.text}”
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
