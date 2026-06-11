# Barren Wuffett

A free mobile-first HTML5 pixel-art adventure that playfully retells a value investor's life story. Zelda-light top-down core, mini-game accents, PWA.

---

## Local Development

```bash
npm install
npm run dev        # dev server at http://localhost:8080 (hot-reload)
npm run build      # production build → dist/
npm run check      # TypeScript type-check (no emit)
npm test           # vitest unit tests
```

The production build output is the `dist/` directory. Cloudflare Pages serves this directly.

---

## Cloudflare Pages — Deploy Settings

Connect the GitHub repo in the Cloudflare Pages dashboard (Create application → Pages → Connect to Git → select this repo). Use exactly these settings:

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(leave blank — repo root)* |
| Node.js version (Environment Variable) | `NODE_VERSION` = `20` |

**How to set NODE_VERSION:** Cloudflare Pages dashboard → project → Settings → Environment variables → Add variable: name `NODE_VERSION`, value `20`. This matches the `.node-version` file in the repo root.

Once connected, every push to the main branch triggers a new deploy automatically.

---

## Security Headers

The file `public/_headers` is copied to `dist/` by Vite and applied by Cloudflare Pages to all routes:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

HTTPS is enforced automatically by Cloudflare Pages — no explicit redirect rule needed.

---

## Deployment

<!-- DEPLOY_URL_PLACEHOLDER — update with the live Cloudflare Pages URL after first deploy -->

Once deployed, record the `*.pages.dev` URL here and in `.deploy-url` at the repo root.

---

## Before Sharing the URL Publicly — Checklist

**Do NOT share the game URL on social media, messaging, or any public channel until all items below are confirmed.**

- [ ] **Geltungssatz confirmed on compoundingknowledge.com/impressum** — The Impressum page linked from the game must explicitly state it also covers the deployed game domain (e.g. `"Dieses Impressum gilt auch für [game domain]."`). Without this sentence, the Impressum-per-Verweis approach is legally insufficient under §5 DDG (Pitfall 5). See Task 3 in 01-03-PLAN.md.
- [ ] **Legal pages reachable in two taps** — From the deployed URL, tap TAP TO START → Settings, confirm both IMPRESSUM and DATENSCHUTZ links load their respective pages (HTTP 200).
- [ ] **Security headers confirmed** — `curl -sSI <deployed-url>/` returns `X-Frame-Options: DENY` in the response headers.
- [ ] **Parody-naming audit passed** — Run the parody-naming grep (see `tests/parody-naming.test.ts`) against all player-facing locale and HTML files. All 3 tests must pass with 0 matches for real investor names.

---

## Legal

- Impressum: linked to compoundingknowledge.com/impressum (see `/impressum` in the deployed game)
- Datenschutz: game-specific privacy policy at `/datenschutz`
- All in-game characters use parody names — no real persons, likenesses, or trademarks

---

## Tech Stack

- Phaser 4 + TypeScript + Vite 6
- Cloudflare Pages (free tier — static hosting, unlimited bandwidth)
- PWA manifest (offline/home-screen install support)
- vitest for unit tests
