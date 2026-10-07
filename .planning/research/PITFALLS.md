# Pitfalls Research

**Domain:** Solo HTML5 mobile browser mini-game hub — Vite multi-page + Phaser 4 PWA, static Cloudflare Pages hosting, strict CSP, German operator, parody of a living public figure, credit-only funnel
**Researched:** 2026-10-07
**Confidence:** HIGH for CSP/build/PWA/iOS mechanics (verified against this repo's actual files and current docs); MEDIUM for X/Twitter card caching specifics (platform behavior is not formally documented and changes); MEDIUM for German legal items (consult qualified counsel before each release, as in v1.0)

This is the v2.0 pitfalls pass for **The Barren Wuffett Hub**. It carries forward and rewrites the v1.0 pitfalls that still apply to this codebase (iOS audio, iOS memory/canvas cost, Persönlichkeitsrecht/parody, Impressum, touch latency) and drops everything tied to the email/Supabase/Brevo funnel, which v2.0 explicitly removes. **Pitfall 4 is fixed as the parody/Persönlichkeitsrecht/endorsement pitfall** because the `spike-findings-barren-wuffett` skill already cites it as "PITFALLS #4" — do not renumber it in any future revision of this file.

Phases referenced below are the planned v2.0 shape: **P1** consolidate branches + shared shell + hub, **P2** arcade release, **P3** idle release, **P4** swipe release.

---

## Critical Pitfalls

### Pitfall 1: Daily-Seed Determinism Drift and Day-Boundary Bugs

**What goes wrong:**
Two players on "the same day" get different games — because the schedule was drawn per-frame instead of precomputed, or because "today" was computed from the device's local clock instead of UTC. A player in California sees Daily #41 for six more hours after a German player has already moved to #42. Separately, a share line reveals too much ("crashed at tick 14 of 20") and spoils the day's outcome for friends who haven't played yet, undermining the entire "compare your day" social loop the daily seed exists for.

**Why it happens:**
`format-shell.md` already specifies the fix (FNV-1a → mulberry32, `DATE` from `new Date().toISOString().slice(0,10)`, build-the-whole-schedule-up-front, fingerprint it) — but it's easy to regress this while porting three separate spikes under time pressure: one format calls `Math.random()` directly for a "polish" animation, or a per-frame `requestAnimationFrame` loop draws from the shared RNG for particle effects, silently consuming entropy at a frame-rate-dependent rate. The UTC-midnight boundary is also non-obvious to a Germany-based tester: it lands at 01:00 or 02:00 local time depending on DST, so manual QA done in the evening never actually crosses a day boundary, and the bug ships unnoticed.

**How to avoid:**
- Keep the RNG and the DOM/Phaser rendering as two hard-separated layers: the pure module (`buildMarket()`, `econ.js`, `cards.js`) consumes the seeded PRNG exactly once per game to build the day's full schedule; everything downstream (animation, particles, screen shake) must use `Math.random()` or a *second*, unseeded PRNG instance, never the daily one.
- Log the fingerprint (`hashStr(JSON.stringify(schedule))`) at run start in every format, and assert in the headless check that the same `?date=` gives the same fingerprint twice and the next date gives a different one — this is already the documented headless-check step; don't skip it per format.
- Test the UTC boundary explicitly with `?date=2026-10-07` vs `?date=2026-10-08` rather than waiting for a real local-midnight crossing.
- For share text: state the *rank or category* ("bought 3 of 3 crashes", "survived to round 40") not the literal sequence of events. Review every format's `shareText()` for anything that reveals the next unplayed step.

**Warning signs:**
- Any `Math.random()` call inside a format's render loop or animation code
- The RNG schedule isn't built once at game start but drawn incrementally during play
- QA only ever tested with "today" and never passed `?date=` for two different days
- Share text includes exact turn numbers, exact order of events, or anything a same-day friend hasn't seen yet

**Phase to address:**
P1 (shared shell) — the seed/schedule pattern and the fingerprint assertion belong in the shared module before any format is ported. Re-verify per release (P2–P4) since each format has its own schedule shape and its own share text to spoiler-check.

---

### Pitfall 2: iOS Safari Web Audio Unlock in the Arcade's Phaser Scene

**What goes wrong:**
The Mr. Market arcade (the only new format using Phaser) ships with sound effects that work on desktop and Android and are silent on every iPhone on first play. Players assume the game is broken.

**Why it happens:**
iOS requires the Web Audio `AudioContext` to be created or resumed inside a direct user-gesture handler. Phaser 4 has built-in unlock handling, but it still depends on the *first* input event reaching Phaser's sound manager directly — if the arcade's title screen is a DOM overlay (per the shared shell pattern) and the "Play" tap is handled by a plain DOM `click` listener that then calls into the Phaser scene asynchronously, the gesture can be lost before Phaser's audio unlock fires. This is a new risk specific to this hub's Phaser+DOM-overlay architecture, not present in v1.0's pure-Phaser adventure.

**How to avoid:**
- Resume/unlock the AudioContext synchronously inside the same DOM tap handler that dismisses the title overlay and starts the Phaser scene — do not wait for a Phaser-internal event to do it.
- Use one audio sprite for the arcade's SFX rather than individual files.
- Test on a real iPhone (not just Android, which the spikes were tested on) before the arcade release ships.

**Warning signs:**
- Audio has only been tested on Android Chrome (true of all four spikes as of 2026-10-07)
- The "Play" button is a DOM element whose handler calls `scene.sound.play()` without first touching `game.sound.context`
- First iPhone playtest: "music/SFX don't work"

**Phase to address:**
P2 (arcade release) — this is the only new format that adds Phaser-driven audio. Verify with a real-device check before the arcade's phone-feel pass is signed off.

---

### Pitfall 3: Code-Drawn Cast Redraw Cost on iOS

**What goes wrong:**
`cast.js` draws every character procedurally (the `Px` grid + auto-outline) rather than loading a pre-baked spritesheet. If a format redraws cast sprites to a `<canvas>` every frame (or regenerates a data-URL sprite on every mood change) instead of drawing once and reusing the result as a Phaser/DOM texture, iPhones — especially older models — show frame drops or battery drain during a 60-second arcade session, and repeated `canvas.toDataURL()` calls inside a game loop stall the main thread.

**Why it happens:**
The cast renderer was built and validated in spike 002 as a one-shot "build this character, now use it," but under porting pressure it's tempting to call the builder function inline wherever a new mood/pose is needed rather than caching the built sprite. This is the v2.0-shaped version of v1.0's Pitfall 3 (oversized texture atlases) — the failure mode has moved from "atlas too big" to "regenerating a small thing too often."

**How to avoid:**
- Build each cast sprite (per mood/pose combination actually used) once at scene boot, cache it as a `Phaser.Textures` key or an `<img>`/canvas element, and only swap the cached reference during play — never call the `Px`-grid builder inside the render loop.
- Cap the number of distinct mood/pose variants per format to what's actually shown (the spikes already parameterize mood as palette overrides, which is cheap — the risk is in *when* that override is applied, not the technique itself).
- Spot-check with Safari's Web Inspector on a real iPhone (or iPhone SE if available) for one full arcade session; watch for GC pauses, not just FPS.

**Warning signs:**
- Any call to the cast builder function inside `update()` or a `setInterval` tick rather than at setup
- Mood changes call `canvas.toDataURL()` or re-run the Px builder instead of swapping a pre-built texture
- Frame drops appear only during mood/pose transitions, not during steady gameplay

**Phase to address:**
P1 (shared cast module: build-once, cache, reuse pattern established here). Re-verify per release (P2–P4) since each format uses the cast differently (arcade: moving sprite; idle: static portrait with mood swaps; swipe: large portrait per card).

---

### Pitfall 4: German Personality Rights (Persönlichkeitsrecht) — Parody Fails When It Reads as Commercial Exploitation or Endorsement

**What goes wrong:**
Even with the email/portfolio funnel removed, the hub still depicts a loving parody of a living, globally recognizable investor across *four* playable formats instead of one adventure. A German court (or a cease-and-desist letter before it gets anywhere near a court) could still find that the cumulative commercial benefit to the creator — more plays, more followers, more visibility for `compoundingknowledge.com` — outweighs the parody's artistic-freedom protection, particularly if any format's content or marketing copy slips into implying the real person endorses the creator, the games, or anything linked from them.

**Why it happens:**
v2.0's "credit, not funnel" model (visible `@Wolfhartvest`, no email, no eToro/wikifolio/portfolio links inside any game) is a genuine legal improvement over v1.0's email-funnel design, but it does not eliminate the underlying personality-rights analysis — it only removes the most obviously commercial trigger (a direct monetization path reachable from inside the game). The risk shifts from "funnel reads as exploitation" to "any of the four formats' copy, card art, or share text reads as endorsement," which is easy to miss because it can happen independently in each of four codebases being ported under time pressure, not just once in a single adventure.

**How to avoid:**
Three rules apply to **every** format, not just the adventure:
1. **Parody names only, everywhere.** Run the same full-text audit used in v1.0 (search UI strings, asset filenames, URL slugs, share text templates, OG/meta descriptions, and the X post copy drafted for each release) for "Warren," "Buffett," "Munger," "Berkshire" before each of the three new releases — not just once at hub launch.
2. **No likeness, no voice.** The code-drawn cast is exaggerated pixel art by construction, which is the correct side of the legal line (a viewer couldn't mistake it for the real person's photo or voice) — keep it that way; don't "upgrade" any format's art with an AI-generated photorealistic portrait later.
3. **Self-evidently satirical, and never endorsing.** The About screen's exact copy (`format-shell.md` §4) already states "not affiliated with any real person... nothing in it is investment advice" — ship that text verbatim on every format, not just the hub. Barren/Mr. Market must never recommend an action, a stock, a platform, or a strategy inside any format; "no eToro/wikifolio/portfolio links inside the game" (already a v2.0 rule) extends to "no in-game text that could be read as financial advice," which is a slightly broader bar than just "no links."

Under UWG §5a(4), the credit must stay **visible, not hidden** — the "made by @Wolfhartvest" line and the About screen must appear with the same prominence on every new format as on the adventure; don't let a port ship with the credit buried one tap deeper than the shared-shell spec because a format's layout didn't have room.

**Warning signs:**
- The real name "Warren Buffett" appears anywhere in a release's UI, share text template, OG description, or draft X post
- Share text or card copy could be read as Barren/the creator recommending a specific action ("Barren says buy now")
- The "made by @Wolfhartvest" credit is present but visually de-emphasized (tiny, low contrast, below the fold) on a new format compared to the adventure
- A release's X post copy drifts toward "play as Warren Buffett" phrasing instead of "play as Barren Wuffett"

**Phase to address:**
P1 (naming/credit audit built into the shared shell and About copy) — but re-run the parody-name and endorsement audit **before every release** (P2, P3, P4), since each is new content, new share text, and a new X post that could individually reintroduce the risk.

---

### Pitfall 5: Impressum and Legal-Link Reachability Breaks Across a Multi-Page Hub

**What goes wrong:**
v1.0 solved "Impressum within two taps" for one single-page adventure. v2.0 adds a hub page plus (eventually) four separate game pages, each a distinct HTML entry in the Vite build. If the Impressum/Datenschutz links are wired into the adventure's `index.html` only (as they currently are — see `index.html`'s `#legal-dom-links` block), the new hub root and the three new game pages ship with **no legal links at all**, because each physical HTML file needs its own route to the footer/legal links; they don't inherit from a shared template automatically in a static multi-page build.

