# Stack Research

**Domain:** Multi-page static-hosted PWA mini-game hub — adding routing, per-game share cards, cookieless analytics, self-hosted fonts and clip capture to an existing Phaser 4 + Vite 6 build
**Researched:** 2026-10-07
**Confidence:** MEDIUM (web-search-sourced; see per-row confidence notes — several claims cross-checked against official docs/registry and promoted to HIGH)

This file covers only what's **new** for v2.0. Phaser 4.1.0, Vite 6.3, TypeScript 5.7, vite-plugin-pwa, idb-keyval, phaser4-rex-plugins, vitest, Playwright and the Cloudflare Pages + strict CSP baseline are already validated — see `.planning/PROJECT.md` and the `spike-findings-barren-wuffett` skill. Do not re-litigate those.

## Recommended Stack

### Core Technologies — all zero new runtime dependencies, config-only

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Vite multi-page build** (`build.rollupOptions.input`) | Vite 6.3.1 (already pinned) | One real static path per game + the hub, each deep-linkable from an X post | Vite's own multi-page pattern: register every `index.html` (hub + `games/arcade/`, `games/idle/`, `games/swipe/`, `games/adventure/`) as a named entry under `rollupOptions.input`. The dev server already serves any HTML file at its path with zero config — only `build` needs the explicit map. No router library, no SPA history-API fallback, no new dependency: this *is* the "what NOT to add" answer for routing. (MEDIUM — community sources, matches Vite's own documented MPA pattern) |
| **`base: '/'`** (change from current `'./'`) | — | Keeps every page's asset/font/font-face URLs resolving the same way regardless of folder depth | With one `index.html` at the root and three/four more nested under `games/<name>/`, a relative base (`./`) resolves differently per page depth; an absolute root base (`/`) is one rule for every entry. Cloudflare Pages always serves from the domain root, so `'/'` is safe. This is a one-line config change, not a new package — flag it for the phase that builds the hub shell. |
| **vite-plugin-pwa, same version, no API change** | 1.3.0 (already pinned) | Single PWA shell (one manifest, one service worker) covering the hub + all game pages | `workbox.globPatterns` is a glob over the whole `dist/` output, not per-entry-aware — one pattern like `**/*.{js,css,html,png,woff2}` precaches assets from every page automatically. No per-page PWA config needed. Do set `scope: '/'` / keep `start_url` at the hub root so install-from-any-game-page still registers one shell. (MEDIUM — community sources; the glob-is-build-wide mechanic is also implied by vite-plugin-pwa's own Workbox-wrapping design) |
| **Cloudflare Web Analytics** (dashboard toggle, "automatic" mode — no package) | hosted, free | Cookieless plays-per-release metric already named in PROJECT.md | Turn on the automatic/"Managed" mode in the Cloudflare Pages dashboard: Cloudflare edge-injects `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"…"}'>` into every HTML response, and the beacon POSTs to a same-origin `/cdn-cgi/rum` proxy path. That means **`connect-src 'self'` already covers it** — only `script-src` needs a new origin. No cookies, no consent banner, matches the "cookieless, no backend" constraint exactly. (HIGH — developers.cloudflare.com FAQ + multiple independent CSP-fix PRs converge on the same two origins) |
| **Playwright-rendered static OG/X card PNGs** (no new package) | Playwright 1.60.0 (already a devDependency) | One real, absolute-URL, 1200×630 image per page (hub + 4 games) for X/Discord/Slack link unfolds | Crawlers for X and friends do **not** execute JS, so the `og:image`/`twitter:image` target must be a pre-rendered static file, not the existing runtime `ShareCard.ts` canvas (that one stays for the in-game Web Share flow). Build one small `card.html` per page's content + a 1200×630 Playwright screenshot script (`page.setViewportSize({width:1200,height:630})` → `page.screenshot()`), run once per release and committed to `public/`. Reuses a dependency already in the repo instead of adding a canvas/image library. |

### Supporting Libraries (new devDependencies — Node-side only, never shipped to the browser, so none of these touch the CSP)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@fontsource/pixelify-sans` (static weights) **or** `@fontsource-variable/pixelify-sans` | 5.3.0 | Self-hosted Pixelify Sans woff2 + `@font-face` CSS, satisfying `font-src 'self'` | Prefer the **static** package pinned to the one or two weights the UI actually uses (smaller download than the full variable `wght` axis 400–700). Files land in `node_modules`, `vite build` copies/hashes them like any other asset — no manual download step, no Google Fonts request at runtime. (HIGH — npm registry + fontsource.org both confirm weights `[400,500,600,700]`, subsets `latin`/`latin-ext`/`cyrillic`, current version 5.3.0) |
| `ffmpeg-static` | 5.3.0 | Prebuilt `ffmpeg` binary for Windows (and macOS/Linux), downloaded at `npm install` time | Dev-time only, invoked from a capture script via `child_process.execFile(ffmpegPath, [...])` to convert a Playwright-recorded `.webm` clip to `.mp4` and to a two-pass palette-filter `.gif`. No system ffmpeg install needed on the Windows dev machine. (HIGH — Snyk shows 5.3.0 has no known vulnerabilities, "Sustainable" maintenance status) |
| **Playwright's own `recordVideo` context option** | 1.60.0 (already pinned) | Headless capture of the gameplay clip itself | `browser.newContext({ recordVideo: { dir, size } })` records automatically while the existing phone-viewport headless check plays the seeded game; the video only finalizes on `context.close()`, then `page.video().saveAs(path)`. This is the same Playwright session already used for the per-release phone check (per `format-shell.md` §7) — one script, two outputs (screenshots for the UAT gate, a `.webm` for the clip), not two tools. (HIGH — playwright.dev API + current docs both confirm the finalize-on-close behavior) |

### What was considered and deliberately left out of Supporting Libraries

| Considered | Verdict | Why not |
|---|---|---|
| `gifski` (1.7.1) | Optional, not default | Ships a prebuilt Windows binary and makes visibly nicer GIFs than ffmpeg's palette filter — but its CLI only accepts PNG frame sequences or an `ffmpeg \| gifski` stdin pipe (its direct-video-decode path needs an ffmpeg 6.x the npm wrapper doesn't bundle). Since `ffmpeg-static` is already the one new dependency this milestone needs, ship the two-pass `ffmpeg` palette GIF first; add `gifski` later only if a real release's GIF quality disappoints on X. |
| `fluent-ffmpeg` (2.1.3) | Rejected | A thin fluent-API wrapper around the same few fixed `ffmpeg` command lines (webm→mp4, webm→gif) this project needs. For 2-3 command shapes, run once per release, calling the `ffmpeg-static` binary path directly via `child_process` is simpler and is one fewer dependency to track. |
| `webm-to-mp4` (single-purpose npm package) | Rejected | Redundant wrapper around `ffmpeg`, which is already present via `ffmpeg-static`. |

