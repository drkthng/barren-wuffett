# Phase 5: Consolidate + Shared Shell + Hub Checkpoint - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log preserves the alternatives considered.

**Date:** 2026-10-08
**Phase:** 05-consolidate-shared-shell-hub-checkpoint
**Areas discussed:** Hub look & tiles, Daily strip & streak, Adventure inside the hub, Name, icon & legal pages

---

## Pending todo cross-reference

| Option | Description | Selected |
|--------|-------------|----------|
| Keep for Phase 6 | Phase 5 has no public deploy; settle it before the first public launch | ✓ |
| Fold into Phase 5 | Research the insurance options now, next to the privacy-page rewrite | |
| Leave it in the backlog | Not tied to any phase | |

**User's choice:** Keep for Phase 6 (todo: Gewerbe-Versicherung für Finanz-Content recherchieren)

---

## Hub look & tiles

**Layout**

| Option | Description | Selected |
|--------|-------------|----------|
| Stacked cards | Grow the spike phone hub: full-width cards with portrait, kicker, title and blurb, room for badges | ✓ |
| 2×2 tile grid | Four square tiles with big art and a short name; little room for blurbs/badges | |
| Hero + compact list | Big Barren + "play today's" button on top, slim rows below | |

**Locked card look**

| Option | Description | Selected |
|--------|-------------|----------|
| Named teaser, dimmed | Real title/kicker/blurb, greyed art, padlock, "coming soon · follow @Wolfhartvest" | ✓ |
| Mystery card | Silhouette + "???", each release a reveal | |
| Full colour + ribbon | Looks live with a "SOON" ribbon | |

**Card order**

| Option | Description | Selected |
|--------|-------------|----------|
| Release order | Arcade, Snowball, CEO, Adventure last; fixed positions | ✓ |
| Live games first | Live cards float up; the order changes per release | |
| Adventure first | Adventure on top as the "origin story" | |

**Locked tap**

| Option | Description | Selected |
|--------|-------------|----------|
| Small sheet, then X | Bottom sheet with [Open X] [Close] | ✓ |
| Straight to the X profile | The card is a plain link to x.com/Wolfhartvest | |

**Mockup before planning**

| Option | Description | Selected |
|--------|-------------|----------|
| Phone mockup first | Throwaway HTML hub with the real cast over LAN; feeds the UI-SPEC | ✓ |
| UI-SPEC from text | Judge the real thing on the preview at phase end | |
| Port the spike hub as-is | No separate design step | |

**User's choice:** Stacked cards; named dimmed teasers; fixed release order; bottom sheet on locked tap; phone mockup before the plan is locked.

---

## Daily strip & streak

**Streak icon**

| Option | Description | Selected |
|--------|-------------|----------|
| Pixel snowball | Code-drawn snowball that grows a size step at 3/7/30 days; the compounding metaphor | ✓ |
| 🔥 fire | Universal streak symbol, generic | |
| Plain "Day 3" | Text only | |

**Daily #1**

| Option | Description | Selected |
|--------|-------------|----------|
| Public launch day | EPOCH set in Phase 6; the first X post says "Daily #1" | ✓ |
| Keep 2026-10-01 | The spike constant; the launch day would be Daily #20-something | |

**Empty state**

| Option | Description | Selected |
|--------|-------------|----------|
| Reveal as it fills | Daily #N always; checklist once a daily is live; snowball after the first finished daily | ✓ |
| Always show everything | The full strip even at "streak 0 · 0/1" | |

**Install hint placement**

| Option | Description | Selected |
|--------|-------------|----------|
| Slim card on the hub | Dismissible card under the strip on the next hub visit | ✓ |
| On a game's end screen | Right after the day-2 finish; inside a game | |
| Bottom banner on the hub | Docked banner; the most ad-like | |

**User's choice:** Pixel snowball; Daily #1 = launch day; reveal as it fills; slim hub card.

---

## Adventure inside the hub

**Way back to the hub**

| Option | Description | Selected |
|--------|-------------|----------|
| Hub link on title + settings | "← HUB" in MainMenu.ts + Settings.ts next to the legal links | ✓ |
| Floating DOM chip | Corner chip over the canvas; may collide with touch controls | |
| Leave it as is | Browser back only; installed iOS players get stuck | |

**Credit/About on the adventure**

| Option | Description | Selected |
|--------|-------------|----------|
| Credit line on its title only | "made by @Wolfhartvest" under the title; no About overlay | ✓ |
| Full shell | Credit + DOM About overlay | |
| Nothing | The adventure stays exactly as is | |

**Phase 5 sign-off**

| Option | Description | Selected |
|--------|-------------|----------|
| Headless + your phone check | Headless checks, then the user signs off the hub on the preview URL on their phone | ✓ |
| Plus a full adventure phone pass | Also pull ADV-01 forward | |
| Headless only | First phone contact in Phase 6 | |

**User's choice:** Hub link on title + settings; credit line on the title only; headless checks + phone sign-off.

---

## Name, icon & legal pages

**Tagline**

| Option | Description | Selected |
|--------|-------------|----------|
| Patience vs. Mr. Market | "Daily games about patience, compounding and a very moody Mr. Market." | ✓ |
| Punchy one-liner | "Be patient. Mr. Market isn't." | |
| Plain description | "Free daily mini-games starring Barren Wuffett." | |

**App icon**

| Option | Description | Selected |
|--------|-------------|----------|
| Old Barren's face, "Barren" | Code-drawn portrait on the hub background, 192/512 incl. maskable | ✓ |
| Barren + Mr. Market duo | Both faces on one icon | |
| Keep the current icon | Only fix the name/description | |

**Hub X share card**

| Option | Description | Selected |
|--------|-------------|----------|
| Cast lineup + title | Charlie, Barren, Mr. Market (greed) + title + tagline, from a static card.html | ✓ |
| Barren alone, big | One huge portrait + title | |
| Screenshot of the hub | Real screenshot of the card list | |

**Privacy page language**

| Option | Description | Selected |
|--------|-------------|----------|
| German + English | German binding, English below it on the same page | ✓ |
| German only | As today | |
| English only | Drops the German text | |

**User's choice:** Patience tagline; old-Barren icon labelled "Barren"; cast-lineup share card; German + English privacy page.

---

## Claude's Discretion

- Branch consolidation mechanics (fast-forward the chain, bring in `gsd/fix-menu-taps`, merge `spike/pivot-formats`)
- The preview deploy mechanism (`wrangler pages deploy --branch <alias>`, never production)
- Workbox `globPatterns`/`navigateFallback` for the MPA (research flag)
- Cloudflare Web Analytics wiring and exact CSP origins
- The hub palette and spacing, snowball sprite/steps, per-card art, blurbs and bottom-sheet styling (settled by the phone mockup)
- Self-hosted Pixelify Sans
- Phase 5 streak/checklist verification via unit tests + the `window.__HUB__` probe
- The desktop layout (centered column)
- The adventure's own OG card content

## Deferred Ideas

- ADV-01: full adventure phone pass + whack/pause hit-area fix (stays in Future Requirements)
- Preview-URL privacy via Cloudflare Access (offered as an extra gray area; the user went straight to context)
- Todo "Gewerbe-Versicherung für Finanz-Content recherchieren": Phase 6