**Why it happens:**
The existing pattern (hidden anchors in `index.html`, activated by a Settings scene) is coupled to the single-page adventure. Porting three new DOM-driven formats as their own Vite entries means someone has to remember to copy the legal-link markup (or a shared partial) into **every** new HTML file, not just the ones most visibly "the game." It's an easy miss because the arcade/idle/swipe pages don't visually resemble a page needing a legal footer — they look like game screens.

**How to avoid:**
- Build one shared footer/legal-links partial (a small include step at build time, or a shared DOM-insertion script loaded by every entry) and make it a hub-shell requirement, not a per-format task.
- Add "Impressum and Datenschutz reachable within two taps" to the phone-feel checklist for the hub page itself and for every one of the three new game pages — not just once for the whole site.
- Verify by loading each new HTML file directly (not just navigating from the hub) since a crawler, a shared link, or a bookmarked URL can land a visitor on `/arcade/` without ever passing through the hub root.

**Warning signs:**
- A new format's HTML file has no `#legal-dom-links` (or equivalent) block at all
- The only way to reach Impressum/Datenschutz from a game page is "go back to the hub first"
- Legal links are added once at hub launch (P1) and never re-checked for the three subsequent releases

**Phase to address:**
P1 defines the shared partial; each release (P2–P4) must verify it's present on its specific new page before deploy.

---

### Pitfall 6: Vite Multi-Page Build + PWA Service-Worker Scope — Stale Cache Serves an Old Build After a Release

**What goes wrong:**
A release ships; the user opens the already-installed PWA (or revisits the site) and sees the *previous* build — old hub tiles, a game that still has yesterday's bug, or (worst case) a mix of old JS and new HTML that throws console errors. This is especially damaging for a staggered-release plan where "the new tile is unlocked" is the entire point of each release's X post — if the service worker serves a cached hub shell that still shows the tile as locked, the release looks like it didn't ship.

