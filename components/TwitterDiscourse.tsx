"use client";

import type { Persona, Reaction } from "@/lib/shared/types";
import { Avatar } from "./Avatar";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "now";
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function pseudoCount(seed: string, base: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return base + (Math.abs(h) % base);
}

function sentimentColor(s: Reaction["sentiment"]): string {
  switch (s) {
    case "positive":
      return "text-emerald-400";
    case "negative":
      return "text-rose-400";
    case "controversial":
      return "text-amber-400";
    default:
      return "text-zinc-400";
  }
}

function TweetRow({
  reaction,
  personas,
  parent,
  parentPersona,
}: {
  reaction: Reaction;
  personas: Map<string, Persona>;
  parent: Reaction | null;
  parentPersona: Persona | null;
}) {
  const persona = personas.get(reaction.persona_id);
  const handle = persona?.display_name ?? `anon_${reaction.persona_id.slice(0, 4)}`;
  const archetype = persona?.archetype ?? "internet citizen";
  const replies = pseudoCount(reaction.id + "r", 2);
  const retweets = pseudoCount(reaction.id + "rt", 5);
  const likes = pseudoCount(reaction.id + "l", 12);
  const isQuote = reaction.action === "share" && parent;
  const isReply = (reaction.action === "reply" || reaction.action === "comment") && parent;

  return (
    <article
      className="animate-fade-in flex gap-3 border-b border-zinc-800 px-4 py-3 transition-colors hover:bg-white/5"
      style={{ animationDuration: "300ms" }}
    >
      <Avatar seed={handle} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 text-sm text-zinc-400">
          <span className="font-bold text-zinc-100">
            {handle.replace(/^@/, "")}
          </span>
          <span className="text-zinc-500">@{handle.replace(/^@/, "").toLowerCase()}</span>
          <span>·</span>
          <span>{timeAgo(reaction.created_at)}</span>
          <span
            className={[
              "ml-auto text-[10px] uppercase tracking-wider",
              sentimentColor(reaction.sentiment),
            ].join(" ")}
            title={reaction.sentiment}
          >
            {reaction.sentiment}
          </span>
        </div>
        <div className="mt-0.5 text-[11px] text-zinc-500 italic">{archetype}</div>

        {isReply && parentPersona && (
          <div className="mt-1 text-xs text-zinc-500">
            Replying to{" "}
            <span className="text-sky-400">
              @{parentPersona.display_name.replace(/^@/, "").toLowerCase()}
            </span>
          </div>
        )}

        {reaction.text && (
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-snug text-zinc-100">
            {reaction.text}
          </p>
        )}

        {isQuote && parent && parent.text && parentPersona && (
          <div className="mt-2 rounded-2xl border border-zinc-700 p-3 text-sm text-zinc-300">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Avatar seed={parentPersona.display_name} size="xs" />
              <span className="font-bold text-zinc-200">
                {parentPersona.display_name.replace(/^@/, "")}
              </span>
              <span>
                @{parentPersona.display_name.replace(/^@/, "").toLowerCase()}
              </span>
            </div>
            <p className="mt-1 line-clamp-3 text-[13px] text-zinc-300">
              {parent.text}
            </p>
          </div>
        )}

        <div className="mt-2 flex max-w-md items-center justify-between text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1 hover:text-sky-400">
            <span aria-hidden>💬</span> {replies}
          </span>
          <span className="inline-flex items-center gap-1 hover:text-emerald-400">
            <span aria-hidden>🔁</span> {retweets}
          </span>
          <span className="inline-flex items-center gap-1 hover:text-rose-400">
            <span aria-hidden>♥</span> {likes}
          </span>
          <span className="inline-flex items-center gap-1 hover:text-zinc-200">
            <span aria-hidden>↗</span>
          </span>
        </div>
      </div>
    </article>
  );
}

export function TwitterDiscourse({
  reactions,
  personas,
}: {
  reactions: Reaction[];
  personas: Persona[];
}) {
  const personaMap = new Map(personas.map((p) => [p.id, p]));
  const reactionMap = new Map(reactions.map((r) => [r.id, r]));

  const visible = reactions
    .filter(
      (r) =>
        r.text &&
        (r.action === "comment" || r.action === "reply" || r.action === "share")
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-black text-zinc-100 shadow-sm">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-black">
            <span className="text-sm font-black">𝕏</span>
          </div>
          <div className="text-sm font-semibold">For you</div>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
          live discourse
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8 text-xs text-zinc-500">
            timeline is quiet… for now.
          </div>
        ) : (
          visible.map((r) => {
            const parent = r.parent_id ? reactionMap.get(r.parent_id) ?? null : null;
            const parentPersona = parent
              ? personaMap.get(parent.persona_id) ?? null
              : null;
            return (
              <TweetRow
                key={r.id}
                reaction={r}
                personas={personaMap}
                parent={parent}
                parentPersona={parentPersona}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
