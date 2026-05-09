"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { AmbientField } from "@/components/landing/AmbientField";

const DEMO_URLS = [
  { label: "DemoFlow", url: "https://demoflow.app", note: "clean winner" },
  { label: "Substack-clone", url: "https://yet-another-newsletter.app", note: "confusing positioning" },
  { label: "AI girlfriend", url: "https://lonely-as-a-service.app", note: "polarizing" },
];

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startDemoRun(targetUrl: string) {
    if (typeof window === "undefined") return;
    const id = `demo-${Math.random().toString(36).slice(2, 10)}`;
    try {
      sessionStorage.setItem(
        `run:${id}`,
        JSON.stringify({ url: targetUrl, startedAt: Date.now() }),
      );
    } catch {}
    router.push(`/run/${id}`);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    setSubmitting(true);
    setError(null);
    // Backend (scrape + agents) is still being wired up by Ken/John — for the
    // demo, every run goes through the client-side simulator.
    startDemoRun(url.trim());
  }

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-24 overflow-hidden">
      <AmbientField />

      <div className="relative w-full max-w-3xl">
        {/* Eyebrow row */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 text-eyebrow"
        >
          <span className="live-dot" />
          <span>signal · cultural forecasting terminal</span>
          <span className="text-ink-3">v0.1</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.05 }}
          className="mt-6 text-5xl sm:text-6xl md:text-[76px] font-semibold tracking-tight leading-[1.02] gradient-ink"
        >
          We simulated the internet
          <br />
          reacting to your <span className="gradient-electric">launch.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mt-6 max-w-2xl text-lg text-ink-2"
        >
          Paste your landing page. We spin up a swarm of internet personas — Reddit indie
          hackers, design Twitter, TikTok creators, AI VCs — and replay the next 10 days
          of discourse before you ship.
        </motion.p>

        {/* Input */}
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-10 group relative"
        >
          <div className="glass-strong inner-ring rounded-2xl p-2 flex items-center gap-2">
            <span className="font-mono text-xs text-ink-3 pl-3 pr-1">{">"}</span>
            <input
              type="url"
              required
              placeholder="https://your-app.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={submitting}
              className="flex-1 bg-transparent px-2 py-3 text-base sm:text-lg text-ink-0 placeholder:text-ink-3 focus:outline-none font-mono"
            />
            <button
              type="submit"
              disabled={submitting || !url}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--electric-soft)] hover:text-black"
            >
              {submitting ? "Initializing…" : "Run simulation →"}
            </button>
          </div>

          {error && (
            <p className="mt-3 px-2 text-sm text-[var(--negative)]">{error}</p>
          )}
        </motion.form>

        {/* Demo chips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mt-6 flex flex-wrap items-center gap-2"
        >
          <span className="text-eyebrow mr-1">try a demo →</span>
          {DEMO_URLS.map((d) => (
            <button
              key={d.url}
              onClick={() => startDemoRun(d.url)}
              className="group inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1.5 text-xs text-ink-1 backdrop-blur transition hover:border-[var(--electric)]/40 hover:text-ink-0"
            >
              <span className="font-mono text-ink-3 group-hover:text-electric">●</span>
              <span className="font-medium">{d.label}</span>
              <span className="text-ink-3">·</span>
              <span className="text-ink-3">{d.note}</span>
            </button>
          ))}
        </motion.div>

        {/* Capability strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            ["30+", "personas spawned"],
            ["3", "platforms simulated"],
            ["10 days", "of discourse replay"],
            ["1 link", "to launch the room"],
          ].map(([n, label]) => (
            <div
              key={label}
              className="glass rounded-xl px-4 py-3"
            >
              <div className="text-2xl font-semibold tracking-tight gradient-ink">{n}</div>
              <div className="mt-1 text-eyebrow">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Footer note */}
        <p className="mt-12 text-xs text-ink-3 font-mono">
          {"// narrative analysis disguised as forecasting · not a prediction"}
        </p>
      </div>
    </main>
  );
}