**Why it happens:**
This project's current `vite/config.prod.mjs` explicitly defers `workbox.globPatterns` ("Phase 1 uses manifest stub only") — real asset precaching for a multi-page app has never been configured yet. `registerType: 'autoUpdate'` only forces `clientsClaim`/`skipWaiting` on the service-worker *lifecycle*; it does not by itself guarantee the page re-fetches fresh content, and a naive Workbox setup defaults to `navigateFallback` pointing at one `index.html` — a single-page-app assumption that actively breaks a multi-page site, because every game route would fall back to the *hub's* cached HTML instead of its own page when offline or on a cache-miss. Separately, non-hashed files (`index.html` itself, each game's `index.html`, `manifest.webmanifest`) aren't covered by Vite's content-hash cache-busting the way JS/CSS bundles are, so without explicit no-cache headers, both the browser's HTTP cache and Cloudflare's edge cache (`public, max-age=0, must-revalidate` is Cloudflare Pages' own default for most assets, but should be confirmed per file type) can hold an old shell independently of the service worker.
`base: './'` (relative base) in the current Vite config is also SPA-shaped; a multi-page build needs each page's asset references to resolve correctly regardless of which directory depth it's served from — verify this specifically once there's more than one HTML entry.

**How to avoid:**
- When wiring real `workbox.globPatterns` for the hub, explicitly list every HTML entry and **do not** rely on Workbox's default single-entry `navigateFallback`; either disable `navigateFallback` for a static multi-page site (each path is a real, individually-cacheable precache entry) or scope fallbacks per directory.
- Set explicit `Cache-Control` in `public/_headers` for `*.html` and `manifest.webmanifest` (short/no-cache) versus the hashed `assets/*` bundle output (long/immutable) — don't rely on Cloudflare's defaults alone for the files that change on every release.
- After each release's deploy, the headless phone check must load the **production URL** (not just `localhost`), confirm `window.__X__.ready` on the *new* code, and check that a previously-cached client actually updates (simulate by loading the old service worker, then navigating, and confirming the update-and-reload path fires) — this is a new check beyond what the spikes' headless protocol covers, because the spikes never had a deployed, previously-cached version to update *from*.
- Keep `idb-keyval` (the adventure's save) and the hub's `localStorage` (checklist/streak) namespaced distinctly from any Workbox cache name, so a service-worker cache-busting step (e.g., bumping the Workbox cache version) never touches IndexedDB or localStorage — they're separate storage APIs, but confirm no "nuke everything" dev/debug helper exists that clears all storage types together, since that would also wipe the adventure's existing save.

**Warning signs:**
- `workbox.globPatterns` still says "deferred" when the hub ships multiple HTML entries
- No explicit `Cache-Control` rules exist in `public/_headers` for `.html` vs. hashed asset files
- The only tested update path is "fresh install," never "existing installed PWA receiving an update"
- A locked hub tile still shows as locked for a tester who has the site open from before the release, even after a hard navigation

**Phase to address:**
P1 (hub shell: workbox config, per-HTML-entry precache, cache headers) — but this is a **release gate for every subsequent release** (P2–P4), since each one adds new entries to the precache manifest and each is the moment the "stale shell" failure mode would actually be visible to a real returning player.

---

### Pitfall 7: OG/X Share Cards — Relative URLs, SPA-vs-Crawler Mismatch, and X's Own Cache

**What goes wrong:**
The current card is already known-broken (`og-image.png`/`twitter:image` are relative URLs, and the image itself is a blank navy rectangle) — the hub launch is the moment to fix this, but it's easy to fix it only for the hub root and ship the three subsequent releases with the *same* broken pattern, because each new game needs its **own** absolute image URL and its own title/description, not a copy-paste of the hub's meta block. On top of that, X's crawler does not execute JavaScript — if the hub and its games are ever structured as one SPA shell with client-side routing (rather than genuinely separate static HTML files per Vite's multi-page build), every shared link previews with the *same* card regardless of which game it links to, because the crawler only ever sees the one server-delivered `index.html`.

**Why it happens:**
Vite's multi-page build naturally produces a separate physical HTML file per entry (`vite.config` `build.rollupOptions.input`), which is the correct fix — but only if each format's own `index.html` carries its own hard-coded, absolute `og:image`/`twitter:image`/`og:url`/`og:title`. It's easy to centralize these into one shared `<head>` partial for consistency (good for the legal links, per Pitfall 5) and accidentally centralize the *image and title* too, which silently reintroduces one-card-for-everything.
Separately, X aggressively caches a URL's card metadata (reportedly for days) independent of what the live page now serves; the old `cards-dev.twitter.com/validator` was deprecated in 2022, and the current tool is X's own Post Inspector (part of the X Developer Platform) — testing a link in the X compose box itself is not a reliable way to confirm a *new* card after a metadata change, because X may still be serving its last cached snapshot for that exact URL.

