---
spike: 003a
idea: replayable-barren-pivot
name: mr-market-arcade
type: comparison
validates: "Given a phone, when you drag Barren under Mr. Market for a 60 s run (catch panic bargains, dodge greedy FOMO junk), then it's fun within 10 s, the snowball visibly compounds, the same date gives the same market, and the end screen produces a share line with the creator's handle"
verdict: VALIDATED
related: [002, 003b, 003c]
tags: [arcade, phaser, daily-seed, share, compounding, mood-pendulum, mobile]
---

# Spike 003a: Mr. Market Arcade

## What This Validates

**Given** a phone in portrait,
**when** the player drags Barren (and the snowball he pushes) under a mood-swinging Mr. Market for one 60-second "career",
**then** (a) it is understandable and fun within ~10 s, (b) the finance joke lands without a tutorial (buy in panic, dodge greed, don't catch falling knives), (c) compounding is *felt* (the snowball and the number visibly accelerate), (d) the same date yields the same market for everyone, and (e) the end screen produces a share line carrying the creator's handle.

(a) and (b) need the user's thumb — the phone checkpoint decides them. (c)–(e) are verified below.

## Research

| Approach | Tool | Pros | Cons | Status |
|---|---|---|---|---|
| **Phaser 4.1 via CDN** | jsdelivr UMD | spike convention; sprites/tweens/particles/shake like the real game | 1.3 MB lib | **CHOSEN** |
| Plain canvas | — | lighter | hand-rolled juice | rejected |
| **Whole market precomputed from a date seed** (mood curve + every throw: time, origin, landing x, speed, type) | FNV-1a → mulberry32 | frame-rate independent; identical for everyone; fingerprintable | — | **CHOSEN** |
| RNG consumed per frame | — | simpler | diverges with frame rate → no fair daily | rejected |
| **DOM overlay for title/end** | HTML/CSS | crisp text; `navigator.share` needs a real button tap | two UI layers | **CHOSEN** |
| **Share: Web Share (touch) → X intent `x.com/intent/tweet?text=&url=` + clipboard (desktop)** | — | native sheet on phones; X compose prefilled on desktop | — | **CHOSEN** ([X web intents](https://docs.x.com/x-for-websites/web-intents/overview); intent opens compose, nothing posts until the user taps Post) |
| Sound | WebAudio oscillators | zero assets | bleepy | **CHOSEN** for the spike |

**Design (the joke is the mechanic):** Mr. Market's mood swings GREED ↔ PANIC (Graham's allegory). In **panic** he dumps bargains (dollar bills, little businesses) — and **falling knives**. In **greed** he hurls shiny junk: speculative **bubbles**, a **meme-stock rocket** (nose down — it's crashing), **Fizzcoin**. Catching changes the snowball's **growth rate** (bargain +0.6%/yr, business +1.5%/yr, junk −1 to −1.5%/yr and a value hit), and the snowball compounds every game-second ("year") — so *early* good catches are worth the most and the number visibly accelerates. Three hearts; three knives = **SHAKEN OUT** (compounding stops — the lesson). Power-ups: **Cherry Fizz** (4 s slow-mo) and **Charlie** (blocks the next bad catch: *"NO."*). Two crashes and one bubble per day are seeded events with banners.

## How to Run

```bash
npx vite .planning/spikes --port 5180 --strictPort --host     # once, serves all spikes
# phone on the same Wi-Fi: http://<PC-LAN-IP>:5180/003a-mr-market-arcade/
node .planning/spikes/003a-mr-market-arcade/_verify.cjs        # det | bots | shots | all
```

Test hooks: `?date=YYYY-MM-DD` (pick a market), `?speed=4` (game-time ×4), `?bot=1|idle|random` (autopilot).

## What to Expect

Title: Barren vs. greedy Mr. Market, "Daily Market #N", a four-line how-to with the actual item sprites, TAP TO PLAY, "made by @yourhandle · about". In play: drag anywhere — Barren pushes a snowball that grows as the value compounds; Mr. Market's face, the sky (gold = greed, purple = panic), the GREED|PANIC meter and a headline ticker ("SELL EVERYTHING", "MY BARBER BOUGHT ROCKETS") all track his mood; catches pop labels like **BOUGHT THE TOP −1.0%/YR**. End: "BARREN RETIRES" (or "SHAKEN OUT IN YEAR N"), Barren beside his snowball, final value, %/yr + rank (BAGHOLDER → THE ORACLE OF OHAMA), six decade squares, SHARE / PLAY AGAIN.

## Observability

- `window.__ARCADE__` — `market` (mood fn, events, spawns, `fingerprint`), live `state`, `result`, `LOG`, `shareText()`, `play()`.
- Forensic `LOG`: ISO-timestamped `run-start` (date, fingerprint), `mood`, `event`, `catch` (type, t, value, rate), `blocked`, `share`, `end` — **export log** on the end screen downloads it as JSON.

## Investigation Trail

1. **Determinism:** same date → identical fingerprint (`e758782c`, 103 throws, crash@14.0 bubble@29.2 crash@46.1); next date → different (`cff61bbe`, 96 throws). Mood uses an *integrated* frequency so the late-game speed-up never jumps phase.
2. **First balance pass** (3 markets × smart / idle / random autopilots): skill clearly mattered (smart 9–13%/yr vs idle/random −0.1–5.8%), **but** knives were 34% of panic throws and the smart bot got **shaken out in 2 of 3 runs** — the core "buy the panic" moment was dominated by knife-dodging. Also the first decade's share square was **always 🟥** (4% start rate can't clear 5% in time).
3. **Tuning:** knives 34→22% of panic (12→8% neutral), 1.2 s grace after a knife (knives fall *past* Barren while he blinks), start rate 5%, bargains +0.6 / businesses +1.5%/yr, cap 35%, squares 🟩 ≥12% · 🟨 ≥6%, ranks re-cut (ORACLE ≥20%).
4. **Second pass:** smart 15.0–19.9%/yr ($43M–$540M), never shaken out; idle 1.7–8.5%; random 2.5–7.8%. ORACLE sits just above a scripted bot — reachable for a sharp human. Fixed: rank now uses the *rounded* rate the player sees (15.0% showed "SOLID COMPOUNDER").
5. **Phone screenshots** exposed: catch labels + ticker at 8 px were unreadable → 16 px; greed sky went muddy grey-green mid-mood → eased toward a vivid gold; title how-to sentences broke into flex columns → wrapped in spans; lonely end-screen snowball → Barren stands beside it.

## Results

**VALIDATED — phone checkpoint passed (2026-10-06, Android Chrome).** The user played all four directions and loves every one. Plan: ONE Barren Wuffett mini-game hub site, with releases staggered as A → B → C and the adventure (D) kept.

**Role: the WINNER of the comparison — it launches first** (the user's call).

Verified: deterministic daily market (PASS ×2); a real skill gradient (~100–10,000× value between strategies) so scores mean something; no console errors; readable on a 412-px phone; desktop works (centred column, arrow keys).

Sample share text (autopilot, Daily #6):

```
Barren Wuffett vs. Mr. Market · Daily #6 📈
Snowball $540M · 19.9%/yr · VALUE INVESTOR
🟨🟨🟩🟩🟩🟩
47 bargains · 2 bubbles · 2 🔪
made by @yourhandle
```

(Captured before the real handle existed. `HANDLE` is now `@Wolfhartvest`.)

Open questions for the user: is 60 s the right length; is reading item *types* (vs. just the mood) fun or busy; does the snowball-behind-Barren read; do the jokes land without the how-to?

Evidence: `_shot_1_title.png`, `_shot_2_panic.png`, `_shot_2_greed.png`, `_shot_3_end.png`, `_shot_4_desktop.png`.
