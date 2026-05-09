/**
 * Live run view + final dashboard. Owner: Juno.
 *
 * Subscribes to a stream of RunEvents (SSE for real runs, in-process simulator
 * for `demo-*` ids) and renders three progressively-deeper layers:
 *
 *   01 — IMMEDIATE EMOTIONAL READ   hero gauge + narrative + waveform + live feed
 *   02 — NARRATIVE INTELLIGENCE     battlefield + archetype matrix + timeline playback
 *   03 — DEEP ANALYTICAL BREAKDOWN  metrics grid + strengths/weaknesses + summary
 */

"use client";

import { use, useMemo } from "react";
import { useRunEvents } from "@/components/hooks/useRunEvents";
import { derive, metricGrid } from "@/lib/dashboard/derive";
import { getViewExtras } from "@/lib/demo/simulator";
import { TopBar } from "@/components/dashboard/TopBar";
import { StatusTicker } from "@/components/dashboard/StatusTicker";
import { LayerHeader } from "@/components/dashboard/LayerHeader";
import { HeroPanel } from "@/components/dashboard/layer1/HeroPanel";
import { LiveDiscourseFeed } from "@/components/dashboard/layer1/LiveDiscourseFeed";
import { NarrativeBattlefield } from "@/components/dashboard/layer2/NarrativeBattlefield";
import { ArchetypeMatrix } from "@/components/dashboard/layer2/ArchetypeMatrix";
import { TimelinePlayback } from "@/components/dashboard/layer2/TimelinePlayback";
import { MetricsGrid } from "@/components/dashboard/layer3/MetricsGrid";
import { StrengthsWeaknesses } from "@/components/dashboard/layer3/StrengthsWeaknesses";

export default function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { events, url, isDemo } = useRunEvents(id);
  const state = useMemo(() => derive(events), [events]);

  // Demo mode carries some bonus presentational fields (per-metric breakdown,
  // strengths/weaknesses lists) since the strict Forecast schema doesn't
  // surface them yet. Real runs fall back to derivations from the events.
  const extras = useMemo(() => {
    if (isDemo && url) return getViewExtras(url);
    return undefined;
  }, [isDemo, url]);

  const metrics = useMemo(
    () => metricGrid(state.forecast, state.reactions, extras?.metrics),
    [state.forecast, state.reactions, extras?.metrics],
  );

  const strengths = extras?.strengths ?? [
    state.forecast?.biggest_viral_hook,
    ...(state.product?.virality_hooks ?? []),
  ].filter((x): x is string => Boolean(x));

  const weaknesses = extras?.weaknesses ?? [
    state.forecast?.biggest_weakness,
    ...(state.forecast?.ux_friction ?? []),
    ...(state.product?.risk_factors ?? []),
  ].filter((x): x is string => Boolean(x));

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        runId={id}
        url={url}
        status={state.status}
        product={state.product}
        reactionCount={state.reactions.length}
        personaCount={state.personas.length}
      />

      <StatusTicker reactions={state.reactions} />

      {state.errorMessage && (
        <div className="mx-auto max-w-[1400px] w-full px-6 mt-6">
          <div className="rounded-2xl border border-[var(--negative)]/40 bg-[rgba(255,122,138,0.06)] p-4 text-sm text-ink-1">
            <span className="font-mono text-eyebrow text-[var(--negative)]">signal lost</span>
            <div className="mt-1">{state.errorMessage}</div>
            <div className="mt-2 text-xs text-ink-3">
              Tip: try one of the pre-warmed demo runs from the home page — they bypass
              the (still-being-wired) scrape + agents pipeline.
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1400px] w-full px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-16">
        {/* Layer 1 — Immediate emotional read */}
        <section>
          <LayerHeader
            index={1}
            eyebrow="01 · immediate emotional read"
            title="The internet is forming an opinion in real time."
            description="Synthesized momentum, the one-line read of the room, and the live discourse cards as personas fire."
          />

          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
            <HeroPanel
              product={state.product}
              personas={state.personas}
              reactions={state.reactions}
              forecast={state.forecast}
            />
            <LiveDiscourseFeed
              reactions={state.reactions}
              personas={state.personas}
            />
          </div>
        </section>

        {/* Layer 2 — Narrative intelligence */}
        <section>
          <LayerHeader
            index={2}
            eyebrow="02 · narrative intelligence"
            title="Why opinions emerge — and which ones win."
            description="Watch competing narratives constellate, see how each tribe is reacting, and replay the next 10 days of discourse."
          />

          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
            <NarrativeBattlefield product={state.product} reactions={state.reactions} />
            <ArchetypeMatrix personas={state.personas} reactions={state.reactions} />
          </div>

          <div className="mt-6">
            <TimelinePlayback
              product={state.product}
              reactions={state.reactions}
              personas={state.personas}
            />
          </div>
        </section>

        {/* Layer 3 — Deep analytical breakdown */}
        <section>
          <LayerHeader
            index={3}
            eyebrow="03 · deep analytical breakdown"
            title="What to ship before launch day."
            description="The strict-numbers read on virality, trust, retention risk and the top viral hooks vs. critical weaknesses."
          />

          <MetricsGrid metrics={metrics} ready={state.reactions.length > 0 || !!state.forecast} />

          <div className="mt-6">
            <StrengthsWeaknesses
              forecast={state.forecast}
              strengths={strengths}
              weaknesses={weaknesses}
            />
          </div>

          {state.forecast && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <ReceptionCard platform="reddit" reception={state.forecast.reddit_reception} />
              <ReceptionCard platform="twitter" reception={state.forecast.twitter_reception} />
              <ReceptionCard platform="tiktok" reception={state.forecast.tiktok_reception} />
            </div>
          )}

          {state.forecast && state.forecast.predicted_hot_tweets.length > 0 && (
            <div className="mt-6 glass rounded-2xl p-6">
              <div className="text-eyebrow-bright mb-4">predicted hot tweets · screenshot bait</div>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {state.forecast.predicted_hot_tweets.map((t, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-[var(--hairline)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-ink-1 italic"
                  >
                    “{t}”
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <footer className="pt-8 pb-4 text-center text-xs font-mono text-ink-3">
          {state.status === "done"
            ? "// transmission complete — narrative analysis disguised as forecasting"
            : "// signal active — keep watching"}
        </footer>
      </main>
    </div>
  );
}

function ReceptionCard({
  platform,
  reception,
}: {
  platform: "reddit" | "twitter" | "tiktok";
  reception: "love" | "mixed" | "hate" | "ignored";
}) {
  const accent =
    platform === "reddit" ? "var(--ember)" :
    platform === "twitter" ? "var(--electric)" :
    "var(--violet)";
  const tone =
    reception === "love" ? "var(--positive)" :
    reception === "mixed" ? "var(--controversial)" :
    reception === "hate" ? "var(--negative)" :
    "var(--ink-3)";
  return (
    <div
      className="glass rounded-2xl p-5 inner-ring relative overflow-hidden"
      style={{ boxShadow: `0 0 0 1px ${accent}10` }}
    >
      <div
        aria-hidden
        className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-25 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)`, filter: "blur(20px)" }}
      />
      <div className="relative">
        <div className="text-eyebrow" style={{ color: accent }}>
          {platform} reception
        </div>
        <div className="mt-2 text-3xl font-semibold tracking-tight" style={{ color: tone }}>
          {reception === "love" ? "Loves it" :
           reception === "mixed" ? "Splits the room" :
           reception === "hate" ? "Pushes back" :
           "Ignores it"}
        </div>
      </div>
    </div>
  );
}