**How to avoid:**
- Give each format its own absolute `og:image`/`twitter:image` (full `https://barren-wuffett.pages.dev/...` URL, never `/relative.png`), its own `og:url` matching the exact share URL used by `shareCard()`, and its own title/description — share only the legal-links partial and boilerplate tags (viewport, theme-color, CSP-relevant `<link>`s) across pages, not the OG block.
- Use 1200×630 PNG or JPG (not SVG — unsupported by X's renderer) under a few hundred KB; keep the current `og:image:width`/`height` tags, matched to the real asset.
- After each deploy, re-crawl each release's specific share URL through X's Post Inspector (or by composing and discarding a real draft post, which also forces a re-crawl) — do this for **every new or changed URL**, not just once at hub launch; if a card still shows the old/broken state, a cache-busting query string on the image URL (`?v=2`) forces X to treat it as a new resource.
- If a format's share URL ever includes query parameters (e.g., `?date=` for the daily), confirm X's card still resolves correctly for the canonical shareable URL, not an arbitrary parametrized one — canonicalize `og:url` to the clean path.

**Warning signs:**
- Any format's `og:image`/`twitter:image` is a relative path, or points at the hub's shared image instead of its own
- Two different games' share links preview with the identical card
- A card was "fixed" in code but was never actually re-validated against a live, deployed URL through X's current Post Inspector
- The OG block lives in a shared partial alongside the legal-links footer rather than per-page

**Phase to address:**
P1 fixes the hub's own card and establishes the per-page pattern (separate HTML entries, per-page OG block). Each release (P2–P4) must ship and *verify* its own card before the release's X post goes out — a broken card on launch day cannot be fixed retroactively once the post is live, since the preview is already cached against that tweet.

---

### Pitfall 8: Cloudflare Web Analytics Silently Blocked by the Strict CSP, and a Privacy Page That Doesn't Match Reality

**What goes wrong:**
Cloudflare Web Analytics is added (dashboard toggle, or a manual snippet) and simply produces zero data forever — with no error visible anywhere a casual check would look, because the failure is a browser-level CSP block of a cross-origin script/beacon, not a server error. Separately, the Datenschutz page still needs an update even though the analytics are cookieless, because "no cookies" is not the same as "no disclosure obligation" under GDPR — if any personal data (even transient, IP-address-derived) is processed by a third-party processor (Cloudflare, headquartered in the US), the privacy page must name the processor, the purpose, and the legal basis, exactly as it currently does for the already-removed Supabase/Brevo.

**Why it happens:**
This repo's current `public/_headers` CSP is `default-src 'self'; script-src 'self'; ...; connect-src 'self'` — no exception exists for Cloudflare's analytics domains. Cloudflare's **automatic** Web Analytics injection (toggled in the dashboard) posts same-origin to `/cdn-cgi/rum` on your own domain, so it only needs `script-src https://static.cloudflareinsights.com/beacon.min.js` added (its `connect-src` stays `'self'`); a **manually embedded** snippet instead posts cross-origin directly to `cloudflareinsights.com` and needs `connect-src https://cloudflareinsights.com` as well. Picking the wrong CSP fix for whichever injection method is actually used (or forgetting the CSP change entirely) means the script silently fails to load or its beacon silently fails to send — and because there's no console warning a casual tester would notice (CSP violations only show in DevTools' console, which nobody checks when "the site looks fine"), this can ship unnoticed for an entire release cycle, with the Cloudflare dashboard showing zero traffic and no obvious reason why.

**How to avoid:**
- Decide once: automatic dashboard injection (simpler, but has been reported to behave inconsistently when a custom `_headers` CSP is also present) vs. a manual `<script>` snippet with the site's Web Analytics token, added to every HTML entry (more explicit, matches this project's existing pattern of owning its own CSP rather than relying on Cloudflare's edge HTML transforms).
- Update `public/_headers` CSP to match whichever method is chosen: at minimum `script-src 'self' https://static.cloudflareinsights.com` and the matching `connect-src` addition for that method.
- Confirm data is actually arriving in the Cloudflare dashboard within a day of deploy — don't treat "no console errors visible in a quick check" as confirmation; explicitly open DevTools' Network tab and look for the beacon request succeeding (not blocked, not a failed cross-origin request).
- Update the Datenschutz page to name Cloudflare specifically as the processor for analytics (replacing the Supabase/Brevo mentions per the v2.0 scope), state that it's cookieless and what data is processed (approximate location/device/referrer from the request, not persistent identifiers), and note the international transfer basis (Cloudflare is US-based) — this is a real update, not something that can be skipped because "there's no cookie banner needed."

**Warning signs:**
- `public/_headers` CSP has no `cloudflareinsights.com` entries anywhere, but Web Analytics is "on" in the dashboard
- Nobody has checked the Cloudflare Analytics dashboard for actual incoming data since enabling it
- The Datenschutz page still only lists the old Supabase/Brevo processors, or lists none, after Web Analytics is added
- DevTools console (not checked) would show a CSP violation for the beacon script

**Phase to address:**
P1 — Web Analytics and the matching privacy-page rewrite are both part of the v2.0 Active requirements already and belong in the same phase as the CSP update, before the first real release goes out and needs play-count data.

---

### Pitfall 9: Porting Spike Code Into the Real Build's CSP — CDN Scripts, Google Fonts, Top-Level Await

**What goes wrong:**
Each of the three spikes (`003a`/arcade, `003b`/idle, `003c`/swipe) was built against a loose, CDN-friendly environment — exactly the kind of environment the real build's strict CSP (`script-src 'self'; font-src 'self'`) forbids. Porting naively (copy the HTML, fix imports later) produces a page that is either visibly broken (no font, no Phaser) or that "works" locally because a dev server doesn't enforce the production CSP, and only breaks once deployed to Cloudflare Pages with `_headers` active — which can be the first time anyone notices, potentially after the release's X post is already live.

**Why it happens:**
- The spikes load Phaser from a CDN (jsdelivr); the real build already has `phaser@4.1.0` as an npm dependency, but the arcade's spike-era `<script src="https://cdn...">` tag must be replaced with a module import, not just left as a fallback.
- The spikes use Google Fonts; the real build self-hosts only `press-start-2p-latin.woff2` in `public/fonts/`. Any spike using a different Google Font (or a different weight/subset of the same one) needs that specific file self-hosted and CSP-compatible — there's no `font-src` exception for `fonts.googleapis.com`/`fonts.gstatic.com` in this project's `_headers`, by design.
- The spikes' boot code uses top-level `await document.fonts.load(...)`. Vite 6's default build target (`modules`, effectively es2020) does not support top-level await — this doesn't fail in dev (where esbuild's transform is more permissive) but can fail or behave unpredictably in a production build depending on exact target settings. Wrap boot logic in an `async function main()` or raise `build.target` to `es2022`; don't assume dev-server success means production-build success.
- Local dev-server testing doesn't enforce `public/_headers` at all (`_headers` is a Cloudflare Pages feature, not a Vite dev-server feature) — so a CSP violation introduced during porting is invisible until the first *deployed* preview or production check.

**How to avoid:**
- Treat "runs under the real `_headers` CSP, served from a Cloudflare Pages preview deploy" — not "runs on `localhost`" — as the actual definition of done for each ported format.
- Grep each spike's source for `cdn.jsdelivr`, `fonts.googleapis.com`, `fonts.gstatic.com`, and any top-level `await` before porting, and resolve each one explicitly rather than discovering it as a runtime error after deploy.
- Keep `font-src 'self'` and `script-src 'self'` as non-negotiable; if a format "needs" an exception, that's a sign the port isn't finished, not a reason to loosen the CSP.

**Warning signs:**
- A ported format's HTML still contains a `<script src="https://...">` pointing off-origin
- A new font file appears in network requests that isn't already in `public/fonts/`
- The format works when run via `npm run dev` but hasn't been checked against a Cloudflare Pages preview deploy with `_headers` active
- `tsc`/Vite build succeeds locally but the browser console shows a CSP violation only after deploy

**Phase to address:**
Each release phase (P2 arcade, P3 idle, P4 swipe) — this is a per-format porting checklist item, not something P1 can finish once on behalf of formats that don't exist in the real build yet.

---

### Pitfall 10: Phaser's Own Input Handling Breaks the iOS Share/Clipboard Gesture Chain

**What goes wrong:**
The arcade's share button works on Android and desktop and silently fails (or falls through to a download-anchor fallback instead of the native share sheet) on iOS specifically, because `navigator.share()`/`navigator.clipboard.writeText()` were called from inside a Phaser input event handler instead of a plain DOM event handler.

**Why it happens:**
iOS requires `navigator.share()` (and, less strictly, clipboard writes) to be called synchronously within the call stack of a trusted user-gesture event — this project already knows this precisely (see `src/services/ShareService.ts`'s extensive comments and the "cold-cache path" workaround built specifically to preserve the gesture chain for the adventure's image-sharing flow). `format-shell.md` correctly specifies DOM overlays for every title/end/About screen "so `navigator.share` gets a real button tap" — but the arcade is the one format with a live Phaser canvas underneath those overlays, and it's easy for a share button to end up wired through `scene.input.on('pointerup', ...)` (Phaser's own event emitter, which can introduce a dispatch tick between the raw touch event and the handler) rather than a plain `button.addEventListener('click', shareHandler)` on the DOM overlay button itself.

