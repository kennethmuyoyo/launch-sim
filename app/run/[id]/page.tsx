/**
 * Live run view. Owner: Juno.
 *
 * 1. Hydrate state from GET /api/run/:id snapshot (404 -> error UI).
 * 2. Open SSE stream and merge replay/live RunEvents (idempotent for reactions).
 * 3. Render three-platform discourse until a Forecast arrives, then swap to
 *    a forecast dashboard while keeping discourse below as a scrollable strip.
 */

"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type {
  Forecast,
  Persona,
  ProductCard,
  Reaction,
  RunEvent,
  RunStatus,
} from "@/lib/shared/types";

import { StatusPill } from "@/components/StatusPill";
import { ProductCardSummary } from "@/components/ProductCardSummary";
import { RedditThread } from "@/components/RedditThread";
import { TwitterDiscourse } from "@/components/TwitterDiscourse";
import { TikTokComments } from "@/components/TikTokComments";
import { LaunchScoreGauge } from "@/components/LaunchScoreGauge";
import { ViralityMeter } from "@/components/ViralityMeter";
import { SentimentBars } from "@/components/SentimentBars";
import { TopComments } from "@/components/TopComments";
import { HotTweets } from "@/components/HotTweets";
import { WeaknessCard } from "@/components/WeaknessCard";
import { ViralHookCard } from "@/components/ViralHookCard";
import { UXFrictionList } from "@/components/UXFrictionList";

type Snapshot = {
  id: string;
  url: string;
  status: RunStatus;
  product: ProductCard | null;
  personas: Persona[];
  forecast: Forecast | null;
  error: string | null;
  eventCount: number;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "not_found" }
  | { kind: "fetch_error"; message: string };

export default function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [load, setLoad] = useState<LoadState>({ kind: "loading" });
  const [status, setStatus] = useState<RunStatus>("queued");
  const [product, setProduct] = useState<ProductCard | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track which reactions we've already absorbed so SSE replay is idempotent.
  const reactionIds = useRef<Set<string>>(new Set());

  function applyEvent(e: RunEvent) {
    switch (e.type) {
      case "status":
        setStatus(e.status);
        break;
      case "product_card":
        setProduct(e.product);
        break;
      case "personas":
        setPersonas((prev) => {
          if (prev.length >= e.personas.length) return prev;
          return e.personas;
        });
        break;
      case "reaction": {
        const r = e.reaction;
        if (reactionIds.current.has(r.id)) return;
        reactionIds.current.add(r.id);
        setReactions((prev) => [...prev, r]);
        break;
      }
      case "forecast":
        setForecast(e.forecast);
        break;
      case "error":
        setError(e.message);
        setStatus("error");
        break;
    }
  }

  // Hydrate from snapshot, then open the SSE stream.
  useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;

    (async () => {
      try {
        const res = await fetch(`/api/run/${id}`, { cache: "no-store" });
        if (cancelled) return;

        if (res.status === 404) {
          setLoad({ kind: "not_found" });
          return;
        }
        if (!res.ok) {
          setLoad({
            kind: "fetch_error",
            message: `Snapshot failed (HTTP ${res.status}).`,
          });
          return;
        }

        const snap = (await res.json()) as Snapshot;
        if (cancelled) return;

        setStatus(snap.status);
        setProduct(snap.product);
        setPersonas(snap.personas ?? []);
        setForecast(snap.forecast);
        setError(snap.error);
        setLoad({ kind: "ready" });

        es = new EventSource(`/api/run/${id}/stream`);
        es.onmessage = (msg) => {
          try {
            const event = JSON.parse(msg.data) as RunEvent;
            applyEvent(event);
          } catch {
            // ignore malformed SSE payloads
          }
        };
        es.onerror = () => {
          es?.close();
        };
      } catch (err) {
        if (cancelled) return;
        setLoad({
          kind: "fetch_error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    })();

    return () => {
      cancelled = true;
      es?.close();
    };
  }, [id]);

  const redditReactions = useMemo(
    () => reactions.filter((r) => r.platform === "reddit"),
    [reactions]
  );
  const twitterReactions = useMemo(
    () => reactions.filter((r) => r.platform === "twitter"),
    [reactions]
  );
  const tiktokReactions = useMemo(
    () => reactions.filter((r) => r.platform === "tiktok"),
    [reactions]
  );

  if (load.kind === "loading") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-zinc-500">
        Loading run {id.slice(0, 8)}…
      </main>
    );
  }

  if (load.kind === "not_found") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/60 dark:bg-rose-950/40">
          <h1 className="text-lg font-semibold text-rose-700 dark:text-rose-300">
            Run not found
          </h1>
          <p className="mt-2 text-sm text-rose-700/80 dark:text-rose-300/80">
            We couldn&rsquo;t find a simulation with id{" "}
            <code className="font-mono">{id.slice(0, 12)}</code>. It may have
            expired (runs live in memory).
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            Start a new run
          </Link>
        </div>
      </main>
    );
  }

  if (load.kind === "fetch_error") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/60 dark:bg-amber-950/40">
          <h1 className="text-lg font-semibold text-amber-800 dark:text-amber-300">
            Couldn&rsquo;t hydrate run
          </h1>
          <p className="mt-2 text-sm text-amber-800/80 dark:text-amber-300/80">
            {load.message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={status} />
            <span className="font-mono text-[11px] text-zinc-500">
              run · {id.slice(0, 8)}
            </span>
            <span className="text-[11px] text-zinc-500">
              {reactions.length} reactions · {personas.length} personas
            </span>
          </div>
          {product && (
            <div className="mt-2">
              <h1 className="truncate text-xl font-semibold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                {product.name}
              </h1>
              {product.tagline && (
                <p className="text-sm text-zinc-500">{product.tagline}</p>
              )}
            </div>
          )}
        </div>
        <Link
          href="/"
          className="self-start rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          ← New simulation
        </Link>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          <div className="font-semibold">Simulation error</div>
          <div className="mt-1 whitespace-pre-wrap font-mono text-xs">
            {error}
          </div>
        </div>
      )}

      {product && <ProductCardSummary product={product} />}

      {forecast ? (
        <ForecastDashboard
          forecast={forecast}
          personas={personas}
          redditReactions={redditReactions}
          twitterReactions={twitterReactions}
          tiktokReactions={tiktokReactions}
          product={product}
        />
      ) : (
        <DiscourseGrid
          height="discourse"
          personas={personas}
          product={product}
          redditReactions={redditReactions}
          twitterReactions={twitterReactions}
          tiktokReactions={tiktokReactions}
        />
      )}
    </main>
  );
}

