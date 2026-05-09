"use client";

import { Avatar } from "./Avatar";

function pseudoCount(seed: string, base: number, variance: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return base + (Math.abs(h) % variance);
}

const FAKE_HANDLES = [
  "patio11",
  "shl",
  "levelsio",
  "naval",
  "swyx",
  "nikitabier",
  "dvassallo",
  "kentcdodds",
];

function pickHandle(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return FAKE_HANDLES[Math.abs(h) % FAKE_HANDLES.length];
}

export function HotTweets({ tweets }: { tweets: string[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-black text-zinc-100">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
        <div className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          Predicted hot tweets
        </div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
          if this launches
        </div>
      </div>

      {tweets.length === 0 ? (
        <div className="px-5 py-6 text-sm text-zinc-500">
          No breakout tweets predicted.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {tweets.map((t, i) => {
            const handle = pickHandle(t + i);
            const likes = pseudoCount(t, 240, 4800);
            const retweets = pseudoCount(t + "rt", 30, 600);
            const replies = pseudoCount(t + "r", 12, 200);
            return (
              <li key={i} className="flex gap-3 px-5 py-3">
                <Avatar seed={handle} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-bold text-zinc-100">{handle}</span>
                    <span className="text-zinc-500">@{handle}</span>
                    <span className="text-zinc-500">· 1h</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[15px] leading-snug text-zinc-100">
                    {t}
                  </p>
                  <div className="mt-2 flex max-w-md items-center justify-between text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden>💬</span> {replies}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden>🔁</span>{" "}
                      {retweets.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden>♥</span> {likes.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden>↗</span>
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
