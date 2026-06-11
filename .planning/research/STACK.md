# Stack Research

**Domain:** Mobile-first HTML5/PWA browser game (top-down 2D adventure + mini-games, pixel-art, email capture/cloud-save/leaderboard, GDPR)
**Researched:** 2026-06-11
**Confidence:** HIGH (game engine, hosting, email tool confirmed against current docs/release notes; backend limits from official pricing pages)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Phaser 4** | 4.1.0 (April 2026) | Game engine — rendering, scenes, input, tilemaps, physics, audio | Most documentation, largest community, most LLM training data of any HTML5 engine. Phaser 4 released April 2026 is the new baseline for greenfield projects; API is largely backward-compatible with Phaser 3 for standard objects. 345 KB minified (gzipped), full-featured, native touch pointer system, built-in tilemap support for Tiled JSON, actively maintained by phaserjs org. |
| **TypeScript** | 5.x (bundled via Vite) | Type-safe game code, editor intellisense | Phaser 4 ships full TS types. For an AI-assisted solo project, types catch LLM-generated code errors at compile time before they become runtime bugs. Steep learning cost is ~zero with Vite scaffolding. |
| **Vite** | 6.x | Dev server, hot-reload, production bundler, PWA plugin host | Zero-config for Phaser + TS. `vite-plugin-pwa` adds service-worker and web-app-manifest in one import. Fastest HMR for game iteration. Replaces webpack entirely. |
| **vite-plugin-pwa** | 0.21.x | Service worker generation, offline caching, installable PWA | Zero-config PWA layer; uses Workbox under the hood. `registerType: 'autoUpdate'` + pre-caching all game assets = offline play after first visit, home-screen install on Android/iOS. |
| **Supabase** | (hosted, free tier) | Postgres DB for cloud-save + leaderboard, Auth (email/magic-link), Row-Level Security | Free tier: 500 MB DB, 1 GB file storage, 50 K MAU/month, 500 K edge-function invocations. No pausing as long as any DB request occurs weekly. Generous for a game with early traction. Built-in auth covers email sign-up + double opt-in flow trigger. Supabase client is ~40 KB and works in browser. Alternative (Firebase) was rejected — see below. |
| **Cloudflare Pages** | (hosted, free tier) | Static hosting for game bundle | Unlimited bandwidth, 500 builds/month, 20 K files, 25 MiB max file size, free custom domain, free HTTPS. No request limits on static assets. Zero cost even at viral traffic. |
| **Brevo (formerly Sendinblue)** | (hosted, free tier) | Transactional + marketing email: double opt-in confirmation, welcome email, newsletter | Free tier: 300 emails/day (~9 000/month), unlimited contacts stored, built-in GDPR consent tracking, DPA included, double-opt-in (DOI) flow natively supported in form builder with customisable branded confirmation email. EU-based infra option available (important for GDPR from Germany). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `phaser4-rex-plugins` (virtualjoystick) | latest | On-screen virtual joystick for mobile touch | Required from Day 1 for any touch-controlled movement. Rex's VirtualJoystick plugin is the battle-tested standard for Phaser mobile games — analog distance/angle output maps cleanly to player velocity. |
| `@supabase/supabase-js` | 2.x | Supabase JS client (DB, auth, realtime) | All backend calls: save progress, read/write leaderboard, auth sign-up/sign-in. Runs entirely in browser (no server required). |
| `tiled` (external tool, not npm) | 1.11.x | Tilemap authoring — export Tiled JSON | Phaser 4 natively loads Tiled JSON tilemaps. Tiled is the reference tool; Phaser's parser is built around its format. Use for all world maps. |
| `LDtk` (external tool, optional alt) | 1.5.x | Alternative tilemap editor with superior auto-tiling | If Tiled's workflow feels awkward, LDtk exports to Tiled TMX or JSON and has a better UX. For simple 3–5 level maps, Tiled is sufficient; LDtk pays off on large worlds with auto-tiling rules. |
| `Aseprite` (external tool, $20 one-time) | 1.3.x | Sprite and animation authoring | Best-in-class pixel-art editor, $20 one-time. LibreSprite (free fork) works if budget is truly zero but lacks gradient tool and has a smaller community. At $20 this is the clearest spend in the entire budget. |
| `LibreSprite` (external tool, free) | 1.1.x | Free Aseprite fork | Use only if $20 for Aseprite is not possible. Covers basics (layers, frames, export sprite sheets) but lags behind in polish. |
| `PixelLab AI` (web tool, freemium) | (hosted) | AI pixel art asset generation — characters, tilesets | Unlike Midjourney/Stable Diffusion which fake pixel art, PixelLab generates actual pixel-grid-aligned sprites with correct transparency. Use for character sprites and item icons where hand-drawing isn't feasible. Free tier has generation limits; supplement with Kenney CC0 packs. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Vite dev server** (`npm run dev`) | Hot-reload game loop during development | Game state is preserved between reloads via scene restart patterns; set `antialias: false` in Phaser config from day one for pixel-art crispness |
| **Phaser Editor v5** (optional, beta as of Feb 2026) | Visual scene editor integrated with Phaser 4 | Useful for level layout but adds toolchain complexity; fine to skip for MVP and use code-only scenes |
| **Tiled Map Editor** (free, cross-platform) | Tilemap creation, layer organisation, collision objects | Export format: Tiled JSON (embedded tilesets). Phaser 4 loads this natively via `this.load.tilemapTiledJSON()`. Do NOT use "Collection of Images" tileset type — Phaser's parser doesn't support it; use single embedded spritesheet tilesets only. |
| **Kenney asset packs** (free, CC0) | Base tileset, UI, item sprites | kenney.nl top-down packs (Top-Down Shooter, RPG Urban, Tiny Dungeon) provide consistent 16×16 and 32×32 art that can serve as placeholders or production assets. CC0 = zero attribution required. |
| **Supabase CLI** (`npx supabase`) | Local DB dev, migration management, type generation | Run `supabase gen types typescript` to keep DB schema in sync with TS types in the game client |
| **Playwright or Cypress** (optional) | E2E testing for auth flows, leaderboard writes | Defer for MVP; important once cloud-save goes live to catch regression |

