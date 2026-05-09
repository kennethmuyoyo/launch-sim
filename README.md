# Signal

### *We simulated the internet reacting to your launch — before you shipped it.*

Paste your landing page. We spin up a swarm of internet personas — Reddit indie hackers, design Twitter, TikTok creators, skeptical devs, AI VCs — and replay the next 10 days of discourse in 60 seconds.

You get the Reddit thread, the Twitter ratio, the TikTok comments, and a forecast that tells you the one thing you actually need to know:

> **Is this going to land, or are you about to ship into silence?**

---

## The problem

You vibe-coded a thing. It works. The landing page is up. Now what?

Right now, the only way to find out how the internet will react to your launch is to launch it. That feedback loop is brutal:

- You ship to Product Hunt and get 12 upvotes from your group chat.
- You post on r/SideProject and the top reply is *"what does this even do?"*
- You tweet the demo and it dies in 40 impressions.
- A week later you're rewriting the headline, the pricing page, and your entire pitch — because you finally understood what the internet was confused about.

The expensive part isn't the code. **The expensive part is launching blind.** Every founder, every indie hacker, every vibe coder is shipping into a black box and praying the positioning lands.

## What Signal does

Signal turns "launching" into a rehearsal you can run as many times as you want.

Drop in a URL. We do four things:

1. **Read your landing page like a stranger would** — positioning, pricing, tone, visuals, social proof, the vibe you didn't realize you were giving off.
2. **Spawn ~30 internet personas** stratified across Reddit, Twitter, and TikTok — each one a distinct archetype with their own voice, biases, and pet peeves.
3. **Run a multi-round discourse simulation** where personas react to your page *and to each other* — so sentiment drifts the way it actually drifts online when one spicy comment lands and the room turns.
4. **Stream the result back at you live** — comments rolling in, ratios forming, takes hardening — and finish with a forecast dashboard.

What you walk away with:

- A **fake Reddit thread** about your launch — top comment, controversial reply, the inevitable "have you seen \[competitor\]?"
- **Simulated Twitter discourse** — quote-tweets, dunks, the one earnest reply from a real fan.
- **TikTok comments** — the vibes verdict.
- A **launch score** (0–100), virality estimate, and per-platform sentiment breakdown.
- Your **biggest viral hook** — the thing the internet actually got excited about.
- Your **biggest weakness** — the thing they kept getting stuck on.
- **Predicted hot tweets** — the takes most likely to break out, in your detractors' voice and your fans' voice.
- A **UX friction list** — the moments in your copy where every persona stalled.

## Who it's for

- **Vibe coders & indie hackers** about to launch on Product Hunt, HN, or X — find out what the top comment is going to be *before* it's the top comment.
- **Founders rewriting their landing page** — A/B test positioning against a simulated audience instead of waiting two weeks for real traffic.
- **Solo creators and small teams** who can't afford a 5-person customer research panel — Signal is the panel.
- **Anyone tired of shipping to silence.**

## What you don't get

We're being honest about this: Signal is **narrative analysis disguised as forecasting.** It is not a statistical prediction of your KPIs. The launch score is not a number you should put in a deck.

What it *is*: an emotionally believable, screenshot-worthy read on whether your positioning lands. You'll know in your gut whether the simulation matches reality — and if your closest friend, your meanest critic, and your target customer all responded the same way in the room, that's a real signal you can ship on.

---

## How it works under the hood

```
URL  →  Playwright scrape  →  ProductCard (positioning, pricing, tone, audience)
            ↓
       30 LLM personas, stratified across platforms & archetypes
            ↓
       Multi-round discourse: each persona reacts to the page AND to the
       top comments from the previous round (this is how the room turns)
            ↓
       Streamed live to your screen via Server-Sent Events
            ↓
       Forecast: score · virality · sentiment · top quotes · weaknesses · hooks
```

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind 4 · Playwright · OpenRouter · Zod · Server-Sent Events · in-memory run store. Single repo, no separate backend.

## Quick start

```bash
npm install
npm run playwright:install        # one-time: downloads Chromium
cp .env.example .env.local         # add your OPENROUTER_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a URL, watch the room.

## Try the pre-warmed demos

If you don't have a URL handy, the landing page ships with three pre-warmed runs:

- **DemoFlow** — a clean winner. Watch the room get hyped.
- **Yet-another-newsletter** — confusing positioning. Watch every persona ask the same question.
- **Lonely-as-a-service** — polarizing. Watch the ratio.

## The team

Built at a hackathon by:

- **Ken** — scraping → ProductCard pipeline (`lib/scrape/`)
- **Juno** — live discourse UI + forecast dashboard (`app/`, `components/`)
- **John** — persona generator + simulation orchestrator (`lib/agents/`)

Three modules. Clean JSON contracts. Built in parallel. Shipped in a weekend.

---

> Stop launching blind. **Run the room first.**
