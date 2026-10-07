# Walking Skeleton — Barren Wuffett

**Phase:** 1
**Generated:** 2026-06-11

## Capability Proven End-to-End

A visitor can open the deployed Cloudflare Pages URL on a real phone, see the branded Phaser 4 loading bar and "TAP TO START" main menu in portrait mode, tap into Settings, toggle Music off, reload the page, and find the toggle still off — then reach the Impressum and Privacy Policy pages within two taps. No backend, no database: the "real data" slice is the audio-toggle preference persisted in `localStorage` and survived a full page reload, served from production hosting.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Phaser 4.1.0 + Vite + TypeScript (from official `phaserjs/template-vite-ts`) | RESEARCH.md primary recommendation; largest LLM/community support of any HTML5 engine; ships own TS types (no `@types/phaser`). The official template provides a verified dev/prod Vite split with Phaser chunk-splitting. |
| Build / bundler | Vite (template-pinned version first, upgrade only after a green build) | RESEARCH.md: major Vite bumps occasionally break plugin compatibility; start on the template's pinned version for stability. |
| Data layer (Phase 1) | None — no database by design. `localStorage` for the 2-key audio-toggle boolean only | RESEARCH.md Architectural Responsibility Map: localStorage is adequate for a two-key boolean; all real game save data uses IndexedDB starting Phase 2. Supabase deferred to Phase 3. |
| Auth | None in Phase 1 | No auth surface this phase; Supabase anonymous sessions are explicitly delayed to Phase 3 player opt-in (STATE.md decision). |
| Deployment target | Cloudflare Pages (free tier), Git integration: build `npm run build`, output `dist` | RESEARCH.md: unlimited bandwidth on free tier, automatic HTTPS, no Wrangler CLI needed for static hosting. |
| i18n | Thin custom `t(key)` over `public/locales/en/common.json` (no i18next package in Phase 1) | RESEARCH.md Pattern 4: zero-dependency, migration-compatible calling convention; German added later without code changes (INFR-05). |
| Content model | `ContentRegistry` module + `LevelManifest` interface, empty registry in Phase 1 | RESEARCH.md Pattern 5 / INFR-04: establishes the data-manifest seam so Phase 2 scenes import a typed manifest with zero architectural change. |
| Directory layout | `src/game/scenes/*` (Boot, Preloader, MainMenu, Settings), `src/services/*` (i18n, AudioService, ContentRegistry), `src/input/InputBus.ts` stub, `public/locales/en/`, static legal HTML in `public/` | RESEARCH.md Recommended Project Structure — services are plain TS modules with no Phaser dependency (unit-testable). |
| Test runner | vitest (installed in Wave 0) | VALIDATION.md: services are pure modules; vitest covers INFR-05 (i18n) and LEGL-02 (parody-naming) gates. `tsc --noEmit` is the compile-correctness check. |

## Stack Touched in Phase 1

- [x] Project scaffold (Phaser 4 + Vite + TypeScript, vitest test runner, `tsc --noEmit` check)
- [x] Routing — Phaser scene flow (Boot → Preloader → MainMenu → Settings) + static HTML routes `/impressum`, `/datenschutz`
- [x] "Real data" read AND write — audio-toggle preference written to `localStorage` on toggle, read back on Boot, survives full page reload (substitutes for the DB slice; no database in Phase 1 by design)
- [x] UI — interactive "TAP TO START" gate (also the iOS audio-unlock gesture) and Settings toggles wired to `AudioService`
- [x] Deployment — live on Cloudflare Pages via Git integration (public sharing gated on the Geltungssatz human-action checkpoint)

## Out of Scope (Deferred to Later Slices)

- All gameplay: overworld, NPCs, dialogue, mini-games, boss fights (Phase 2)
- IndexedDB game-save and offline service-worker caching / Workbox (Phase 2 / Phase 4 — Phase 1 ships a PWA *manifest stub* only)
- VirtualJoystick / real InputBus bindings (Phase 2 — Phase 1 only defines the `Action` enum stub and smoke-tests the `phaser4-rex-plugins` import path)
- Supabase, Brevo, email capture, cloud save, analytics (Phase 3)
- German locale *content* (`public/locales/de/common.json` ships as `{}` in Phase 1; English-only content)
- Production pixel-art assets (placeholder logo/favicon acceptable in Phase 1)
- PWA install prompt and Workbox precaching (Phase 4)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Level 1 fully playable offline — OverworldScene + InputBus (VirtualJoystick), NPC dialogue, mini-game + boss, IndexedDB local save, share card. Consumes the `ContentRegistry`/`LevelManifest` seam established here.
- Phase 3: Email funnel + backend — Supabase cloud-save opt-in, Brevo double opt-in, GDPR consent, Investment Journal content, cookieless analytics.
- Phase 4: Levels 2-3 + public launch — additional levels via the ContentRegistry/manifest pattern (no engine code changes), PWA hardening, launch.
