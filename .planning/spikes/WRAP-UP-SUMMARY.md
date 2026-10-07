# Spike Wrap-Up Summary

**Date:** 2026-10-07
**Spikes processed:** 5
**Feature areas:** format shell (hub plumbing), Mr. Market arcade, Snowball idle, Barren-CEO swipe, pixel cast, adventure art pipeline
**Skill output:** `./.claude/skills/spike-findings-barren-wuffett/`

## Processed Spikes

| # | Name | Type | Verdict | Feature Area |
|---|------|------|---------|--------------|
| 001 | cozy-art-pipeline | standard | ✓ VALIDATED (look signed off 2026-06-14; shipped into the game) | adventure art pipeline |
| 002 | old-barren-cast | standard | ✓ VALIDATED | pixel cast |
| 003a | mr-market-arcade | comparison | ✓ VALIDATED (WINNER: launches first) | Mr. Market arcade + format shell |
| 003b | snowball-idle | comparison | ✓ VALIDATED (second release) | Snowball idle + format shell |
| 003c | swipe-satire | comparison | ✓ VALIDATED (third release) | Barren-CEO swipe + format shell |

The three 003 spikes were left PENDING (feel) when they were committed. The verdicts above record the phone checkpoint the user passed on 2026-10-06 on Android Chrome: they loved all four directions and chose ONE mini-game hub site, launching A first, then B, then C, and keeping the adventure (D). Both MANIFEST.md and the spike READMEs now carry these verdicts.

## Key Findings

- **The product is a hub, not a single format.** All three short-session formats work and are fun on a phone, and the adventure stays. Releases are staggered (arcade → idle → swipe), with each one a new X post. This replaces the old adventure + email-funnel roadmap.
- **One shared shell makes each new format content-only.** Every format already shares a daily seed (FNV-1a → mulberry32, with the whole schedule precomputed and fingerprinted, so it is frame-rate independent and the same for everyone), one share flow (Web Share on touch, then clipboard + X intent; text built synchronously; URL passed separately; "made by @Wolfhartvest" as the last line), one credit/About/legal overlay, the `?date ?speed ?bot` hooks, a `window.__X__` probe and a forensic log.
- **The code-drawn cast is the art strategy.** A ~470-line `cast.js` draws old Barren, Charlie, Mr. Market (greed / panic / neutral) and three extras with no licence or likeness risk. The parody reads from traits: swept-back white hair, heavy grey brows over big glasses, a grin, suit + red tie.
- **Balance by simulation found what tests can't.** Node sims over several bot policies caught a solved swipe deck (96 % wins), a broke-heavy deck, an insurance-float exploit, a knife-dominated arcade panic, and a greedy optimiser that under-rates saving.
- **Arcade numbers that work:** 60 s career, start 5 %/yr, panic knives 22 % with 1.2 s grace, ranks cut at rounded CAGR. Smart play reached 15-20 %/yr; idle or random play reached 2-8 %.
- **Porting into the real build has fixed costs:** the CSP (`script-src 'self'`, `font-src 'self'`) means npm Phaser and a self-hosted Pixelify Sans. Vite 6's default target rejects the spikes' top-level await. Strings go through `t(key)`. The OG/X share card is broken (relative image URLs, blank image) and must be fixed before the first X post.
- **Open feel questions carried forward:** the arcade's 60 s length and item-type busyness; the idle game's life length and whether it needs a prestige loop; whether the swipe game is funny beyond finance followers, and whether 33 cards is enough.
