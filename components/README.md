# `components/` — Owner: **Juno**

The dashboard / live-discourse UI. Everything visual lives here.

## Responsibilities

1. **Landing page** (`app/page.tsx`, already stubbed) — URL input, kicks off a run.
2. **Live discourse view** (`app/run/[id]/page.tsx`, stubbed) — three platform panels streaming in real time:
   - `RedditThread.tsx` — fake subreddit thread, upvote counter, comment tree.
   - `TwitterDiscourse.tsx` — fake X timeline, retweet/quote dynamics.
   - `TikTokComments.tsx` — fake comments column, heart counts.
3. **Forecast dashboard** (renders when the `forecast` event arrives):
   - `LaunchScoreGauge.tsx` — big number, 0–100.
   - `ViralityMeter.tsx`
   - `SentimentBars.tsx` — per-platform breakdown.
   - `TopComments.tsx` — verbatim quotes.
   - `HotTweets.tsx` — predicted breakout tweets.
   - `WeaknessCard.tsx`, `ViralHookCard.tsx`.
   - `UXFrictionList.tsx`.

## Data flow

- Initial hydrate: `GET /api/run/:id` returns the snapshot.
- Live: `EventSource('/api/run/:id/stream')` emits `RunEvent`s (see `lib/shared/types.ts`).
- Filter events by `platform` to feed each panel.

## Notes

- The product should *feel like watching a future unfold* — bias toward animation, easing, staggered comment entry. Framer Motion is fine if you want it.
- Make screenshots of the simulated Reddit/Twitter/TikTok panels visually believable enough that a user would screenshot-and-share. That's the viral surface.
- Don't reach into `lib/scrape` or `lib/agents`. Your inputs are `RunEvent`s and `Forecast`.
- Keep the URL input page simple — it's the front door, not the demo.