**How to avoid:**
- Wire every share/clipboard-triggering button as a plain DOM element with a plain `click`/`pointerup` listener, never as a Phaser game object with Phaser's input system, even when it visually sits "inside" the arcade.
- Build the share text synchronously before any `await` (per `format-shell.md` §3) — the same rule the adventure's `ShareService.ts` already encodes for its image-share path.
- Test the actual share tap on a real iPhone for the arcade specifically — the idle and swipe games are pure DOM already and inherit this correctly by construction, so the arcade is the one format where this regression is actually possible.

**Warning signs:**
- A share/copy button is a Phaser `GameObject` with its own `setInteractive()` rather than an HTML `<button>`
- Any `await` (font load, image encode, snapshot) happens between the tap and the `navigator.share()` call
- iOS testing for the arcade's share flow hasn't happened yet (it wasn't needed for the Android-only spike playtests)

**Phase to address:**
P2 (arcade release) — this is the one format where a Phaser canvas and a DOM share overlay coexist; idle and swipe are DOM-only and don't have this failure mode, but should still be smoke-tested on iOS as a formality.

---

### Pitfall 11: Pointer-Events Swipe Fights iOS Scroll, Rubber-Banding, and Pull-to-Refresh

**What goes wrong:**
The Barren-CEO swipe game's card-drag gesture fights the browser's own touch behaviors on iOS Safari: dragging a card down triggers Safari's pull-to-refresh or the page's elastic rubber-band bounce, dragging up or sideways scrolls the page instead of (or in addition to) moving the card, and a fast swipe sometimes gets eaten entirely by the browser's own gesture recognizer before the `pointermove` handler sees it.

**Why it happens:**
Pointer Events alone don't suppress a browser's native touch/scroll behavior — that requires `touch-action` CSS and, for the pull-to-refresh/rubber-band case specifically, `overscroll-behavior` on the scrolling ancestor (and in practice also fixing the page's own scroll position, since even `overscroll-behavior: none` doesn't fully stop rubber-banding on some iOS versions without also setting the body to a fixed, non-scrolling layout). The swipe spike was built and tested on Android Chrome only, where this failure mode is far less pronounced; it's new territory for this format's iOS port specifically.

**How to avoid:**
- Set `touch-action: none` on the swipeable card element itself (not just the container) so the browser never starts its own gesture recognition on it.
- Set `overscroll-behavior-y: none` (or `contain`) on `html`/`body` for the swipe page, and keep the page's own layout non-scrollable (`position: fixed; height: 100%` on `body`, consistent with the existing adventure's `overflow: hidden` pattern in `index.html`) so there's no scroll position for pull-to-refresh or rubber-banding to act on in the first place.
- Use Pointer Events consistently (`pointerdown`/`pointermove`/`pointerup`, with `setPointerCapture`) rather than mixing in `touchstart`/`touchmove`, and call `event.preventDefault()` on `pointermove` for the active drag to belt-and-suspenders block any residual native scroll.
- Test specifically on real iOS Safari (both a fast flick and a slow dangling drag near the top/bottom of the viewport) — this exact combination is what triggers pull-to-refresh, and it won't show up in Android testing or desktop mouse-drag testing at all.

**Warning signs:**
- The swipe card's container doesn't set `touch-action`, or sets it only on an ancestor, not the card itself
- `overscroll-behavior` isn't set anywhere in the swipe page's CSS
- The swipe game has only been tested on Android Chrome and desktop mouse-drag emulation (true as of the 2026-10-07 spike wrap-up)
- A real-device test shows the page itself bouncing/scrolling during a drag, or Safari's refresh spinner appearing

**Phase to address:**
P4 (swipe release) — this is specific to the one format built on drag gestures; the arcade's drag-to-catch mechanic should get the same `touch-action`/`overscroll-behavior` treatment during its own port (P2) as a precaution, even though its drag isn't full-screen.

---

### Pitfall 12: On-Device Streak Storage — iOS Eviction, Private Mode, and Clock Tampering

**What goes wrong:**
The daily checklist and play streak are the hub's only retention mechanic (no backend, no accounts), stored entirely in `localStorage`/IndexedDB. A returning player's streak silently resets to zero with no explanation, because: (a) the site went seven-plus days without being opened and iOS evicted the storage, (b) the player opened the game in Safari Private Browsing, where `localStorage.setItem()` throws immediately (quota is reported as zero) rather than degrading gracefully, or (c) the player changed their device's clock (deliberately, or via travel across timezones near the UTC boundary), making "yesterday" appear skipped even though they played every day.

**Why it happens:**
Apple's documented 7-day cap on script-writable storage (localStorage, IndexedDB, Service Worker registrations) for *unvisited* origins is real — but a PWA actually added to the Home Screen runs in a durable storage context that's exempt from this cap, with its own "days since last use" counter instead. That distinction matters a lot here: if the hub never prompts for or encourages a Home Screen install, every player experiences the *non-exempt*, 7-day-capped behavior in regular Safari tabs — meaning a streak is one unremarkable week of not playing away from silently resetting, which is a much harsher retention cliff than the "Wordle-style daily return" design intends. Private Browsing's zero-quota throw is a separate failure mode: any bare `localStorage.setItem()` call without a try/catch will throw an uncaught exception the first time the checklist tries to persist anything, which can break the whole page's JS execution for that session, not just silently fail to save.

**How to avoid:**
- Wrap every localStorage read/write for the checklist/streak in try/catch (per `format-shell.md`'s own "What to Avoid" list — this is already a documented requirement for the swipe endings collection and should apply identically to the hub's streak) and design the UI to render correctly with a streak of "unknown/unavailable" rather than crashing when storage is unavailable.
- Actively encourage Home Screen install (the existing v1.0 "Add to Home Screen" prompt pattern, resurrected for the hub) specifically *because* it changes the eviction behavior from "7 days since last visit" to "durable until uninstalled" — frame this as a benefit of installing, not just a PWA nicety.
- Compute "which day is this" for streak purposes the same way the daily seed does (UTC date), not the device's local calendar day, so a timezone change doesn't appear to skip or duplicate a day; but also tolerate a player whose system clock is wrong by designing the streak check as "was there a checklist entry for UTC-yesterday" rather than assuming monotonically increasing dates — a clock set backward should not be able to inflate a streak, and a clock set forward should not be able to skip the cooldown on tomorrow's content release.
- Since there's no backend to cross-check against, accept that a motivated player *can* fake a streak by changing their device clock — this is a cosmetic risk only (no leaderboard, no reward beyond the player's own satisfaction), not worth defensive engineering beyond "don't let it crash or produce an obviously nonsensical display."

