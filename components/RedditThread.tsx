"use client";

import type { Persona, ProductCard, Reaction } from "@/lib/shared/types";
import { Avatar } from "./Avatar";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "just now";
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function pickSubreddit(product: ProductCard | null): string {
  if (!product) return "r/launches";
  const cat = (product.category ?? "").toLowerCase();
  if (cat.includes("ai")) return "r/SideProject";
  if (cat.includes("game")) return "r/IndieDev";
  if (cat.includes("dev") || cat.includes("saas")) return "r/SaaS";
  if (cat.includes("design")) return "r/Design";
  if (cat.includes("study") || cat.includes("learn")) return "r/GetStudying";
  return "r/SideProject";
}

function scoreFor(target: Reaction, all: Reaction[]): number {
  let s = 1;
  for (const r of all) {
    if (r.parent_id !== target.id) continue;
    if (r.action === "upvote") s += 1;
    else if (r.action === "downvote") s -= 1;
  }
  return s;
}

function sentimentBadge(s: Reaction["sentiment"]): {
  label: string;
  cls: string;
} {
  switch (s) {
    case "positive":
      return { label: "+", cls: "bg-emerald-100 text-emerald-700" };
    case "negative":
      return { label: "−", cls: "bg-rose-100 text-rose-700" };
    case "controversial":
      return { label: "⚡", cls: "bg-amber-100 text-amber-700" };
    default:
      return { label: "·", cls: "bg-zinc-100 text-zinc-600" };
  }
}

function CommentNode({
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
  const handle = persona?.display_name ?? `u/anon_${reaction.persona_id.slice(0, 4)}`;
  const score = scoreFor(reaction, all);
  const replies = all
    .filter(
      (r) =>
        r.parent_id === reaction.id &&
        (r.action === "reply" || r.action === "comment") &&
        r.text
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  const sb = sentimentBadge(reaction.sentiment);

  return (
    <div
      className="animate-fade-in"
      style={{ animationDuration: "300ms" }}
    >
      <div
        className={[
          "flex gap-2",
          depth > 0
            ? "ml-3 border-l border-zinc-200 pl-3 dark:border-zinc-800"
            : "",
        ].join(" ")}
      >
        <Avatar seed={handle} size="xs" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              u/{handle.replace(/^@/, "")}
            </span>
            <span>· {score} pts</span>
            <span>· {timeAgo(reaction.created_at)}</span>
            <span
              className={[
                "ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                sb.cls,
              ].join(" ")}
              title={reaction.sentiment}
            >
              {sb.label}
            </span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap text-sm leading-snug text-zinc-800 dark:text-zinc-100">
            {reaction.text}
          </p>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
            <button className="hover:text-zinc-800 dark:hover:text-zinc-200">
              Reply
            </button>
            <button className="hover:text-zinc-800 dark:hover:text-zinc-200">
              Share
            </button>
          </div>
        </div>
      </div>
      {replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((r) => (
            <CommentNode
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

export function RedditThread({
  reactions,
  personas,
  product,
}: {
  reactions: Reaction[];
  personas: Persona[];
  product: ProductCard | null;
}) {
  const personaMap = new Map(personas.map((p) => [p.id, p]));
  const sub = pickSubreddit(product);

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

  const opUpvotes = reactions.filter((r) => r.action === "upvote" && r.parent_id == null).length;
  const opDownvotes = reactions.filter((r) => r.action === "downvote" && r.parent_id == null).length;
  const opScore = 1 + opUpvotes - opDownvotes;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex items-center gap-2 border-b border-zinc-200 bg-orange-500 px-3 py-2 text-white dark:border-zinc-800">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-orange-600">
          <span className="text-sm font-black">r</span>
        </div>
        <div className="text-sm font-semibold">{sub}</div>
        <span className="ml-auto rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
          Hot
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <article className="flex gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex w-8 flex-col items-center text-zinc-500">
            <button
              className="text-zinc-400 hover:text-orange-500"
              aria-label="upvote"
            >
              ▲
            </button>
            <span className="text-xs font-bold text-orange-500">{opScore}</span>
            <button
              className="text-zinc-400 hover:text-blue-500"
              aria-label="downvote"
            >
              ▼
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-zinc-500">
              Posted by{" "}
              <span className="text-zinc-700 dark:text-zinc-300">u/launch_bot</span>{" "}
              · just now
            </div>
            <h3 className="mt-1 text-base font-semibold leading-snug">
              {product
                ? `Just shipped: ${product.name}${
                    product.tagline ? ` — ${product.tagline}` : ""
                  }`
                : "Just shipped a thing — what do you think?"}
            </h3>
            {product?.url && (
              <a
                href={product.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block truncate text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                {product.url}
              </a>
            )}
          </div>
        </article>

        {tops.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8 text-xs text-zinc-400">
            no comments yet — sub is loading…
          </div>
        ) : (
          <div className="space-y-3">
            {tops.map((r) => (
              <CommentNode
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
    </section>
  );
}
