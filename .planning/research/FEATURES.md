# Feature Research

**Domain:** Daily-return mini-game hub, credit-only funnel (Wordle / NYT Games -style hub of short replayable formats; comparables: Wordle, NYT Games app, Connections, Framed, Reigns, Cookie Clicker / Universal Paperclips)
**Researched:** 2026-10-07
**Confidence:** HIGH — internal findings are grounded in four spikes the user actually played on a phone plus Node balance-sim data; external findings are grounded in well-documented, widely-written-about genre conventions (Wordle's design history, NYT Games' 2024 redesign, Reigns' card economy, classic incrementals)

## Feature Landscape

Grouped by the categories REQUIREMENTS.md will use: **Hub & Shared Shell, Arcade release, Idle release, Swipe release, Sharing/Launch kit, Analytics & Legal.**

### Table Stakes (Users Expect These)

#### Hub & Shared Shell

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| Game tile grid at the site root (4 tiles) | Every multi-game daily hub (NYT Games' 2024 redesign moved from a crossword-first layout to a flat list of all games specifically so nothing hides) shows the full catalog at a glance | S | Reuse code-drawn cast art per tile; CSS grid, portrait-first |
| Locked "coming soon" tiles for unreleased games | Sets correct expectations instead of a dead link or a missing tile that looks broken | S | Padlock icon + "follow @Wolfhartvest" CTA; no fake countdown (see Anti-Features) |
| One shared config/credit/share/daily-seed module ported into the real Vite+TS build | All three new formats need identical plumbing; solving the CSP/font/top-level-await problems three separate times would triple the risk | M | Fully specified in `format-shell.md`; the real blocker is the build's strict CSP, not the logic |
| Credit + About/legal overlay on every game | Not just a nice-to-have — UWG §5a(4) requires the credit be visible, not buried | S | DOM-overlay pattern already proven in the spikes |
| Working OG/X share image (absolute URL, real image) | X needs an absolute `og:image` to render a card at all; today's is a relative URL pointing at a blank navy PNG | M | Known, already-diagnosed bug — must be fixed before Release 1's X post, not after |
| Daily seed = same game for every player, every UTC day | This is the Wordle mechanic itself — without a shared "today," there is no comparability in replies and no reason to call anything "Daily #N" | S (already built) | Only porting work remains |

#### Arcade release (Mr. Market, Release 1)

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| 60 s single-session run with a clear end screen | Validated: skill gradient already separates smart (15-20%/yr) from idle/random (2-8%/yr) by 100-10,000x in value at this length | S (port) | `mr-market-arcade.md` has tuned numbers from two balance passes |
| One-thumb drag input | Table stakes for any mobile arcade-catch game | S (port) | Already tuned; `MOVE_SPEED`, knife grace etc. carry over as-is |
| Share result (value, %/yr, rank, decade squares) | The thing people actually post | S (port) | Text shape already validated |

#### Idle release (Snowball, Release 2)

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| Age 6→90 progression via tap-to-hustle + buy-and-reinvest | Standard incremental grammar players already know from Cookie Clicker / Universal Paperclips lineage | S (port) | `econ.js` is a pure, Node-simmed module; port as-is |
| Seeded daily offers (crash/buyout/tip/mill), same for everyone | Consistency with the hub's daily identity; also the funniest content per the spike notes | S (port) | Already fixed to "every life opens with a crash, deal the same set, seed only the order" |

#### Swipe release (Barren, CEO, Release 3)

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| Reigns-style swipe-left/right with 4 two-sided meters | Genre table stakes once the pitch is "Reigns-style" | S (port) | Pointer Events + CSS transform, no gesture library needed |
| Endings-collection grid (3×3, `???` for undiscovered) | Core Reigns replay hook; also satisfies the Octalysis "ownership" drive cheaply | S (port) | `localStorage['barren-ceo-endings']`, best-effort |

#### Sharing / Launch kit

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| Per-release X post with a share-card image + short gameplay clip | This is the stated growth mechanism (X follower growth via plays per release) — without it a release is silent | M | Repeats 3× (one per release); screen-recording + card-generation workflow, not code |
| Native share sheet on phone, X-intent fallback on desktop | Mobile users expect one tap, not copy-paste | S (port) | Already proven pattern (`navigator.share` synchronous text, no await before the call) |

#### Analytics & Legal

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| Cookieless Cloudflare Web Analytics, wired site-wide | This *is* the success metric's input (plays per release) — without it there's no way to know a release worked | S/M | One script tag; confirm it fires on every hub route, not just `/` |
| Privacy page matching actual practice (no Supabase/Brevo) | Legal requirement under GDPR given the German operator; also just honest | S | Edit of an existing page |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| Cross-game daily checklist ("today's dailies: 2/3 done") | NYT Games has per-game stats/streaks but siloed per game; a hub-wide checklist reinforces "this is one hub," not three separate apps glued together | S/M | Device-only; must key off the same UTC date the seed already defines (see Streak rules below) |
| Cross-game play streak ("day N") | A Wordle-style habit hook rare on an indie multi-format hub — most indie daily-game clones do one format only | S | Needs careful non-punitive UX; see dedicated section below |
| One unified code-drawn parody cast across all 4 formats | No format-switch "reskin" feeling; this is *why* the spike comparison could be about format and not art | Already built | `pixel-cast.md` |
| The theme is the mechanic, not a skin, in every format | ENGAGEMENT.md's strongest prior finding: compounding, patience and Mr. Market's mood swings are the actual rules, not flavor text over a generic game — no finance-parody competitor does this across three different genres at once | Already built | Embedded in each format's pure module (`buildMarket`, `econ.js`, `cards.js`) |
| One shared daily number across the whole hub | Lets a single X post say "Daily #N" meaningfully for whichever game it's about, and lets replies compare apples to apples | S | `EPOCH` already shared in one config constant |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| Accounts / login | "Progress survives a new device" sounds responsible | Needs a backend + GDPR consent flow — exactly what the 2026-10-06 pivot dropped and why | localStorage, best-effort, explicitly disposable (same tradeoff Wordle shipped with for years) |
| Leaderboards | Looks like the obvious "compare scores" virality lever | Needs a backend; invites optimiser/cheat discourse; the share text already does this job | Rank tiers + decade squares/emoji *are* the leaderboard, carried in the share text itself |
| Push notifications ("come back today!") | Looks like the cheapest streak-saving nudge | ENGAGEMENT.md flags notification-begging by name for this exact audience; inconsistent iOS web-push support; needs a consent prompt | Checklist/streak is pull — the player checks the hub, nothing checks on the player |
| Streak-loss guilt messaging / streak-freeze purchases | Feels like it protects engagement | ENGAGEMENT.md's #2 named anti-pattern (login-streak guilt); "buy a freeze" implies monetization this project has none of | Silent reset to 1, no modal, no purchasable grace |
| Countdown timers on locked "coming soon" tiles | Feels like it builds anticipation | Manufactured urgency is ENGAGEMENT.md's FOMO-timer anti-pattern; the real ship dates aren't fixed (staggered on "passes its phone feel check") anyway | Static "follow @handle" CTA, no clock |
| In-game links to eToro / wikifolio / portfolio | Feels like "why not, it's right there" | Already explicitly out of scope; parody + endorsement is a legal risk (UWG §5a(4): subtle ≠ hidden) | Credit-only: handle + website, About screen only |
| Prestige/ascension loop added to the idle game at launch | Looks like free extra depth — it's idle genre's biggest retention lever elsewhere | This format is a *daily* 5-minute arc reset by a fresh seed, not a persistent idle game run for days; a cross-day prestige means new persistent state exactly where the backend was just removed, and risks turning a comedy bio-sim into a grind before the "is 5 min long enough" question is even answered | Ship the self-contained daily life first; if feel pass says it's thin, trim the business list or re-pace `YEAR_SECONDS`, don't add a meta-loop |
| Expanding the swipe deck past 33 cards before launch | Insurance against "feels thin" vs. Reigns' ~750-887 cards | Content is this format's *planned* release treadmill (per `swipe-satire.md`); blocking Release 3 on writing hundreds of cards contradicts the staggered-release strategy | Ship 33; treat "add N cards" as the ongoing post-launch cadence for this one game |
| Server-synced streak/checklist | Protects against a cleared cache wiping stats | Backend again, by another name | Accept the loss-on-clear tradeoff; it's the same one every account-less daily game accepts |

## Feature Dependencies

```
Shared hub shell (config + seed + share + credit/About overlay)
    └──requires──> CSP fixes (npm Phaser, self-hosted Pixelify Sans, es2022 build target for top-level await)
                       └──requires──> nothing else — do this first, once

Hub page (tiles, checklist, streak)
    └──requires──> Shared hub shell (must agree on the same DATE/seed definition and config constants)

Arcade / Idle / Swipe release
    └──requires──> Shared hub shell
    └──requires──> OG/X share image fix (otherwise that release's X post under-performs or fails to render)

Daily checklist + streak
    └──requires──> at least one released game to check off (can ship alongside Release 1; doesn't need all three)

Per-release X post + share card + clip
    └──requires──> that release's phone feel pass has passed
    └──enhances──> Cookieless analytics (the post is what drives the traffic analytics measures)

Swipe deck expansion (post-launch)
    └──requires──> Swipe release shipped
    └──conflicts with──> gating Release 3 on deck size (must not block launch)

Idle prestige loop / "personal best" compare
    └──conflicts with──> "device-only, no new persistent state" simplicity bar — deferred, revisit only post-launch
```

### Dependency Notes

- **Everything downstream reuses the shared shell**, so the CSP/font/top-level-await/seed fixes must land once, in the shell phase, not be re-solved per format.
- **The share-card bug is a dependency of every release's X post**, not just Release 1's — fix it in the shared-shell phase so it's already solved by the time Release 1 ships.
- **The checklist/streak doesn't have to wait for all three releases** — checking off "today's arcade run" alone is already a meaningful loop, and the feature should ship with Release 1 and simply gain a column per later release.

## Open Feel Questions — Recommendations

Grounded in the spikes' own sim data plus genre comparables.

### Arcade: is 60 s the right length, is item-type reading busy?

**Recommendation: keep 60 s for Release 1.** Viral short-session arcade loops that this genre lineage draws from (Flappy Bird, Crossy Road, Chrome's offline dino game) sit in the 30-90 s range, and 60 s already produced a validated, wide skill gradient in the sim (smart 15-20%/yr vs. idle/random 2-8%/yr). Don't extend length to fix "busyness" — fix busyness directly instead: lean harder on silhouette/color families (round-and-warm = good, spiky-and-cold = bad) so a glance reads good/bad before a label does, reserving "reading the type" for players who want the nuance. Re-test busyness specifically in the phone feel pass; only extend the 60 s if the feel pass says the run *feels short*, which is a different problem than busy.

### Idle: is 5 minutes the right life, does it need a prestige loop?

**Recommendation: ship the 5-minute self-contained life for Release 2; do not add a prestige loop.** The format is a *daily* arc reset by a fresh seed each day — closer to a daily puzzle's "one attempt" framing than to a persistent idle game checked hourly over days. The classic idle prestige loops this genre is compared against (Cookie Clicker's ascension, Universal Paperclips' narrative phase-shift) exist because those games run indefinitely; this one deliberately resets daily, so "pass the snowball on" would require new cross-day persistent state exactly where the backend was just removed. If the phone feel pass says 5 minutes feels thin, prefer trimming the business list (already flagged as possibly too long by age 70) or re-pacing `YEAR_SECONDS`, over adding a meta-loop.

### Swipe: is it funny beyond finance followers, is 33 cards enough?

**Recommendation: ship 33 cards for Release 3 as planned; treat card-writing as the post-launch content cadence.** Reigns' ~750-887-card depth was built over its lifetime, not at launch — 33 is a reasonable *first* deck by that model, not a finished one. "Is it funny beyond finance followers" is a writing/testing question, not a feature gap: mitigate by having at least one phone-feel-pass reader who isn't a finance follower, since every other validation so far has been the creator's own judgment on a topic they're close to.

## Streak & Checklist UX Rules (device-only, no backend)

The project explicitly wants a streak despite ENGAGEMENT.md's prior finding that login-streak guilt is an anti-pattern. Both can be true: ship the streak, but not its guilt mechanics.

1. **Day boundary = the same UTC ISO date the daily seed already uses** (`DATE` in `format-shell.md`), never the device's local midnight. The hub's "today" must agree with which daily game is actually showing — two different boundaries (UTC for the seed, local time for the streak) would let the checklist say "not done today" while the seed has already rolled over, right at the DE timezone edge (01:00/02:00 local) the shell doc already calls out.
2. **Checklist state keys off `{DATE, gameId}` in `localStorage`**, wrapped in try/catch exactly like the existing pattern (private-mode browsers throw). A game counts as "done today" the first time its end screen is reached that day, not merely opened — mirrors how the share flow already gates on `result`.
3. **The streak increments once per UTC day**, the moment the *first* game of that day is completed — not once per game finished. Clearing several games the same day keeps the streak alive for that day but doesn't add extra days.
4. **No streak-loss modal, no red "you broke it" messaging.** On a gap, silently reset `currentStreak` to 1 on the next completion and show the new number going forward; never surface what was lost. This is ENGAGEMENT.md's #2 anti-pattern by name — adding a streak doesn't require adopting its guilt mechanics.
5. **No streak-freeze purchase** — there's no monetization to sell one from. If a grace mechanic is wanted at all, the only acceptable form is a silent, non-configurable one-day grace (miss one day, streak holds); add it only if the phone feel pass shows people annoyed by a brittle streak, otherwise skip it as unneeded complexity.
6. **Clearing site data resets everything, and that's a disclosed, acceptable tradeoff** — the same one Wordle shipped with for years before it had accounts. Don't design around preventing it; that's a backend problem by definition.
7. **The checklist is pull, not push.** No notification, no badge requiring a permission prompt. The player sees "2/3 today" only when they open the hub, which keeps this inside both the no-push constraint and ENGAGEMENT.md's notification-begging anti-pattern.
8. **Best-effort, not authoritative.** Treat the streak/checklist like the swipe game's endings collection — a nice local artifact, not a system that must survive every edge case (new device, cleared cache, multiple open tabs). A simple localStorage read-modify-write is good enough at this scale.

## MVP Definition

### Launch With (Release 1)

- [ ] Shared shell ported into the real build (config, seed, share, credit/About overlay) — every later release depends on it
- [ ] Hub page with 4 tiles: Arcade live; Idle + Swipe locked "coming soon, follow @Wolfhartvest"; Adventure as an early-demo tile
- [ ] Daily checklist + streak, scoped to whatever is live (just the arcade at first), UTC-day boundary matching the seed's `DATE`
- [ ] Mr. Market arcade ported, phone-feel-passed, OG/X share card fixed, share card + clip produced, deployed, one X post
- [ ] Cookieless analytics wired site-wide so Release 1's plays are measurable
- [ ] Privacy page corrected (no Supabase/Brevo mentions)

### Add After Validation (Releases 2 and 3)

- [ ] Snowball idle ported + feel-passed + released, unlocking its hub tile and extending the checklist
- [ ] Barren-CEO swipe ported + feel-passed + released, unlocking its hub tile and extending the checklist
- [ ] Each release's own share card + clip + X post

### Future Consideration (post v2.0)

- [ ] Swipe deck content expansion beyond 33 cards — the format's built-in release treadmill
- [ ] Idle "personal best" compare, only if the phone feel pass flags the 5-minute life as too short — not a full prestige loop
- [ ] Any cross-device sync — explicitly deferred; would require reintroducing a backend

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---|---|---|---|
| Shared shell port (config/seed/share/overlay) | HIGH | M | P1 |
| OG/X share image fix | HIGH | S/M | P1 |
| Hub page + locked teaser tiles | HIGH | S | P1 |
| Daily checklist + streak | MEDIUM | S | P1 |
| Arcade port + feel pass + release | HIGH | M | P1 |
| Cookieless analytics | HIGH (it IS the success metric) | S | P1 |
| Idle port + feel pass + release | HIGH | M | P2 |
| Swipe port + feel pass + release | HIGH | M | P2 |
| Swipe deck expansion | MEDIUM | M (content, not code) | P3 |
| Idle prestige / personal-best | LOW/MEDIUM | M | P3 |
| Accounts, leaderboards, push, cross-device sync | LOW for this audience | HIGH + violates constraints | Rejected |

## Competitor / Comparable Feature Analysis

| Feature | Wordle / NYT Games | Reigns | Idle genre (Cookie Clicker, Universal Paperclips) | Our Approach |
|---|---|---|---|---|
| Hub of multiple daily games | Yes — NYT Games' 2024 app redesign centers a "Games" tab listing every title plus a "Stats" tab; playable fully without an account, login only needed for cross-device sync | N/A (single game) | N/A (single game) | Same idea at indie scale: one tile grid, device-only stats, never an account |
| Streak / checklist | Per-game streak + stats, server-synced if logged in, but works with zero account | None | None (session-based, not daily) | Device-only streak + checklist spanning all games, no account, no sync |
| Share artifact | Spoiler-free emoji grid + score line, shareable without logging in | No native daily share artifact (not a daily game) | Screenshots only, no built-in share string | Structured share text (result + rank + emoji line + handle) via native share sheet / X intent |
| Locked/upcoming content | NYT launches new games (Connections, Strands) as separate announced events, not shown as locked tiles ahead of time | DLC packs shown in-store before release | N/A | Locked "coming soon, follow @handle" tiles — closer to a storefront "coming soon" page, chosen because all 3 formats already exist and staggering is the release calendar, not a build queue |
| Replay depth via content volume | The calendar itself supplies infinite content (a new puzzle daily) | ~750-887 cards | N/A (one long escalating run, no repeats within a playthrough) | Arcade/idle: procedurally fresh via daily seed, no content debt. Swipe: 33 cards vs. Reigns' hundreds — the one format with a real near-term repetition ceiling, by design deferred to post-launch content |
| Monetization / account pressure | NYT Games subscription upsell; accounts for cross-device sync | Premium DLC (mobile) | Ad-supported or paid; no accounts | None anywhere — credit-only funnel, by explicit constraint |

## Sources

- Internal, HIGH confidence (validated on-device by the user, with Node balance-sim data): `.claude/skills/spike-findings-barren-wuffett/references/format-shell.md`, `mr-market-arcade.md`, `snowball-idle.md`, `swipe-satire.md`, `pixel-cast.md`
- Internal, HIGH confidence (prior project research, SDT-grounded): `.planning/research/ENGAGEMENT.md` — streak-guilt, FOMO-timer and notification-begging anti-patterns reused directly in the Streak & Checklist rules above
- [NYT Games debuts redesigned app to boost discovery and simplify navigation](https://techcrunch.com/2024/03/07/nyt-games-redesigned-app-boost-discovery-simplify-navigation/) — MEDIUM confidence, journalism on the official 2024 redesign (Games tab, Stats tab, no-login play)
- [How NYT Games mastered the art of thoughtful play](https://www.creativereview.co.uk/new-york-times-games-wordle-crossplay-design-jonathan-knight/) — MEDIUM confidence, design-press interview with NYT Games leadership
- [Wordle's viral marketing tactic makes brilliant use of people-as-media](https://beastoftraal.com/2022/01/04/wordles-viral-marketing-tactic-makes-brilliant-use-of-people-as-media/) — MEDIUM confidence, practitioner account of the emoji-grid share origin
- [Breaking Down Wordle (Medium)](https://howardlee93.medium.com/breaking-down-wordle-80d2a13f2390) — MEDIUM confidence, practitioner breakdown of client-side streak/localStorage design
- [Wordle: Game creator Josh Wardle on strategy, stats, and why it went viral (Slate)](https://slate.com/culture/2022/01/wordle-game-creator-wardle-twitter-scores-strategy-stats.html) — MEDIUM confidence, on scarcity/no-archive as part of the daily hook
- [Reigns — card-count discussion (Steam Community / Expert Game Reviews)](https://steamcommunity.com/app/474750/discussions/0/152392549354152776/) — MEDIUM confidence, community-sourced card-count figures (~750-887 cards across the game's life), used only as an order-of-magnitude comparison against our 33-card launch deck

---
*Feature research for: Barren Wuffett v2.0 — The Barren Wuffett Hub*
*Researched: 2026-10-07*
