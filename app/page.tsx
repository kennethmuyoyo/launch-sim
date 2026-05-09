"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const { runId } = await res.json();
      router.push(`/run/${runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-xl">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Simulate the internet reacting to your launch.
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Paste your landing page. We&rsquo;ll spin up a swarm of internet personas — Reddit
          indie hackers, TikTok productivity creators, VC Twitter — and watch them react
          live. You get a forecast: launch score, viral hook, biggest weakness, and the
          discourse you&rsquo;d see.
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            required
            placeholder="https://your-app.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={submitting}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
          />
          <button
            type="submit"
            disabled={submitting || !url}
            className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {submitting ? "Launching…" : "Simulate launch"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <p className="mt-12 text-sm text-zinc-500">
          Tip: works best on a real landing page with copy, screenshots, and a CTA.
        </p>
      </div>
    </main>
  );
}