**Warning signs:**
- Any direct `localStorage.getItem`/`setItem` call for the checklist/streak without a try/catch wrapper
- No "Add to Home Screen" prompt or messaging exists anywhere in the hub
- Streak logic uses `new Date()` (local time) rather than the UTC-ISO date pattern already established for the daily seed
- Testing has only happened in a normal browser tab, never in Safari Private Browsing or after manually clearing site data

**Phase to address:**
P1 (hub shell: checklist/streak storage layer) — the try/catch wrapper, the UTC-date basis, and the Home Screen install prompt all belong in the same shared module the daily seed lives in, before any format depends on streak state.

---

## Moderate Pitfalls

### Pitfall: Touch Input Feel Regressions on New DOM Overlays

Phaser 4's input system and modern mobile browsers have already solved the historical 300ms click-delay problem for the adventure, but each new format introduces fresh DOM overlay buttons and (for the arcade) a drag gesture that's new input code, not a reuse of the adventure's already-tuned controls. Verify `touch-action` is set appropriately on every new interactive element (not just the swipe card — the arcade's drag-to-catch target and the idle game's tap-targets too) and that overlay buttons use `pointerdown`/`click` consistently rather than mixing handler types across formats. Prevention: include a basic "does this feel responsive" phone check for every new format's input, not just the one known swipe-specific risk (Pitfall 11).

### Pitfall: Headless Clip Recording Doesn't Match What Ships

Playwright-recorded gameplay clips (for the X posts) can systematically misrepresent the real build: headless/automated runs may not wait for the self-hosted `Pixelify Sans`/Press Start 2P font to finish loading before the first frame is captured, producing a clip with a visibly different (fallback) font than real players see; recorded video resolution/aspect ratio may not match what X actually renders in-feed (vertical video and in-feed autoplay have specific aspect-ratio sweet spots that differ from a raw 412×915 mobile-viewport capture); and Playwright's recording does not capture audio at all, so a clip for the arcade (which has SFX) can look and sound worse than the real game unless audio is deliberately composited in separately or the clip is captured without claiming it reflects the audio experience. Prevention: explicitly wait for `document.fonts.ready` (or the project's own font-load gate) before starting any recording, verify the recorded file's aspect ratio against X's current video-in-post guidance before each release, and treat clips as visual-only unless audio is separately handled.

### Pitfall: Staggered-Release Teasers Promise More Than the Hub Delivers

With three of four tiles locked at hub launch, the hub can read as an abandoned or incomplete project rather than a "build in public, one release at a time" story — especially to a visitor who arrives from the very first X post and finds a page that's 75% "coming soon." Overpromising in teaser copy (a specific date, a feature not yet decided) creates a second, self-inflicted deadline pressure on top of the real one. Prevention: locked-tile copy should tease *what* ("Snowball — coming soon") without committing to *when*, and each release's own X post should stand on its own merits (a complete, polished single game) rather than apologizing for or over-explaining the other three locked tiles.

### Pitfall: Visual Seam Between the Code-Drawn Cast and the Cozy Pixel-Art Adventure Tile

The adventure's art (Kenney Tiny Town CC0 tileset, hand-authored spritesheet animations) and the three new formats' art (procedurally code-drawn `cast.js` sprites) are deliberately different pipelines built for different reasons — but sitting side-by-side as hub tiles, the stylistic gap (tile density, outline weight, palette) could make the hub itself look visually inconsistent, which is a different and narrower version of v1.0's old "AI asset style drift" pitfall. Prevention: when designing the hub tile thumbnails specifically, treat the adventure's tile as its own deliberately-distinct "early demo" visual register (consistent with the PROJECT.md framing of it as a kept-as-is demo) rather than trying to force stylistic unity across all four tiles — call this out explicitly in the hub's UI design pass so it reads as an intentional "four different cabinets in one arcade" look, not an accident.

### Pitfall: Vite Multi-Page Relative Base Path Breaks Nested Game Routes

The current `vite/config.prod.mjs` sets `base: './'`, which is correct for a single page served from the site root but needs explicit verification once there are multiple HTML entries at different directory depths (e.g., `/`, `/arcade/`, `/idle/`, `/swipe/`) — a relative base resolves differently depending on how deep the serving path is, and an asset reference that works from the root can 404 from a nested game route (or vice versa) if the multi-page `rollupOptions.input` and output directory structure aren't deliberately matched to the base setting. Prevention: once the second HTML entry is added, do a deployed-preview check (not just local dev) that every game route loads its own JS/CSS without any 404s in the network tab, from a direct URL load (not just hub navigation).

---

## Minor Pitfalls

### Pitfall: Locked Tiles Point at Routes That Don't Exist Yet

A locked "coming soon" tile that's accidentally made clickable (or whose markup includes a real `href` to `/idle/` before that route exists in the deployed build) produces a dead 404 for a curious tester or an impatient player. Prevention: locked tiles should be non-interactive (no `href`, a disabled-looking button) until the moment that release actually deploys, not a "soft link" added early for convenience.

### Pitfall: Phaser Scale Manager and DOM Overlay Double-Apply Safe-Area Insets

The adventure's `#game-container` already pads for `env(safe-area-inset-*)` at the CSS level; if a new format's DOM overlay *also* adds its own safe-area padding (copied from a different reference) on top of a Phaser canvas container that already accounts for it, buttons can sit further from the edge than intended, or in the opposite failure, not account for it at all if the new format's overlay is a sibling of the canvas rather than contained within the already-padded container. Prevention: when porting each format's overlay markup, confirm it lives inside (or deliberately outside, consistently) the same safe-area-padded container the existing game uses — don't let each port invent its own answer.

### Pitfall: AI/Procedural Asset Style Drift Returns If Future Formats Add New Art