function DiscourseGrid({
  height,
  personas,
  product,
  redditReactions,
  twitterReactions,
  tiktokReactions,
}: {
  height: "discourse" | "strip";
  personas: Persona[];
  product: ProductCard | null;
  redditReactions: Reaction[];
  twitterReactions: Reaction[];
  tiktokReactions: Reaction[];
}) {
  const heightClass =
    height === "discourse"
      ? "min-h-[520px] lg:h-[calc(100vh-260px)]"
      : "h-[420px]";
  return (
    <div
      className={[
        "animate-fade-in grid grid-cols-1 gap-4 transition-all duration-300 lg:grid-cols-3",
        heightClass,
      ].join(" ")}
    >
      <div className="min-h-0">
        <RedditThread
          reactions={redditReactions}
          personas={personas}
          product={product}
        />
      </div>
      <div className="min-h-0">
        <TwitterDiscourse
          reactions={twitterReactions}
          personas={personas}
        />
      </div>
      <div className="min-h-0">
        <TikTokComments
          reactions={tiktokReactions}
          personas={personas}
          product={product}
        />
      </div>
    </div>
  );
}

function ForecastDashboard({
  forecast,
  personas,
  redditReactions,
  twitterReactions,
  tiktokReactions,
  product,
}: {
  forecast: Forecast;
  personas: Persona[];
  redditReactions: Reaction[];
  twitterReactions: Reaction[];
  tiktokReactions: Reaction[];
  product: ProductCard | null;
}) {
  return (
    <div className="animate-pop-in flex flex-col gap-6 transition-all duration-300">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <LaunchScoreGauge score={forecast.launch_score} />
        <div className="flex flex-col gap-4">
          <ViralityMeter value={forecast.virality_potential} />
          <ReceptionStrip forecast={forecast} />
        </div>
        <SentimentBars breakdown={forecast.sentiment_breakdown} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ViralHookCard hook={forecast.biggest_viral_hook} />
        <WeaknessCard weakness={forecast.biggest_weakness} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <NarrativeCard
            narrative={forecast.narrative}
            audience={forecast.most_likely_audience}
          />
          <TopComments
            comments={forecast.top_comments}
            personas={personas}
          />
        </div>
        <div className="flex flex-col gap-4">
          <UXFrictionList items={forecast.ux_friction} />
          <HotTweets tweets={forecast.predicted_hot_tweets} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Discourse archive
          </h2>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">
            scroll each panel
          </span>
        </div>
        <DiscourseGrid
          height="strip"
          personas={personas}
          product={product}
          redditReactions={redditReactions}
          twitterReactions={twitterReactions}
          tiktokReactions={tiktokReactions}
        />
      </section>
    </div>
  );
}

function NarrativeCard({
  narrative,
  audience,
}: {
  narrative: string;
  audience: string[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        The story
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
        {narrative}
      </p>
      {audience.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">
            Most likely audience
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {audience.map((a) => (
              <span
                key={a}
                className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const RECEPTION_META: Record<
  Forecast["reddit_reception"],
  { label: string; cls: string }
> = {
  love: {
    label: "loved",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  mixed: {
    label: "mixed",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  },
  hate: {
    label: "roasted",
    cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  },
  ignored: {
    label: "ignored",
    cls: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
};

function ReceptionStrip({ forecast }: { forecast: Forecast }) {
  const rows: Array<{
    name: string;
    value: Forecast["reddit_reception"];
  }> = [
    { name: "Reddit", value: forecast.reddit_reception },
    { name: "Twitter / X", value: forecast.twitter_reception },
    { name: "TikTok", value: forecast.tiktok_reception },
  ];
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Per-platform reception
      </div>
      <ul className="mt-2 space-y-1.5">
        {rows.map((row) => {
          const meta = RECEPTION_META[row.value];
          return (
            <li
              key={row.name}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-zinc-700 dark:text-zinc-300">{row.name}</span>
              <span
                className={[
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                  meta.cls,
                ].join(" ")}
              >
                {meta.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