## Installation

```bash
# Supporting (devDependencies — Node/build-time only, never bundled to the browser)
npm install -D ffmpeg-static

# Font (choose ONE — static weights are smaller; skip if only 1-2 weights are used)
npm install @fontsource/pixelify-sans
# or, only if multiple weights/italic are genuinely needed:
npm install @fontsource-variable/pixelify-sans

# Optional later upgrade, only if ffmpeg-palette GIFs look bad on X:
npm install -D gifski
```

No new runtime/browser dependency is required for the hub itself, the multi-page routing, the analytics beacon, or the OG cards — all four are config changes or dev-time scripts using packages already in the repo (Playwright) or newly-added build-time-only packages (fonts, ffmpeg).

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| `@fontsource/pixelify-sans` npm package | Manual download via `gwfh.mranftl.com` (google-webfonts-helper), same pattern already used for `press-start-2p-latin.woff2` | Use the manual route only if you want zero new `node_modules` entries and are fine re-running the download-and-drop-into-`public/fonts/` step by hand each time a weight changes. The existing font was done this way, so it's a legitimate "stay consistent with existing convention" choice — either is CSP-safe. |
| `ffmpeg-static` + direct `child_process` calls | `ffmpeg-static` + `fluent-ffmpeg` | If the capture script grows into something with many conditional filter chains (not expected here — it's 2-3 fixed commands), the fluent builder earns its keep. Not yet. |
| Playwright screenshot of a `card.html` for OG images | A dedicated image-generation service (`@vercel/og`, Cloudinary, Satori) | Those need either a serverless function (a backend, ruled out) or a paid/metered API call at request time. Pre-rendering once per release with a tool already in the repo is strictly simpler and stays inside the €0/static-only constraint. |
| Cloudflare Web Analytics "automatic" edge injection | Manually embedding the beacon `<script>` yourself | Manual embedding is needed only if automatic mode's zone-level toggle isn't available for this Pages project, or if a cross-origin `connect-src https://cloudflareinsights.com` CSP entry is acceptable and finer control over beacon placement/CSP nonce is wanted. Default to automatic first — it needs only a `script-src` CSP change, no `connect-src` change. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **A UI framework for the hub (React, Vue, Svelte, etc.)** | The hub is a tile grid + a handful of DOM overlays — exactly what the existing idle/swipe spikes already do in vanilla TS + DOM per `format-shell.md`. A framework adds bundle weight, a build-tool integration surface, and breaks the project's one-line `t(key)` i18n convention for no feature this milestone needs. | Vanilla TypeScript + DOM, same shell pattern already proven in the spikes (`.overlay { position: fixed; inset: 0 }` + `.show` class toggle). |
| **A client-side router (React Router, Vue Router, a hash-router, etc.)** | Each game and the hub are real, separate static files at real paths — Cloudflare Pages serves each one directly. A JS router is solving a problem a multi-page static build doesn't have. | Vite's `rollupOptions.input` multi-page entries; plain `<a href>` links between hub tiles and game pages. |
| **A second analytics vendor (GA4, Plausible self-hosted, Fathom, etc.) alongside or instead of Cloudflare Web Analytics** | PROJECT.md already names Cloudflare Web Analytics as the metric; a second vendor means a second CSP origin, a second script to maintain, and — for most of these — either cookies or a paid tier, contradicting "cookieless" and "€0". | Cloudflare Web Analytics only. |
| **A hosted/serverless OG-image-generation API** (`@vercel/og`, Cloudinary, Bannerbear, …) | Needs either a backend function (ruled out by "NO backend") or an outbound request at request- or build-time to a third-party origin, which would need its own `connect-src`/`img-src` CSP entry and likely a paid tier past free limits. | Pre-render the 1200×630 PNG once per release with a Playwright screenshot of a local `card.html`, commit the PNG to `public/`. |
| **`node-canvas` / `@napi-rs/canvas` / `sharp` purely to draw the static OG card** | Learns a second drawing API (Node canvas) for an image that's just styled HTML/CSS text + the existing code-drawn cast sprites — Playwright can screenshot that directly, and it's already a dependency. | Playwright screenshot of an HTML card page. |
| **A Google Fonts `<link>` / `@import` to fonts.googleapis.com** | Blocked outright by the existing `font-src 'self'` (and `style-src`/`connect-src`) CSP, and defeats the point of "self-hosted" in the milestone's own feature list. | `@fontsource/pixelify-sans` or a manual `gwfh.mranftl.com` woff2 download into `public/fonts/`, same as the existing `press-start-2p-latin.woff2`. |
| **vite-plugin-pwa's `injectManifest` strategy / a hand-written service worker** | `injectManifest` exists for custom runtime-caching logic (e.g. API response caching) that a handful of static game pages don't need. The current `generateSW` strategy (already in use, `registerType: 'autoUpdate'`) is sufficient once `globPatterns` covers the new nested `games/**` paths. | Keep `generateSW` (current default); just confirm the glob pattern covers the new multi-page output. |
| **Per-game PWA manifests / separate service worker scopes** | One PWA shell for the whole hub is simpler to reason about and matches "one hub site" from PROJECT.md's Key Decisions. Per-page manifests would let a user "install" a single mini-game disconnected from the hub, fragmenting the one-app intent. | One `manifest.webmanifest` at the root, `scope: '/'`, `start_url` pointing at the hub. |

## Stack Patterns by Variant

**If a game page needs its own distinct install/share identity later (e.g. a standalone "Mr. Market" PWA icon):**
- Still keep one service worker/scope at `/`, but consider per-page `<link rel="manifest">` overrides only then — not needed for this milestone's staggered-release plan, where the hub is always the shared entry point.

**If Cloudflare's dashboard "automatic" Web Analytics toggle isn't available for this Pages project (e.g. account tier gate) at setup time:**
- Fall back to the manual `<script data-cf-beacon>` embed and add `connect-src https://cloudflareinsights.com` to `public/_headers` (not just `script-src`) — the manual embed posts cross-origin, unlike the automatic/proxied beacon.

**If the two-pass `ffmpeg` palette GIF looks muddy on a real release clip:**
- Add `gifski` and pipe through it: `ffmpeg -i clip.mp4 -f yuv4mpegpipe - | gifski -o clip.gif -o -`. Keep the `ffmpeg`-only path as the default so the capture script has no extra dependency until proven necessary.

## Version Compatibility

| Package | Compatible With | Notes |
|---------|------------------|-------|
| `vite@6.3.1` (pinned, unchanged) | `rollupOptions.input` multi-page entries | Multi-page via named HTML entries is a long-standing Vite feature, not a 6.x-specific addition — no version bump needed for this milestone. Do **not** bump to the newer Vite 7/8 line available on npm as part of this work; that's an unrelated, unvalidated upgrade outside this milestone's scope. |
| `vite-plugin-pwa@1.3.0` (pinned, unchanged) | Multi-page `dist/` output | `workbox.globPatterns` operates on the build output directory as a whole; no plugin-version bump needed (2.0.0 exists on npm but is out of scope — same "don't re-validate the baseline" rule). |
| `@fontsource/pixelify-sans@5.3.0` | Any Vite build (plain CSS `@font-face` + local woff2 files) | No bundler-specific integration needed; `import` the CSS or copy the shipped `files/` woff2 into `public/fonts/` to match the existing convention for `press-start-2p-latin.woff2`. |
| `ffmpeg-static@5.3.0` | Node 18+ (already satisfied: `@types/node@^25.9.3` implies a current Node) | Windows binary download happens automatically on `npm install`; the exported `ffmpegPath` string is the path to pass to `child_process`. |
| Cloudflare Web Analytics beacon | `public/_headers` CSP | Exact origins only, no wildcard: `script-src … https://static.cloudflareinsights.com/beacon.min.js/` (trailing slash matters — Cloudflare injects a versioned path like `/beacon.min.js/vX.Y.Z/`, and CSP path-matching needs the prefix slash to match it); `connect-src` can stay `'self'` for the automatic/proxied beacon. |

## Sources

- [Cloudflare Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/) — exact CSP origins, automatic vs manual beacon behavior (HIGH confidence, official)
- Multiple independent CSP-fix PRs/issues (e.g. `Graham-Williams/jjho-fan-almanac#16`, `jahrik/foray-planner#435`) converging on `script-src https://static.cloudflareinsights.com` + `connect-src https://cloudflareinsights.com` for manual embeds (HIGH confidence, cross-checked community sources)
- [Playwright `Video` API docs](https://playwright.dev/docs/api/class-video) — `recordVideo` context option, finalize-on-close behavior (HIGH confidence, official)
- [`ffmpeg-static` on npm](https://www.npmjs.com/package/ffmpeg-static) + [Snyk security page](https://security.snyk.io/package/npm/ffmpeg-static) — version 5.3.0, no known vulnerabilities (HIGH confidence, registry + security scanner)
- [`@fontsource/pixelify-sans`](https://www.npmjs.com/package/@fontsource/pixelify-sans) / [`@fontsource-variable/pixelify-sans`](https://www.npmjs.com/package/@fontsource-variable/pixelify-sans) on npm, [fontsource.org/fonts/pixelify-sans](https://fontsource.org/fonts/pixelify-sans) — version 5.3.0, weights/subsets confirmed (HIGH confidence, registry + official)
- [`gwfh.mranftl.com` (google-webfonts-helper)](https://gwfh.mranftl.com/fonts/pixelify-sans?subsets=latin) — manual self-host alternative, same tool implied by the existing `press-start-2p-latin.woff2` (MEDIUM confidence, community tool, widely used)
- [`gifski` on npm](https://www.npmjs.com/package/gifski) + [gif.ski](https://gif.ski/) + [ImageOptim/gifski README](https://github.com/ImageOptim/gifski/blob/main/README.md) — version 1.7.1, PNG-frames/stdin-pipe input constraint confirmed (MEDIUM-HIGH confidence, npm registry + maintainer README)
- Vite multi-page app community write-ups (`vite-workshop.netlify.app/mpa`, `adhdecode.com` MPA guide) — `rollupOptions.input` pattern (MEDIUM confidence, community, consistent with Vite's own long-documented MPA support)
- `vite-plugin-pwa` Workbox integration write-ups (`deepwiki.com/vite-pwa/vite-plugin-pwa`) — `globPatterns` is build-output-wide, not per-entry (MEDIUM confidence, community)
- Open Graph / Twitter Card per-page guidance (`richdevtools.com`, `expertwebaudit.com`) — absolute-URL requirement, crawlers don't execute JS (HIGH confidence, consistent across every independent source checked, matches the project's own already-known broken relative `og:image` bug)
- `npm view <pkg> version` against the public npm registry (2026-10-07) — exact current versions for `ffmpeg-static`, `gifski`, `@fontsource/pixelify-sans`, `@fontsource-variable/pixelify-sans`, cross-checked against `vite-plugin-pwa`, `vite` and `playwright` to confirm the existing pinned versions are intentionally held back from newer majors (HIGH confidence, primary registry)

---
*Stack research for: Barren Wuffett v2.0 — The Barren Wuffett Hub*
*Researched: 2026-10-07*