The code-drawn cast (`cast.js`) is consistent *by construction* across the three new formats because it's one shared module, which meaningfully reduces (but doesn't eliminate) the risk v1.0 flagged for AI-generated art. If a future format or a future hub-polish pass introduces any new art asset outside the `cast.js` pipeline — a new icon, a new background texture — it still needs a locked style reference, because the underlying risk (prompt/tool drift between sessions) is unchanged for anything outside the one shared, deterministic module. Prevention: keep all character/cast art flowing through `cast.js`; if non-cast art is ever added, apply v1.0's style-bible discipline to it specifically.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Copy-paste the OG `<head>` block across every new HTML entry instead of templating it | Faster initial port | Each format's card silently falls out of sync (wrong image, wrong URL) when one is updated and the others are forgotten | Only if a checklist step explicitly re-verifies every page's OG block before each release — otherwise template it |
| Leave `workbox.globPatterns` "deferred" past hub launch | Simpler initial build | Every release ships without real precaching/update guarantees, reintroducing Pitfall 6 each time | Never past P1 — this must be resolved before the hub (with its PWA claim) goes live with more than one page |
| Call the `cast.js` builder inline wherever a sprite is needed, instead of caching | Less code to write per format | Redraw cost on iOS (Pitfall 3); also makes later profiling harder since redraws are scattered | Acceptable only for a one-off, non-animated image (e.g., the About screen's static portrait), never for anything shown repeatedly during play |
| Test only on Android Chrome (continuing the spike-era pattern) through to each release's final check | Faster iteration during build | iOS-specific failures (audio, share gesture, pointer/scroll, storage eviction) ship undetected until a real iPhone test — which the project's own verification practice already mandates before any deploy | Never for the final phone check before deploy; fine for early, fast iteration during the port itself |
| Add Cloudflare Web Analytics without touching `_headers` | Zero config | Silent zero-data failure (Pitfall 8) that looks like "it's just early, not enough traffic yet" rather than a broken integration | Never — the CSP update is part of the same unit of work as adding analytics |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|--------------|------------------|-------------------|
| Cloudflare Web Analytics | Enabling the dashboard toggle (or adding a manual snippet) without updating the CSP in `public/_headers` | Add `script-src https://static.cloudflareinsights.com` (automatic) or the manual-snippet equivalent `connect-src https://cloudflareinsights.com`, matched to whichever injection method is actually used |
| vite-plugin-pwa (Workbox) | Leaving the default single-entry `navigateFallback`, built for an SPA, active on a multi-page static site | Disable or scope `navigateFallback` per route; explicitly glob every HTML entry into precache |
| X / Twitter card crawler | Assuming a fix is live because the code changed and the page "looks right" when loaded in a browser | Re-crawl the exact shared URL through X's Post Inspector (the replacement for the deprecated `cards-dev.twitter.com` validator) after every deploy that touches OG tags |
| `navigator.share()` / clipboard on iOS | Calling it from inside a Phaser input handler, or after any `await`, breaking the trusted-gesture chain | Call it synchronously from a plain DOM event handler, text built before any `await`, exactly as `ShareService.ts` already does for the adventure |
| Cloudflare Pages static hosting + PWA | Assuming Cloudflare's default cache headers are correct for both hashed assets and non-hashed HTML/manifest without checking | Set explicit `Cache-Control` rules per file type in `_headers`: long/immutable for hashed `assets/*`, short/no-cache for `*.html` and `manifest.webmanifest` |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Cast sprite rebuilt on every mood/pose change instead of cached | Frame drops or stutters during mood transitions specifically, worse on older iPhones | Build once per mood/pose actually used, cache as a texture, swap the reference | First arcade session that cycles through several Mr. Market moods quickly |
| Growing Workbox precache manifest with no pruning across releases | Slower install/update time, larger PWA footprint, with no functional benefit from caching assets no format still uses | Audit the precache glob at each release; remove dead spike-era asset references | By the third or fourth release if nothing is ever pruned |
| Idle game's DOM `setInterval`/tick loop left running when its page is backgrounded | Battery drain on a player's phone if the tab/PWA stays open in the background during a long idle session | Pause the tick loop on `visibilitychange`/`pagehide`, resume on return, recomputing elapsed time from a timestamp rather than tick count | Any sufficiently long idle session left open in a background tab |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Loosening the CSP (`script-src`/`font-src`) to make a port "just work" instead of fixing the port | Expands the site's attack surface permanently for a problem that was actually fixable without it (CDN script → npm import, Google Font → self-hosted) | Treat every CSP exception as a last resort requiring a specific, named justification (e.g., the Cloudflare Analytics beacon domain) — never as a quick fix for a porting shortcut |
| Building share text or About-screen content via `innerHTML` with any format-specific/user-influenced value interpolated in | Low-likelihood but real XSS surface if any dynamic value (even something like a URL query parameter echoed into a `?date=` debug display) ever reaches `innerHTML` unescaped | Use `textContent` for all dynamic text insertion; reserve `innerHTML` for genuinely static, hand-authored markup only |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Share text reveals the day's outcome sequence | Spoils the daily comparison for friends who haven't played yet, undermining the core social loop | Share rank/category only ("3 of 3 crashes bought"), never literal event order |
| Locked tile copy implies a specific date | Disappointment/distrust if the date slips, which is likely given "release cadence: each format ships as soon as it passes its phone feel check" (no fixed dates per PROJECT.md) | "Coming soon — follow @Wolfhartvest" with no date commitment, matching the project's own stated cadence |
| Streak silently resets with no explanation (storage eviction, private mode) | Feels broken/untrustworthy, defeating the entire purpose of a return-driving mechanic | Show *why* a streak reset when detectable (e.g., "no local save found") rather than just silently starting over at zero |
| First-time visitor lands on a hub that's mostly locked tiles | Feels like an abandoned or half-built project rather than a staged release | Make the one unlocked tile (plus the adventure) feel complete and polished on day one; don't let the locked tiles dominate the first impression |

---

## "Looks Done But Isn't" Checklist

A release checklist — run this before every deploy, not just the hub launch:

- [ ] **OG/X card renders correctly:** the release's specific share URL has been re-crawled through X's Post Inspector *after* the deploy (not just checked locally) and shows the correct absolute image, title, and description — not the hub's or another format's
- [ ] **Service worker serves the new build:** load the production URL in a browser that already has the *previous* version's service worker installed, confirm it updates to the new content (not just a fresh/incognito load, which always gets the latest version trivially)
- [ ] **Legal links reachable from this exact page:** Impressum and Datenschutz are reachable within two taps from this specific new HTML entry, loaded directly (not via hub navigation)
- [ ] **iOS Safari, real device, normal mode:** audio (if applicable), share button, and the core input gesture all work on an actual iPhone, not just Android/desktop
- [ ] **iOS Safari, Private Browsing mode:** the page loads and plays without an uncaught exception from a bare `localStorage` call; the checklist/streak degrades gracefully rather than crashing
- [ ] **Daily seed determinism:** `?date=` for two different dates produces two different fingerprints; the same date produces the same fingerprint twice
- [ ] **No real names, no endorsement framing:** a fresh full-text search of this release's new strings, share text, OG description, and draft X post copy for "Warren," "Buffett," "Munger," "Berkshire," or anything readable as endorsement/advice
- [ ] **Cloudflare Web Analytics is actually receiving data:** confirmed in the dashboard, not assumed from the absence of console errors
- [ ] **CSP has no new exceptions that weren't deliberately added for a named reason**
- [ ] **Pull-to-refresh / rubber-banding does not fire during the core gesture** (swipe release specifically, and the arcade's drag as a precaution)
- [ ] **A gameplay clip exists, was recorded after fonts finished loading, and matches the real build's current state** (not a stale recording from an earlier port iteration)

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|------------------|
| Stale service worker serving an old build post-release | LOW–MEDIUM | Bump the Workbox cache-busting version (new build hash is usually enough automatically); if players remain stuck, add a one-time "force update" check in the app shell that calls `registration.update()` and reloads on `controllerchange` |
| Broken OG card discovered after the release's X post is already live | MEDIUM | Fix the meta tags, force a re-crawl via X's Post Inspector; the already-posted tweet's preview typically will not retroactively update — treat it as lost for that specific post and verify correctly *before* the next release's post |
| Streak/checklist data lost for a player (storage eviction) | LOW (no backend to recover from; it's cosmetic) | Nothing to restore — ensure the UI explains the reset gracefully going forward; use it as a prompt to surface the "Add to Home Screen" messaging more clearly |
| CSP violation blocking a ported format discovered only after deploy | LOW–MEDIUM | Identify the exact blocked resource via the deployed site's browser console; fix the source (self-host, npm import) rather than loosening the CSP; redeploy |
| Parody-name or endorsement-adjacent copy shipped in a release | MEDIUM–HIGH depending on how visible/viral the release already is | Correct the copy immediately on the live site (static hosting makes this a fast redeploy); if the issue is in a live X post's text, delete/edit the post if the platform allows it, and treat future releases' audits as non-skippable |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|---------------|
| 1. Daily-seed determinism & spoilers | P1 (shared shell) | `?date=` fingerprint assertion in headless check; share text spoiler review per release |
| 2. iOS audio unlock (arcade) | P2 | Real iPhone test of arcade audio before sign-off |
| 3. Cast redraw cost | P1 (shared cast module), re-verified P2–P4 | Safari Web Inspector check during one full session per format |
| 4. Parody/Persönlichkeitsrecht/endorsement | P1, re-audited every release (P2–P4) | Full-text parody-name/endorsement audit before each release's deploy and X post |
| 5. Impressum/legal links multi-page | P1 (shared partial), verified per release | Direct-load each new HTML entry and confirm legal links reachable within two taps |
| 6. Multi-page + SW stale cache | P1 (Workbox config), release gate P2–P4 | Update-from-previous-version test on the production URL before each deploy |
| 7. OG/X card correctness | P1 (hub card + pattern), per-release P2–P4 | X Post Inspector re-crawl of the exact release URL after each deploy |
| 8. Cloudflare Web Analytics + CSP + privacy page | P1 | Dashboard shows real incoming data; Datenschutz names Cloudflare specifically |
| 9. Porting spike CSP violations | P2/P3/P4 (per format) | Deployed Cloudflare Pages preview (not just `localhost`) loads with zero console CSP violations |
| 10. Phaser input breaks iOS share gesture | P2 (arcade specifically) | Real iPhone share-button tap test |
| 11. Pointer-Events swipe vs. iOS scroll | P4 (swipe), precautionary check P2 (arcade drag) | Real iPhone test of fast flick and slow edge-drag; no page scroll/refresh triggered |
| 12. On-device streak storage eviction/private mode | P1 (shared storage layer) | Private Browsing load test; Home Screen install messaging present |

---

## Sources

- [Cloudflare Web Analytics FAQs — CSP guidance for automatic vs. manual beacon injection](https://developers.cloudflare.com/web-analytics/faq/) (HIGH confidence, official)
- [Cloudflare injects a beacon. My CSP said no. — DEV Community](https://dev.to/indiecoredev/cloudflare-injects-a-beacon-my-csp-said-no-20cl) (MEDIUM confidence, community account of the exact silent-failure mode)
- [Beacon.min.js blocked by CORS — Cloudflare Community](https://community.cloudflare.com/t/beacon-min-js-blocked-by-cors/346833) (MEDIUM confidence, community)
- [Cloudflare Pages: Serving Pages — default caching behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/) (HIGH confidence, official)
- [How to configure browser caching in Cloudflare Pages — randombits.dev](https://randombits.dev/articles/tips/cloudflare-pages-caching) (MEDIUM confidence, community, cross-checked against official docs)
- [Vite PWA — Auto Update guide](https://vite-pwa-org.netlify.app/guide/auto-update.html) (HIGH confidence, official plugin docs)
- [vite-pwa/vite-plugin-pwa — service worker update timing and `injectRegister` gotchas, GitHub issues #438, #810](https://github.com/vite-pwa/vite-plugin-pwa/issues/438) (MEDIUM confidence, maintainer/community discussion)
- [Apple adds a 7-Day Cap on All Script-Writable Storage — Didomi](https://support.didomi.io/apple-adds-a-7-day-cap-on-all-script-writable-storage) (MEDIUM confidence, third-party summary of WebKit's published policy)
- [Safari iOS PWA Data Persistence Beyond 7 Days — Apple Developer Forums](https://developer.apple.com/forums/thread/710157) (HIGH confidence, Apple's own developer forum, discussing the Home-Screen-install exemption)
- [(iOS/Safari) localStorage in Private Mode has quota=0 and always throws — Device-Bugs #63](https://github.com/scottjehl/Device-Bugs/issues/63) (MEDIUM confidence, widely-cited community bug catalog)
- [Twitter Card Not Showing Image? 5 Fixes for X (2026) — absolute URL requirement](https://missinglinkz.io/blog/twitter-card-not-showing-image/) (MEDIUM confidence, third-party synthesis)
- [Verifying X Card Metadata and Forcing a Cache Refresh — Tatsu](https://www.tatsu.com/post/verifying-x-card-metadata-and-forcing-a-cache-refresh) (MEDIUM confidence, third-party; the deprecation of `cards-dev.twitter.com` and the shift to Post Inspector is corroborated across multiple 2026 sources in the same search)
- This project's own `src/services/ShareService.ts`, `vite/config.prod.mjs`, `public/_headers`, `public/manifest.webmanifest`, `index.html`, `.claude/skills/spike-findings-barren-wuffett/references/format-shell.md` (HIGH confidence — primary, in-repo source for every codebase-specific claim in this file)
- `.planning/milestones/v1.0-research/PITFALLS.md` — carried-forward pitfalls (iOS audio, iOS memory/canvas, Persönlichkeitsrecht, Impressum, touch latency), rewritten for the v2.0 hub context (HIGH confidence, prior project research)

---
*Pitfalls research for: Barren Wuffett v2.0 — The Barren Wuffett Hub (mini-game hub, Vite multi-page + PWA, Cloudflare Pages, German operator)*
*Researched: 2026-10-07*
