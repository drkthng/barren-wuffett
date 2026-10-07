# Format Shell: the shared hub plumbing behind every mini-game

Every format (arcade, idle, swipe) used the same plumbing: the daily seed, share flow, credit line, About/legal overlay, test hooks, forensic log, balance simulator and headless check. Build the plumbing once in the hub and each new format is just content. This file covers the shared parts. Each format file covers what is specific to that format.

## Requirements

From idea `replayable-barren-pivot` (MANIFEST.md):

- **Fun first.** Entertainment is the product; growing the creator's X following already counts as a win.
- **Credit, not funnel:** a visible "made by @handle" on title/end screens, the @handle in the share text, and the website in an About screen. Handle **`@Wolfhartvest`** in one config constant. Website compoundingknowledge.com, About screen only.
- **No email capture, no backend, no eToro / wikifolio / portfolio links inside the game.** Barren never endorses or points to anything (parody + endorsement = PITFALLS #4; UWG §5a(4): subtle must not mean hidden).
- **The face is the iconic OLD Barren**, with Charlie as sidekick and Mr. Market (greed ↔ panic) as villain. Parody names only; no real names, likeness, voice or brand marks.
- **Mobile portrait first, static hosting only (€0).**
- **One hub site, staggered releases:** ONE Barren Wuffett mini-game hub. A (arcade) launches first, then B (idle), then C (swipe) as each is polished; each release = a new X post. Keep the adventure (D) in the hub.

## How to Build It

### 1. One config module for credit + URLs

The spikes repeated these constants at the top of every format. In the hub, put them in one module:

```js
export const HANDLE   = '@Wolfhartvest';
export const GAME_URL = 'https://barren-wuffett.pages.dev';   // swap when a custom domain exists
export const SITE_URL = 'https://www.compoundingknowledge.com';
export const EPOCH    = Date.UTC(2026, 9, 1);                 // Daily #1 = 2026-10-01 (UTC)
```

Fill every `<span class="handle">` from `HANDLE` at boot (`for (const el of document.querySelectorAll('.handle')) el.textContent = HANDLE;`), so the handle appears in exactly one place.

### 2. Daily seed: the same game for everyone each day

```js
export function hashStr(s) {                       // FNV-1a 32-bit
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
}
export function mulberry32(a) {
    return () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const params   = new URLSearchParams(location.search);
export const DATE     = params.get('date') || new Date().toISOString().slice(0, 10);   // UTC date
export const DAILY_NO = Math.floor((Date.parse(`${DATE}T00:00:00Z`) - EPOCH) / 86400000) + 1;
```

- Namespace the seed per game: `barren-market:${DATE}`, `barren-life:${DATE}`, `barren-deck:${DATE}:${career}`.
- **Build the whole day's schedule up front** (every throw, every offer) from the seed, then *consume* it by game time. Never draw from the RNG per frame.
- **Fingerprint** the schedule: `hashStr(JSON.stringify(schedule)).toString(16)`. Log it at run start and assert in the headless check that the same date gives the same fingerprint and the next date gives a different one.

### 3. Share: native sheet on phones, X intent on desktop

```js
async function share() {
    if (!result) return;
    const text = shareText(result);                 // sync: nothing awaited before navigator.share
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        try { await navigator.share({ text, url: GAME_URL }); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }      // user closed the sheet
    }
    try { await navigator.clipboard.writeText(`${text}\n${GAME_URL}`); toast('Copied!'); } catch {}
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(GAME_URL)}`,
                '_blank', 'noopener');
}
```

**Share text shape** (all three formats): line 1 = game name + `Daily #N` + one emoji; line 2 = the result + rank; then one line of emoji or milestones; then one stat line; and **`made by @Wolfhartvest` as the last line**. Pass the URL separately (`url:`), never inside the text. Examples are in each format's reference.

The X intent opens a prefilled compose box and nothing posts until the user taps Post.

### 4. Title / end / About as DOM overlays

Use DOM overlays even above a Phaser canvas: text stays crisp and `navigator.share` gets a real button tap. The pattern is `.overlay { position: fixed; inset: 0; display: none }` with `.overlay.show { display: flex }`, and one panel at `max-width: 400px`. Every screen carries:

- **Title:** game name, `Daily … #N · same … for everyone today`, a how-to drawn with the real sprites, one big button, and `made by <handle> · about`.
- **End:** result, rank, the share-text emoji line, SHARE, PLAY AGAIN, and `made by <handle> · export log`.
- **About** (copy this text exactly): *"Barren Wuffett is a loving parody game about patience, compounding and a very moody Mr. Market. It is not affiliated with any real person or company, and nothing in it is investment advice."* + *"Made by <handle>. More from the maker: compoundingknowledge.com"*. The About screen is the only place the website appears.

Buttons: `Press Start 2P` 14 px, full width, `padding: 14px 10px`, with a pressed state that drops 3 px. Pad the bottom by `calc(10px + env(safe-area-inset-bottom))` for docked controls.

