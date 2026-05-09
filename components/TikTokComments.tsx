"use client";

import type { Persona, ProductCard, Reaction } from "@/lib/shared/types";
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

function CommentRow({
  reaction,
  all,
  personas,
  depth,
}: {
  reaction: Reaction;
  all: Reaction[];
  personas: Map<string, Persona>;
  depth: number;
}) {
  const persona = personas.get(reaction.persona_id);
  const handle = persona?.display_name ?? `user_${reaction.persona_id.slice(0, 4)}`;
  const likes = pseudoCount(reaction.id, 9);
  const replies = all
    .filter(
      (r) =>
        r.parent_id === reaction.id &&
        (r.action === "reply" || r.action === "comment") &&
        r.text
    )
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  return (
    <div
      className="animate-fade-in"
      style={{ animationDuration: "300ms" }}
    >
      <div
        className={[
          "flex items-start gap-2",
          depth > 0 ? "ml-6" : "",
        ].join(" ")}
      >
        <Avatar seed={handle} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-zinc-400">
            @{handle.replace(/^@/, "").toLowerCase()}{" "}
            <span className="text-zinc-600">· {timeAgo(reaction.created_at)}</span>
          </div>
          <p className="mt-0.5 text-sm leading-snug text-zinc-100">
            {reaction.text}
          </p>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
            <button className="hover:text-pink-400">Reply</button>
            <span>·</span>
            <span>view {pseudoCount(reaction.id + "v", 4)} replies</span>
          </div>
        </div>
        <div className="flex flex-col items-center text-zinc-500">
          <span className="text-base text-pink-500" aria-hidden>
            ♥
          </span>
          <span className="text-[10px] font-semibold tabular-nums text-zinc-400">
            {likes}
          </span>
        </div>
      </div>
      {replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((r) => (
            <CommentRow
              key={r.id}
              reaction={r}
              all={all}
              personas={personas}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TikTokComments({
  reactions,
  personas,
  product,
}: {
  reactions: Reaction[];
  personas: Persona[];
  product: ProductCard | null;
}) {
  const personaMap = new Map(personas.map((p) => [p.id, p]));
  const tops = reactions
    .filter(
      (r) =>
        r.parent_id == null &&
        (r.action === "comment" || r.action === "reply") &&
        r.text
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const totalLikes = reactions.length * 137 + 1240;
  const totalShares = Math.floor(reactions.length * 4.2) + 38;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-black text-zinc-100 shadow-sm">
      <header className="relative flex items-center justify-between border-b border-zinc-800 bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white">
            <span className="text-sm font-black">d</span>
          </div>
          <div className="text-sm font-bold uppercase tracking-wide">
            TikTok · For You
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-white/80">
          Comments
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_84px] gap-0">
        <div className="min-h-0 overflow-y-auto border-r border-zinc-800 p-3">
          <div className="mb-3 rounded-lg bg-zinc-900 p-3 text-xs text-zinc-400">
            <div className="text-[11px] uppercase tracking-wider text-pink-400">
              Now playing
            </div>
            <div className="mt-1 text-sm font-semibold text-zinc-100">
              {product?.name ?? "your launch"}
              {product?.tagline ? ` — ${product.tagline}` : ""}
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">
              #launch #buildinpublic #vibecoding
            </div>
          </div>
          {tops.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8 text-xs text-zinc-500">
              no comments yet — sound on 🔊
            </div>
          ) : (
            <div className="space-y-3">
              {tops.map((r) => (
                <CommentRow
                  key={r.id}
                  reaction={r}
                  all={reactions}
                  personas={personaMap}
                  depth={0}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="flex flex-col items-center gap-4 bg-black px-2 py-4 text-xs text-zinc-300">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-600 text-lg">
              ♥
            </div>
            <span className="mt-1 font-semibold">
              {totalLikes.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-lg">
              💬
            </div>
            <span className="mt-1 font-semibold">{tops.length}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-lg">
              ↗
            </div>
            <span className="mt-1 font-semibold">
              {totalShares.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col items-center text-cyan-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/40 text-lg">
              ♫
            </div>
            <span className="mt-1 text-[10px] uppercase tracking-wider">
              sound
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}