---

## Installation

```bash
# Scaffold Vite + TypeScript project
npm create vite@latest barren-wuffett -- --template vanilla-ts
cd barren-wuffett

# Core game engine
npm install phaser@4

# Supabase client
npm install @supabase/supabase-js@2

# Rex plugins (virtual joystick + other utilities)
npm install phaser4-rex-plugins

# Dev dependencies
npm install -D vite@6 typescript@5

# PWA support
npm install -D vite-plugin-pwa

# Optional: Supabase CLI (local dev / migrations)
npx supabase init
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not / When to Use Alternative |
|-------------|-------------|-----------------------------------|
| **Phaser 4** | Phaser 3 (v3.90, final) | Phaser 3 is fully stable and has more tutorials as of mid-2026, but Phaser 4 is the official new baseline for greenfield. Use Phaser 3 only if you need a specific third-party plugin not yet ported to v4. |
| **Phaser 4** | Kaplay (Kaboom fork) | Kaplay has a gentler initial learning curve but worse performance on large maps, smaller community, and less LLM training data. Fine for game jams; insufficient for a multi-level game requiring tilemap-driven levels and fine-tuned mobile performance. |
| **Phaser 4** | Excalibur.js | Still on 0.x versioning — no API stability guarantee. TypeScript-native and clean architecture, but an order of magnitude less community content than Phaser, meaning less LLM knowledge. High risk for a non-gamedev relying on AI assistance. |
| **Phaser 4** | Godot 4 HTML5 export | Godot's web WASM export baseline is ~30 MB uncompressed (reducible to ~3–6 MB with custom templates + Brotli). Requires learning GDScript or Godot's C#. LLM support for Godot web export edge-cases is thin. Optimal for native-feeling apps; overkill and higher barrier here. |
| **Phaser 4** | PixiJS (rendering only) | PixiJS is a renderer, not a game framework — you'd hand-roll scenes, physics, input, audio, asset loading. More work for no benefit vs. Phaser for this use case. |
| **Supabase** | Firebase (Firestore + Auth) | Firebase free tier (Spark): 1 GB storage, 50 K reads/day, 20 K writes/day. Comparable limits but Google Firestore vendor lock-in, more complex security rules, no native Postgres SQL (leaderboard queries are clumsier). Supabase gives a real Postgres DB and simpler auth APIs. |
| **Supabase** | Cloudflare D1 + Workers | D1 free tier: 500 MB, 10 databases, 5 GB total storage, 50 read queries per Worker invocation. Workers: 100 K requests/day free. Technically viable but requires writing an API layer (Workers code), whereas Supabase JS client hits Postgres directly from the browser with RLS. Higher complexity for same outcome. |
| **Cloudflare Pages** | Netlify / Vercel | Both have generous free tiers too, but Cloudflare Pages has *unlimited bandwidth* on free — critical if a game goes viral. Netlify free caps at 100 GB/month bandwidth. |
| **Brevo** | MailerLite | MailerLite cut its free tier to 500 subscribers in September 2025 (was 1 000). 12 K emails/month stays. Brevo's free tier stores unlimited contacts and sends 300/day (~9 K/month). For early-stage with few subscribers but periodic bursts, Brevo's contact-count headroom is more useful. Switch to MailerLite if daily send rate becomes the bottleneck. |
| **Brevo** | Buttondown | Free tier capped at 100 subscribers — too small. Good for pure newsletter writers, not for a game funnel. |
| **Tiled** | LDtk | LDtk has superior auto-tiling (killer feature for large tile worlds). For 3–5 levels with hand-crafted maps, Tiled's simplicity wins. If later level packs grow to 20+ maps, migrate to LDtk. Note: no official Phaser 4 native LDtk loader; use the TMX export path or a community JSON parser. |
| **Aseprite ($20)** | LibreSprite (free) | LibreSprite lacks gradient tool and modern workflow polish. At $20 Aseprite is the clearest ROI in the project's toolchain. Buy it. |
| **PixelLab AI** | Midjourney / DALL-E / SD for pixel art | General image generators do not produce real pixel art (fixed grid, correct transparency, consistent palette). PixelLab is purpose-built and produces actual sprite-sheet-ready assets. |
| **Vite** | webpack / Parcel | webpack config complexity for a game is unjustified in 2026. Parcel lacks a good pwa plugin. Vite is the 2026 standard. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Kaboom.js** | Abandoned by Replit in 2024; succeeded by Kaplay fork | Kaplay (if you must leave Phaser), but prefer Phaser 4 |
| **Phaser CE (Community Edition)** | Unmaintained Phaser 2 fork, no modern TypeScript types, no WebGL2 | Phaser 4 |
| **ImpactJS** | Paid, last updated 2018, dead ecosystem | Phaser 4 |
| **Construct 3** | Proprietary event-sheet editor, no code = no AI-assistability, subscription-based | Phaser 4 |
| **GameMaker (HTML5 export)** | Subscription cost, large bundles for web, GML not LLM-friendly | Phaser 4 |
| **Tiled "Collection of Images" tileset** | Phaser's tilemap parser explicitly does not support this tileset type — will silently fail | Use single embedded spritesheet tilesets only |
| **Firebase Realtime Database** | Deprecated in favour of Firestore; real-time sync unnecessary for cloud-save/leaderboard | Supabase Postgres |
| **SendGrid free tier** | Only 100 emails/day free; Twilio acquisition added complexity; no native DOI form builder | Brevo |
| **Webpack** | Excessive configuration overhead, slow HMR for iterative game dev | Vite 6 |
| **Godot WASM without custom export template** | Default HTML5 export is ~32 MB uncompressed; custom template recompile required for acceptable web load times, which needs a C++ build environment | Phaser 4 (no WASM, pure JS/WebGL) |

---

## Stack Patterns by Variant

**If PWA install prompt is a priority (Android home-screen install):**
- Add `display: "standalone"` and correctly sized icons (192×192 and 512×512 maskable) to the vite-plugin-pwa manifest config
- Trigger `beforeinstallprompt` event manually with a custom "Add to Home Screen" button inside the game UI after the player completes level 1

**If Supabase free tier project pausing becomes an issue (7-day inactivity pause):**
- Add a lightweight Cloudflare Worker (free: 100 K requests/day) scheduled cron that pings the Supabase health endpoint every 5 days
- Or upgrade to Supabase Pro ($25/month) only after sufficient traction

**If Brevo's 300 emails/day limit becomes a bottleneck (viral spike):**
- Queue sends via Supabase Edge Functions with an exponential spread rather than immediate batch send
- Or switch to MailerLite once subscriber count stays below 500 (higher daily send rate than Brevo relative to small lists)

**If pixel-art crispness is broken (blurry sprites):**
- Set `antialias: false, pixelArt: true` in the Phaser Game config object — this must be set before first render, cannot be toggled
- Also set `image-rendering: pixelated` on the game canvas via CSS

**If i18n (German localisation) is added later:**
- All in-game strings should be wrapped in a thin `t(key)` function from day one — even if it's just `const t = (k) => strings[lang][k]` — so the translation layer requires zero refactor

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `phaser@4.1.0` | `typescript@5.x`, `vite@6.x` | Phaser 4 ships its own TS types; no `@types/phaser` needed |
| `phaser4-rex-plugins` (VirtualJoystick) | `phaser@4.x` | Confirm `phaser4-rex-plugins` package name on npm; the older package `phaser3-rex-plugins` targets Phaser 3 — wrong package will cause import errors |
| `@supabase/supabase-js@2` | All modern browsers, no Node required | Browser-only usage; RLS policies on Supabase replace any server-side auth middleware |
| `vite-plugin-pwa@0.21.x` | `vite@6.x` | Use `registerType: 'autoUpdate'`, `workbox.globPatterns: ['**/*.{js,css,html,png,jpg,mp3,ogg}']` to cache all game assets |
| `tiled` (map files) | `phaser@4.x` (via `this.load.tilemapTiledJSON`) | Export tilemaps as JSON with embedded tilesets (not external); keep Tiled version ≥ 1.9 to match Phaser's parser expectations |

---

## Free Tier Limits Summary

| Service | Free Limit | Upgrade Trigger |
|---------|-----------|-----------------|
| Cloudflare Pages | Unlimited bandwidth, 500 builds/month, 20 K files | >20 K game assets (very unlikely) |
| Supabase | 500 MB DB, 1 GB file storage, 50 K MAU/month, pauses after 7 days inactivity | >50 K monthly logged-in users |
| Brevo | 300 emails/day (~9 K/month), unlimited stored contacts | Sending >300 confirmation/welcome emails in a single day |
| Cloudflare D1 (if used) | 500 MB DB, 5 GB total, 10 databases | Not needed with Supabase; only relevant if replacing Supabase backend |
| Cloudflare Workers (if used) | 100 K requests/day | Only needed for Supabase keep-alive cron |

---

## Sources

- [Phaser 3 vs Phaser 4: What Changed](https://phaser.io/news/2026/05/phaser-3-vs-phaser-4) — version comparison, migration notes (HIGH confidence, official)
- [Phaser v4.1.0 download page](https://phaser.io/download/release/v4.1.0) — confirmed version 4.1.0 (April 30 2026), 345 KB minified (HIGH confidence, official)
- [Phaser vs Kaplay vs Excalibur comparison](https://phaser.io/news/2026/04/phaser-vs-kaplay-vs-excalibur-2d-web-game-framework) — engine comparison (HIGH confidence, official Phaser blog)
- [Supabase Pricing](https://supabase.com/pricing) — free tier limits verified (HIGH confidence, official)
- [Supabase Free Tier Limits 2026](https://aiagencyplus.com/supabase-free-tier-limits/) — free tier detail (MEDIUM confidence, third-party synthesis)
- [Brevo Pricing Plans](https://www.brevo.com/pricing/) — 300 emails/day free tier (HIGH confidence, official)
- [MailerLite Free Plan Update](https://www.mailerlite.com/help/free-plan-update-faq) — 500 subscriber cap (September 2025) (HIGH confidence, official)
- [Cloudflare Pages Limits](https://developers.cloudflare.com/pages/platform/limits/) — file/build limits (HIGH confidence, official)
- [Cloudflare D1 Limits](https://developers.cloudflare.com/d1/platform/limits/) — 500 MB / 5 GB free limits (HIGH confidence, official)
- [vite-plugin-pwa GitHub](https://github.com/vite-pwa/vite-plugin-pwa) — PWA integration approach (HIGH confidence, official)
- [Phaser mobile games guide](https://generalistprogrammer.com/tutorials/phaser-mobile-games-guide) — touch/mobile specifics (MEDIUM confidence, community)
- [Rex VirtualJoystick plugin docs](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/virtualjoystick/) — joystick implementation (MEDIUM confidence, community)
- [PixelLab AI review](https://www.jonathanyu.xyz/2025/12/31/pixellab-review-the-best-ai-tool-for-2d-pixel-art-games/) — pixel art AI tool assessment (MEDIUM confidence, community)
- [Godot web export size discussion](https://forum.godotengine.org/t/how-to-reduce-the-size-of-the-games-release-bundle-for-html/92757) — WASM size data (MEDIUM confidence, community)
- [Best HTML5 Game Frameworks 2025](https://generalistprogrammer.com/tutorials/best-html5-game-frameworks-2025) — cross-engine comparison (MEDIUM confidence, community)

---

*Stack research for: Mobile-first HTML5/PWA browser game — Barren Wuffett*
*Researched: 2026-06-11*