### 5. Test hooks and a forensic log in every format

- URL params: `?date=YYYY-MM-DD` (pick a day), `?speed=N` (game-time multiplier), `?bot=<policy>` (autopilot).
- A probe object `window.__ARCADE__` / `__IDLE__` / `__SWIPE__` exposing the live `state`, the seeded schedule + `fingerprint`, `result`, `LOG`, `shareText()`, and `start()`/`play()`/`decide()`. Set `ready: true` when the scene is up.
- `const log = (cat, data = {}) => LOG.push({ iso: new Date().toISOString(), cat, ...data });` with categories such as run-start (date, daily, fingerprint, bot), each decision, event, share and end. An **export log** link on the end screen downloads `{date, daily, fingerprint, result, log}` as JSON.

Hide the hooks in production behind a dev flag if you want; they cost nothing and keep the game testable.

### 6. Balance by simulation before anyone plays

Keep each format's rules in a **pure module** (no DOM): `buildMarket()` in the arcade, `econ.js`, `cards.js`. Then a Node `_sim.mjs` plays thousands of runs under several policies:

| Policy | Why it exists |
|---|---|
| smart / balanced / saver | the ceiling; is the top rank reachable but not trivial? |
| casual / lazy | what a real human does (checks the shop every few seconds) |
| random | the floor; it must lose most of the time |
| one-note (always-left, always-right, idle) | must fail, or the game is solved |

This approach caught four problems that no unit test would have found: a solved swipe deck (96 % wins), a broke-heavy deck, an insurance-float exploit, and an optimiser artefact (a greedy bot under-rates saving).

### 7. Headless check on a phone viewport

Use Playwright from the repo's `node_modules` with a 412×915 viewport, `deviceScaleFactor: 2`, `isMobile: true` and `hasTouch: true`. Collect `pageerror` and console errors. Wait for `window.__X__.ready`. Then:

1. Check determinism by fingerprint (same date twice gives the same fingerprint; the next date gives a different one).
2. Run whole games with autopilot at `?speed=4` under each bot policy, and print the result + share text.
3. Drive real input (a `page.mouse` drag across the card for swipe) and screenshot every screen.
4. **Look at every screenshot.** Unreadable 8 px labels and a muddy sky colour were caught only this way.

## What to Avoid

- **RNG drawn per frame**: it diverges with frame rate, so there is no fair daily.
- **Awaiting anything before `navigator.share`**. iOS drops the user-gesture link. Build the text synchronously. The real game's `src/services/ShareService.ts` pre-caches its image Blob for the same reason.
- **The URL inside the share text**: pass it as `url:` so the share sheet and X build the card.
- **A meaningless share stat** ("197 crash buys") instead of a legible one ("bought 3 of 3 crashes").
- **Bare `localStorage`**: wrap every read/write in try/catch (private mode throws) and treat it as best-effort (the swipe endings collection).
- **Any outbound link inside play** other than the About screen's website. No portfolio, broker or email links anywhere.

## Constraints

- **The real build's CSP** (`public/_headers`): `default-src 'self'; script-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'`. So when porting a spike:
  - Phaser comes from npm (`import Phaser from 'phaser'`, already a dependency at 4.1.0), never the jsdelivr CDN the spikes used.
  - **Self-host Pixelify Sans**: `public/fonts/` holds only `press-start-2p-latin.woff2` today. Google Fonts is blocked.
  - `dataURL()` sprites are fine (`img-src data:`). Canvas textures need nothing.
  - No analytics or fetches to other origins (`connect-src 'self'`).
- **Top-level await:** the spikes `await document.fonts.load(...)` at module top level. Vite 6's default build target (`'modules'`, es2020) rejects top-level await, so wrap boot in an `async function main()`, or set `build.target: 'es2022'`.
- **Strings:** the project rule is that all in-game text goes through `t(key)` (`src/services/i18n.ts`). The spikes hardcoded English, so move strings to `public/locales/en/common.json` when porting.
- **The daily boundary is UTC midnight** (02:00 in Germany during summer time, 01:00 in winter), because `DATE` is the UTC ISO date.
- **Known issue to fix with the hub launch:** the X share card is broken. `og:image` / `twitter:image` are relative (`/og-image.png`), `og-image.png` is a blank navy rectangle, and the live site was still the 2026-06-11 Phase-1 build (as of 2026-10-06). X needs an absolute image URL.
- Static hosting only (Cloudflare Pages). No backend, so a daily leaderboard can only be "compare your share text", which is what the share lines are designed for.

## Origin

Synthesized from spikes: 003a, 003b, 003c (shared patterns), plus the hub at `.planning/spikes/index.html`.
Source files available in: `sources/003a-mr-market-arcade/`, `sources/003b-snowball-idle/`, `sources/003c-swipe-satire/`, `sources/hub-index.html`.
