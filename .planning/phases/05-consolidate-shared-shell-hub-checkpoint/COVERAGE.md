# API Coverage — Phase 5 external surfaces

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Surfaces: Cloudflare Web Analytics (05-05, 05-08), Cloudflare Pages via wrangler (05-08), Web Share / Clipboard / X intent (05-02 share flow), X profile link (05-06), Google Fonts as a build-time download (05-02), the browser install prompt (05-06).

| capability | decision | reason |
|---|---|---|
| cloudflare-web-analytics page-view beacon on every page entry | INTEGRATE | |
| cloudflare-web-analytics web vitals reported by the same beacon | INTEGRATE | |
| cloudflare-web-analytics spa route-change tracking | OPT-OUT | not needed: multi-page site, every page is a real navigation |
| cloudflare-web-analytics graphql analytics api export | OPT-OUT | not needed: the creator reads page views in the dashboard |
| cloudflare-web-analytics pages one-click edge injection | OPT-OUT | replaced by the build-time snippet so the CSP allowance is testable on the preview deploy (05-05) |
| cloudflare-pages wrangler direct-upload deploy to a preview alias | INTEGRATE | |
| cloudflare-pages _headers and 404.html static routing | INTEGRATE | |
| cloudflare-pages production deploy | OPT-OUT | explicitly out of scope for Phase 5: the first public deploy is Phase 6 |
| cloudflare-pages git-integration builds | OPT-OUT | v1.0 decision: deploys go through wrangler direct upload only |
| cloudflare-pages functions or server code | OPT-OUT | explicitly out of scope: static hosting only, no backend |
| web-share navigator.share with text and url on touch devices | INTEGRATE | |
| web-share navigator.share with image files | OPT-OUT | not needed: the per-page OG card carries the image; the adventure's own image share flow stays untouched |
| clipboard writeText fallback on desktop | INTEGRATE | |
| x tweet intent url (prefilled compose, the user posts) | INTEGRATE | |
| x profile link from locked cards and their sheet | INTEGRATE | |
| x api posting or follow endpoints | OPT-OUT | explicitly out of scope: no backend, nothing posts without the user's own tap |
| google-fonts build-time woff2 download of Pixelify Sans | INTEGRATE | |
| google-fonts runtime font loading | OPT-OUT | forbidden by the strict CSP (font-src 'self'); fonts are self-hosted |
| browser beforeinstallprompt native install prompt | INTEGRATE | |
