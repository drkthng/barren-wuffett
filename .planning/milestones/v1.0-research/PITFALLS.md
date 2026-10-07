# Pitfalls Research

**Domain:** Solo HTML5 mobile browser game + marketing funnel (parody, living-person subject, German operator)
**Researched:** 2026-06-11
**Confidence:** HIGH (legal/GDPR sections: MEDIUM — consult qualified counsel before launch)

---

## Critical Pitfalls

### Pitfall 1: The "Four Genres" Trap — Treating Mini-Games as Equal Pillars

**What goes wrong:**
The developer builds the Zelda-light core, then adds a Mario platformer level, a Kingdom resource mini-game, and a point-and-click scene — each as a full, self-contained, polished experience. What was planned as "accents" becomes four games' worth of art, logic, and balancing work. The project never ships.

**Why it happens:**
Each mechanic feels small in isolation. "One Kingdom screen can't take more than a day." Individually true; collectively the work multiplies geometrically because each new genre requires unique art, unique input handling, unique balancing, and unique testing on mobile. First-time developers systematically underestimate integration and polish costs.

**How to avoid:**
Define a hard rule at project start: mini-games are capped at one mechanic, one screen, one reusable asset set, and no more than 20% of total dev time combined. The Zelda-light core loop (movement, collision, NPC interaction, boss fight) ships first and is locked before any mini-game work begins. If a mini-game can't be built reusing existing sprites and a single new input handler, it doesn't ship in v1.

**Warning signs:**
- Any mini-game requires its own tileset, animation set, or physics system
- Scope estimate for a mini-game exceeds 2 days
- You are designing a mini-game before the core loop has a playable prototype
- You hear yourself say "but this mechanic would really make the level special"

**Phase to address:**
Phase 1 (core loop prototype) — the definition of done must be "core loop is fun on mobile, no mini-games." Phase 2 can introduce the first mini-game, gated by Phase 1 completion.

---

### Pitfall 2: iOS Safari Audio Lockout — Sounds Never Play on First Game Session

**What goes wrong:**
All game audio (music, SFX, boss hit sounds) is silent on iOS Safari until a specific workaround is implemented. Players assume the game is broken and drop off before the first level ends. Reviews and shares never happen.

**Why it happens:**
iOS requires the Web Audio API `AudioContext` to be created or resumed inside a direct user gesture handler (`touchstart`/`touchend`/`click`). The game framework (e.g., Phaser) often auto-creates the AudioContext on load, which iOS silently suspends. Music that works perfectly on desktop and Android is completely absent on all iPhones and iPads.

**How to avoid:**
On the very first user tap (e.g., the "Tap to Start" splash screen), explicitly resume or unlock the AudioContext: `audioContext.resume()`. Use a single audio sprite (one concatenated audio file) rather than many individual files — iOS historically only streams one audio resource at a time and has rejected multi-track simultaneous playback. Phaser 3.60+ has built-in iOS audio unlock handling; verify it is enabled and test on a real iPhone before any other feature work.

**Warning signs:**
- You have only tested audio on desktop Chrome or Android
- The project uses `new Audio()` or multiple `<audio>` elements instead of Web Audio API / audio sprites
- No "tap to start" gate exists — the game tries to auto-play on load
- First playtest on iPhone returns: "the music doesn't work"

**Phase to address:**
Phase 1 (core loop prototype) — audio unlock must be in the initial scaffolding, not retrofitted. Test on a real iOS device as part of Phase 1 acceptance criteria.

---

### Pitfall 3: iOS WebGL Memory Crash — Game Silently Kills Itself Mid-Session

**What goes wrong:**
The game runs fine during development on desktop. On iPhones and mid-range Androids, the browser process is silently killed after 2–5 minutes of play because textures exceed ~256MB of GPU-accessible memory (Safari's process limit is approximately 1.25 GB combined). The player sees a blank screen or a reload prompt with no explanation.

**Why it happens:**
Sprite sheets generated at 4096×4096 resolution, uncompressed PNG atlases, and multiple large tilesets accumulate quickly. WebGL on iOS does not gracefully degrade — it crashes. Desktop developers with 8–16 GB GPUs never encounter this limit during development.

**How to avoid:**
Hard caps: no single texture atlas larger than 2048×2048 (prefer 1024×1024 for sprite sheets). Use TexturePacker or equivalent to pack tightly. Unload atlases when switching levels rather than keeping all loaded simultaneously. Test total GPU memory footprint with Safari's Web Inspector (`Layers` panel) on an iPhone SE (the most memory-constrained popular device) before declaring any level complete.

**Warning signs:**
- Any sprite sheet is wider or taller than 2048px
- You load all level tilesets at game start rather than per-level
- Total uncompressed texture memory exceeds 150MB across all loaded assets
- Game works on desktop but crashes on iPhone after ~3 minutes

**Phase to address:**
Phase 1 (asset pipeline setup) — establish the 2048×2048 hard cap and per-level load/unload architecture from day one. This is nearly impossible to retrofit without reworking the entire asset pipeline.

---

### Pitfall 4: German Personality Rights (Persönlichkeitsrecht) — Parody Fails When Commercial Purpose Dominates

**What goes wrong:**
The game uses recognizable traits of Warren Buffett (voice cadence, signature phrases, appearance details) primarily to drive traffic to investment portfolios. A German court examines the content and finds the satirical/parody wrapper is secondary to a commercial goal. The primary purpose test fails: the personality rights of the living subject override the artistic freedom defense. Cease-and-desist (Abmahnung) or injunction follows.

**Why it happens:**
German law (Persönlichkeitsrecht under Art. 2 GG + Art. 1 GG) gives living persons strong protection against commercial exploitation of their identity without consent. Unlike US First Amendment doctrine, German courts apply a balancing test that heavily weights whether the commercial benefit could have been achieved without using the person's identity. The game's explicit marketing-funnel purpose makes this test harder to pass if the portrayal feels like endorsement or association.

**How to avoid:**
Three non-negotiable rules throughout the entire game:
1. **Use only parody names throughout** — "Barren Wuffett" not "Warren Buffett," "Mr. Market" not real antagonist names, fictional company "Omaha Holdings" not "Berkshire Hathaway." No real names appear anywhere in UI, code comments surfaced to users, or marketing copy.
2. **No realistic likeness or voice simulation** — pixel art exaggeration is fine (the legal standard is whether a viewer would mistake it for the real person's endorsement or genuine image). No AI-generated photorealistic faces, no voice cloning.
3. **Satire must be self-evidently satirical** — the game must clearly signal parody (exaggerated cartoon style, absurd scenarios, explicit "parody" label in the app description and legal notices). The Investment Journal must present content as the creator's own investing views, not attributed to Buffett.

Charlie Munger (deceased January 2024): German post-mortem personality rights protect the deceased from defamation and commercial exploitation for 10 years after death. A respectful, clearly fictional portrayal ("Charlie" as a wise mentor NPC in pixel form) is well within parody norms, but avoid any implication he endorsed the portfolios.

**Warning signs:**
- Real name "Warren Buffett" appears anywhere in game UI or store descriptions
- Screenshots could be mistaken for Buffett's own endorsement of portfolios
- Marketing copy reads "play as Warren Buffett" rather than "play as Barren Wuffett"
- The Investment Journal quotes are attributed to Buffett rather than the creator's own analysis

**Phase to address:**
Phase 1 (game identity/naming) — every character, company, and location name must be finalized as parody variants before any asset is created. Phase 3 (Investment Journal) — all journal content must carry clear creator attribution, not "quotes from Buffett."

---

### Pitfall 5: GDPR Email Capture Without German UWG Double Opt-In — Fines up to €50,000

**What goes wrong:**
The email capture flow collects addresses and immediately begins marketing emails (Investment Journal previews, portfolio updates). Under German UWG §7, direct marketing without confirmed double opt-in is an unfair commercial practice. Competitors or consumer protection organizations can issue Abmahnungen. GDPR fines can reach 4% of annual global turnover or €20M, plus UWG-specific fines up to €50,000 for the missing confirmation step.

**Why it happens:**
Developers ship a "single opt-in" flow because GDPR itself does not explicitly mandate double opt-in for email — only documented consent. They miss that Germany's UWG §7 independently requires the confirmation email step, and it applies regardless of whether the operator is German (it applies to anyone targeting German users).

**How to avoid:**
Implement double opt-in before any marketing email is sent:
1. User enters email in-game (cloud-save, leaderboard, or Journal unlock flow)
2. Transactional confirmation email is sent immediately: "Confirm your email to save your progress"
3. Only after link click is the address added to any marketing list
4. Store opt-in timestamp, IP, and confirmation timestamp for every subscriber (audit log required)
5. Every marketing email must include an unsubscribe link that works within two clicks
6. Privacy Policy and Impressum must be linked from the email capture screen, not buried

**Warning signs:**
- Email tool (Brevo, Mailchimp, etc.) does not have double opt-in enabled as the default list setting
- "Subscribe to updates" checkbox is pre-checked
- No confirmation email is sent before the first marketing message
- Privacy Policy is not linked from the email capture modal

**Phase to address:**
Phase 2 (backend/email integration) — the double opt-in flow must be part of the initial email tool setup, not added post-launch. Never send a single marketing email to an unconfirmed address.

---

### Pitfall 6: Impressum Missing or Hard to Find — Automatic Abmahnung Risk

**What goes wrong:**
The game launches as a PWA/website without an easily accessible Impressum (legal notice). German law (§5 TMG) requires full contact information (name, street address, email) to be reachable within two clicks from any page. Competitors and "Abmahnanwälte" (warning letter lawyers) actively scan new websites; a missing or incomplete Impressum triggers a formal legal warning with a demand for payment of legal fees (often €300–1,500 per incident).

**Why it happens:**
Developers from outside Germany or without legal training do not realize that even a free, non-commercial game with a single affiliate link or marketing element triggers the full Impressum obligation. The EU hobby exception is very narrow; any commercial purpose (the funnel) removes it entirely.

**How to avoid:**
Before the domain goes live:
1. Create `/impressum` with: full legal name, street address (not a PO box), email address, and if applicable, VAT ID or trade register number
2. Link "Impressum" in the footer of every page and from the in-game settings/about screen
3. Create `/datenschutz` (Privacy Policy) covering: what data is collected, legal basis (consent for marketing, legitimate interest for analytics), data processors used (Supabase, email tool, Cloudflare), right to erasure, right to access, Data Protection Officer contact if applicable
4. Both pages must be in German (or bilingual) since the target audience includes German speakers

**Warning signs:**
- The game is live on a domain with no `/impressum` route
- Impressum is only accessible from a settings screen inside the game, not from the main HTML page
- The privacy policy does not name the specific third-party processors (Supabase, email provider)
- Impressum uses only a PO box or virtual office address

**Phase to address:**
Phase 1 (project scaffolding) — Impressum and Privacy Policy pages must be created before any domain is made publicly accessible, even for "soft launch" testing with real users.

---

### Pitfall 7: Email Gate as a Hard Wall — Kills Retention Before Value Is Established

**What goes wrong:**
The email capture appears before the player has experienced any meaningful gameplay (e.g., at the title screen, or after 90 seconds). Players who haven't yet experienced the core loop see the gate as an aggressive data grab and bounce. Bounce rates above 70% at the gate are common; for investment/finance audiences (high skepticism, privacy-conscious) they can reach 90%.

**Why it happens:**
Developers optimizing for email capture treat it as a funnel metric and move it as early as possible. They fail to account for the "trust gap": a brand-new game from an unknown developer has zero trust capital. Finance audiences are especially skeptical of anything that resembles a lead-gen scheme — they've seen too many "free stock tips for your email" offers.

**How to avoid:**
The email gate must come after earned trust:
- **Cloud-save gate**: Trigger only when the player has completed at least one full level and shows intent to continue (e.g., attempts to close the tab or return to the start screen). Frame it as saving progress, not marketing.
- **Leaderboard gate**: Trigger only when the player submits a score they care about.
- **Journal unlock gate**: Trigger only for the bonus Investment Journal entry, positioned as exclusive bonus content the player actively wants.
- Never show an email prompt on first visit, during the first 5 minutes, or after a failure state (rage-quit moment).
- The email capture UI must look like a feature, not a popup ad. No dark-pattern pre-checked boxes. No "you must provide your email to continue."

**Warning signs:**
- Email prompt appears within the first 2 minutes of first play
- Email capture is gated on starting the game, not completing meaningful progress
- The CTA copy is "Sign up for updates" rather than "Save your progress"
- No value exchange is visible at the prompt (what does the player get?)

**Phase to address:**
Phase 2 (email/funnel integration) — define the exact trigger conditions for each email touchpoint and get them reviewed against the player journey before implementing. Never move triggers earlier to "improve conversion" without testing drop-off impact.

---

### Pitfall 8: Investment Journal Reads as Regulated Financial Promotion

**What goes wrong:**
The Investment Journal entries contain specific portfolio recommendations, return figures, or calls to action ("invest in X now"). Under German/EU law, this crosses from general financial education (permitted without authorization) into regulated investment advice or financial promotion requiring BaFin authorization. The game and creator's profiles become subject to enforcement.

**Why it happens:**
BaFin has confirmed that finfluencers who address a broad, heterogeneous audience with general views do not constitute regulated investment advisors. But the line is crossed when content includes: (a) specific buy/sell recommendations for named securities, (b) return forecasts or guarantees, (c) content that appears personalized to the viewer, or (d) content where a financial relationship is not disclosed. A simple "This is not investment advice" disclaimer does NOT immunize content that is functionally a recommendation.

**How to avoid:**
Each Journal entry must be:
1. Clearly framed as the creator's personal opinion and learning, not professional advice
2. Educational in nature (principles, mental models, historical context about Buffett's approach)
3. Accompanied by a visible, prominent disclaimer: "This is personal opinion and entertainment, not investment advice. Past performance does not guarantee future results."
4. The wikifolio/eToro link is framed as "see how I apply these principles" (transparent personal portfolio), not "follow my trades" or "I recommend this investment"
5. Any affiliate or partnership relationship with eToro must be disclosed prominently (not buried in a footer)

**Warning signs:**
- Journal entry says "I think you should buy X" or names a specific stock as a current opportunity
- Return figures are presented without risk warnings
- The eToro/wikifolio link uses anchor text like "Join my portfolio" rather than "View my public portfolio"
- No financial disclaimer is visible on Journal entries

**Phase to address:**
Phase 3 (Investment Journal content) — every piece of Journal content must pass a "would BaFin read this as a specific recommendation?" test before publishing. Create a content checklist that every Journal entry must satisfy before it ships.

---

### Pitfall 9: Supabase Free Tier Pauses + Auth Email Rate Limits Destroy Launch Day

**What goes wrong:**
The game goes live and gets shared on social media. New players hit the email capture flow. Within hours, the Supabase auth email rate limit (2 emails/hour on the default SMTP) is hit and confirmation emails stop sending. Players who try to register get no confirmation email, assume the feature is broken, and never confirm their subscription. Simultaneously, if the Supabase project has been idle during development, it has been auto-paused and the first production requests fail with 503 errors.

**Why it happens:**
Supabase's default free-tier SMTP is rate-limited to 2 auth emails per hour — a limit designed for development, not production. Developers test with one or two email addresses, never hit the limit, and don't configure a custom SMTP before launch. The 1-week inactivity pause catches projects that had a "build sprint then pause" development pattern.

**How to avoid:**
Before launch:
1. Configure a custom SMTP provider (Brevo, Resend, or Mailgun all have free tiers) — this raises the limit to 30 users/hour minimum, configurable higher
2. Send a test "keep alive" ping or configure a cron trigger to prevent project pausing during final pre-launch weeks
3. Set up Supabase's "No-pause" configuration if it becomes available, or document the manual unpause process
4. Implement a visible "check your email" state in the UI with a "resend confirmation" button — users who don't get the email need a self-service path

**Warning signs:**
- Auth emails are still using Supabase's default SMTP in the week before launch
- No custom SMTP provider has been added to the Supabase dashboard
- The project has been inactive for more than 5 days at any point in the last month
- There is no "resend confirmation email" button in the UI

**Phase to address:**
Phase 2 (backend integration) — custom SMTP must be configured as part of the initial Supabase setup, not as a pre-launch task. Treat the default SMTP as dev-only.

---

### Pitfall 10: AI Asset Style Drift — Incoherent Visuals Undermine the 16-Bit Identity

**What goes wrong:**
Level 1 assets were generated with prompt "16-bit pixel art, Zelda SNES style, warm palette." Three weeks later, boss fight assets are generated with "retro pixel art game character." The results have different pixel densities, color palette counts, outline weights, and lighting angles. The game looks like three different projects stitched together. Players perceive it as unfinished or amateurish; the retro-nostalgia aesthetic — a core part of the parody's charm — is lost.

**Why it happens:**
AI art tools are prompt-sensitive and model-update-sensitive. Without a locked prompt template and reference sheet, outputs drift naturally. Solo developers generating assets weeks apart cannot rely on memory for exact parameters.

**How to avoid:**
Create a "style bible" before generating any game asset:
- Canonical prompt template (locked, versioned): pixel size, palette constraints (max 32 colors), outline style, shadow angle, animation frame count conventions
- Reference sprite sheet with 3–5 canonical characters showing the expected style
- Never generate assets without the canonical template; treat deviations as bugs
- Keep all generation sessions in a log (tool, prompt, date, which asset)
- If an AI tool updates its model mid-project, regenerate the reference sprites and compare before generating new assets with the new model

For free assets (Kenney, itch.io), only use assets from packs with a consistent style; mix packs only if they share the same pixel density and palette conventions.

**Warning signs:**
- Two characters in the same scene have different outline thickness
- Background tiles have a different perspective angle than the player character sprite
- Asset log doesn't exist or hasn't been updated in more than one sprint
- You notice yourself saying "I'll fix the style inconsistency in post"

**Phase to address:**
Phase 1 (art direction) — the style bible and canonical reference sprite must be created before the first gameplay asset. Every subsequent asset phase begins with a style-consistency review.

---

### Pitfall 11: Touch Input Latency and "300ms Click Delay" on Mobile

**What goes wrong:**
The game uses `click` events or `mousedown` handlers for touch input. On mobile browsers, these events are delayed 300ms to detect double-tap zoom. Player actions feel sluggish; combat timing feels broken; the game feels unresponsive compared to native apps. This is especially damaging for boss fights that require precise timing.

**Why it happens:**
Developers build and test on desktop where mouse events are instantaneous. The 300ms delay only manifests on mobile browsers that have not disabled it. Touch events (`touchstart`/`touchend`) bypass this delay but are not interchangeable with mouse events without explicit handling.

**How to avoid:**
Use `touchstart` and `touchend` events for all game input. Add `touch-action: none` via CSS to the game canvas to suppress default browser touch behaviors (scroll, zoom) that interfere with game input. Add `<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">` to disable pinch-to-zoom. Phaser handles this if configured correctly — verify `input.activePointers` is set to at least 2 for dual-touch support.

**Warning signs:**
- Input handling uses `addEventListener('click', ...)` on the game canvas
- The viewport meta tag does not include `user-scalable=no`
- First iPhone playtest produces comments like "the controls feel laggy"
- `touch-action` is not set on the canvas element

**Phase to address:**
Phase 1 (core loop prototype) — input system architecture must use touch events from the start. Retrofitting an existing click-based input system is error-prone and time-consuming.

---

### Pitfall 12: PWA iOS Storage Eviction Destroys Cloud-Save Funnel

**What goes wrong:**
A player saves progress via the email/cloud-save flow. They return a week later. iOS has silently evicted the local IndexedDB/cache storage because the PWA was unused for more than 7 days. Local progress is gone. The player's trust in the cloud-save feature — and by extension the email capture flow it underpins — is destroyed.

**Why it happens:**
iOS aggressively evicts PWA storage (IndexedDB, Cache Storage, localStorage) for infrequently used apps. The threshold can be as short as 7 days. Unlike native apps or desktop browsers, iOS gives no warning before eviction. Cloud-save that relies on local state for the "offline first" experience fails silently.

**How to avoid:**
Architecture decision: treat the Supabase backend as the primary save store, not local storage. The local cache is only a performance optimization, never the source of truth. On every game load, attempt a silent sync with the backend. If the local cache is missing (evicted), pull from the backend transparently. Show a "Syncing your progress..." indicator rather than assuming local state is valid.

**Warning signs:**
- The save system uses `localStorage` or `indexedDB` as the primary store without a backend sync
- The cloud-save feature only pushes to the backend when the player explicitly clicks "save"
- No "restore from cloud" path exists if local state is missing
- You have not tested the flow after manually clearing site data in iOS Safari

**Phase to address:**
Phase 2 (backend/save system) — define the save architecture as "backend-primary, local-cache-secondary" from the start. The cloud-save flow is the email capture mechanism; if it fails, the funnel breaks.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Load all level assets at startup | Simpler asset management code | Memory crash on iOS mid-game; impossible to add levels without rewrite | Never — use per-level load/unload from day one |
| Single opt-in email capture | Faster time to list | GDPR/UWG fines, entire list invalidated, Abmahnung | Never — German law mandates double opt-in |
| Using real names in code comments and URL slugs | Easier to search codebase | Any public exposure risks trademark/personality rights issues | Only in private, never-shipped code |
| `click` event handlers instead of `touchstart` | Simpler cross-platform code | 300ms input delay on all mobile browsers | Only for non-time-sensitive UI (settings menus), never for gameplay |
| Default Supabase SMTP for emails | Zero config during dev | 2 emails/hour rate limit; will fail at any real traffic | Dev only — replace before any real user testing |
| Hardcoded canvas resolution | Faster initial build | Broken layout on iPhone notch/Dynamic Island or landscape mode | Never — use dynamic resolution from scaffolding |
| One giant texture atlas per game | Simpler asset pipeline | iOS memory crash; impossible to load per-level | Never — one atlas per level scene maximum |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth + email capture | Using default Supabase SMTP in production | Configure Brevo/Resend custom SMTP before first real user; test with 10 signups/hour |
| Supabase free tier | Assuming the project stays active | Set up a weekly keep-alive ping or document the unpause flow; never demo from a potentially paused project |
| Web Audio API on iOS | Creating AudioContext before user gesture | Create/resume AudioContext only inside a `touchend` or `click` handler on the title screen tap |
| PWA manifest on iOS | Assuming manifest icons are used by iOS | Add separate `<link rel="apple-touch-icon">` tags; iOS ignores manifest icons |
| CSS viewport units on iOS | Using `height: 100%` for the game container | Use `height: 100vh` and `viewport-fit=cover` + `env(safe-area-inset-*)` for notch handling |
| eToro/wikifolio affiliate links | Not disclosing affiliate relationship | Visible disclosure on any page containing affiliate links; required by German UWG and eToro partner T&Cs |
| Email tool (Brevo/Mailchimp) | Pre-checked opt-in boxes or single opt-in | Enforce double opt-in at list level in the tool's settings, not just in UI; the tool enforces it server-side |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Oversized texture atlases | iOS Safari process killed mid-game, blank screen | Hard cap 2048×2048 per atlas; load per-level | First level with >4 enemy types or a 16×16 tileset |
| Unthrottled Supabase API calls | Rate limit errors; score submissions silently fail | Client-side debounce; cache reads; only write on meaningful state change | ~50 concurrent active sessions on free tier |
| No audio sprite consolidation | Silence on iOS; multiple audio stream errors | Consolidate all SFX into one audio sprite file; use Phaser's audio sprite support | First playtest on any iOS device |
| Canvas resize on iOS Safari | Memory leak → crash after 10–20 resize events | Set canvas size once at game start; listen for orientationchange and reload, not resize | Any time the user rotates their device |
| All levels loaded at startup | 30–60 second initial load on mobile networks; iOS memory crash | Load only the current level's assets; preload next level in background during gameplay | First level that adds a new tileset |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing email list in client-accessible Supabase table with no RLS | Any user can download the entire subscriber list | Enable Row Level Security; email list table is write-only from client (insert own record), read from server-side function only |
| Leaderboard without rate limiting | Score spam, fake entries, abuse | Rate limit score submissions per IP/session; validate score is within plausible range server-side |
| No input sanitization on email field | SQL injection or XSS via email field | Use Supabase's built-in parameterized queries; validate email format client-side and server-side |
| Exposing Supabase service role key in client code | Full database access for any visitor | Service role key is never in client-side code; use anon key + RLS for all client operations |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Email prompt on first visit | 70–90% bounce from finance-audience players | Trigger only after level completion or explicit save intent |
| "Sign up for updates" as CTA copy | Sounds like spam; finance audience rejects immediately | "Save your progress" or "Unlock your Investment Journal" — value-first framing |
| Requiring email to see any score | Players who want to compete but not subscribe feel excluded | Show scores to all; email capture unlocks the persistent leaderboard entry and historical ranking |
| No progress indicator during long loads | Mobile players assume the game is frozen and close the tab | Animated loading screen with percentage or asset-count progress during level loads |
| Landscape-only or portrait-only lock without detection | Players in the "wrong" orientation see a broken layout | Support both orientations or show a clear "rotate your device" screen for the unsupported one |
| Boss fight with no mobile-optimized controls hint | Touch controls are not obvious; players can't figure out how to fight | Show a brief, dismissible touch-control overlay on the first boss encounter |

---

## "Looks Done But Isn't" Checklist

- [ ] **Audio on iOS:** Test on a real iPhone (not simulator) — audio works on desktop and Android but fails silently on iOS Safari until explicitly tested
- [ ] **Email double opt-in:** Confirmation email is actually received and the link actually confirms the subscription — test end-to-end with a real email address
- [ ] **Impressum accessibility:** Impressum link is reachable within two clicks from the game's main HTML page (not just from inside the game)
- [ ] **Privacy Policy names processors:** Supabase, the email tool, and Cloudflare are all explicitly named in the Privacy Policy
- [ ] **Investment Journal disclaimers:** Every Journal entry has a visible, non-buried "not investment advice" disclaimer and creator attribution
- [ ] **Parody naming audit:** Run a full-text search of all UI strings, asset filenames, and URL slugs for the strings "Warren," "Buffett," "Munger," "Berkshire" — none should appear in any user-facing string
- [ ] **iOS memory test:** Game runs for 10 minutes on an iPhone SE (oldest supported model) without browser process termination
- [ ] **PWA storage recovery:** Clear site data in iOS Safari and verify the game correctly pulls save state from Supabase backend
- [ ] **Supabase custom SMTP:** Auth emails are sent via custom provider — verify by checking Supabase dashboard SMTP settings, not by assuming
- [ ] **eToro affiliate disclosure:** Every page or screen containing an eToro or wikifolio link has a visible "affiliate/commercial relationship" disclosure

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Scope creep into four genres | HIGH — may require cutting shipped work | Freeze new feature work; audit all in-progress items against "does this serve the core loop?"; cut anything that doesn't; document cut scope as "v2 candidates" |
| iOS audio silent on launch | LOW (if caught pre-launch) / HIGH (post-viral-share) | Add AudioContext unlock to title screen tap; hotfix deploy to Cloudflare Pages in <1 hour |
| Missing Impressum at launch | MEDIUM — Abmahnung may already be sent | Create Impressum page immediately; respond to any Abmahnung within the deadline (usually 7–14 days); do not ignore |
| GDPR/UWG single opt-in email list | HIGH — list may be legally invalid | Stop all marketing emails immediately; implement double opt-in and re-confirm the entire list; expect 30–60% re-confirmation rate; unconfirmed addresses must be deleted |
| AI asset style drift discovered late | MEDIUM | Identify the canonical style from the best-looking assets; use those as reference to regenerate drifted assets; do not try to "patch" style in code or post-processing |
| Supabase project paused at launch | LOW | Unpause via Supabase dashboard (< 2 min); implement keep-alive to prevent recurrence |
| Investment Journal flagged as financial promotion | HIGH | Remove specific recommendations immediately; rewrite as educational/personal opinion; add prominent disclaimers; consult legal counsel |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Four genres trap | Phase 1: core loop scope lock | Phase 1 ships with zero mini-game code; mini-games begin only in Phase 2 or later |
| iOS audio lockout | Phase 1: scaffolding + mobile QA | Audio plays on real iPhone SE on first tap; confirmed before Phase 1 sign-off |
| iOS memory crash (textures) | Phase 1: asset pipeline setup | No single atlas >2048px; per-level load/unload architecture in place before first tileset created |
| German personality rights | Phase 1: naming/identity | Full parody-name audit passes (no real names in any user-facing string) |
| GDPR/UWG double opt-in | Phase 2: email backend | End-to-end double opt-in flow confirmed with real email before any user-facing testing |
| Missing Impressum | Phase 1: project scaffolding | Impressum and Privacy Policy pages live on domain before any public URL is shared |
| Email gate killing retention | Phase 2: funnel integration | Gate triggers only after level 1 completion; confirmed via playtesting session |
| Investment Journal as regulated advice | Phase 3: Journal content | Content checklist sign-off on every entry; no specific buy/sell recommendations present |
| Supabase SMTP rate limits | Phase 2: backend integration | Custom SMTP configured and tested before Phase 2 sign-off |
| AI asset style drift | Phase 1: art direction | Style bible and reference sprite complete before any gameplay asset generated |
| Touch input latency | Phase 1: core loop prototype | Touch events used throughout; 300ms delay confirmed absent on real mobile device |
| PWA storage eviction | Phase 2: save system | Backend-primary save architecture; eviction recovery test passes before Phase 2 sign-off |

---

## Sources

- [iOS Safari Audio Unlock — Matt Montag](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos)
- [iPhone PWA Game Guide (audio unlock pattern) — GitHub Gist](https://gist.github.com/fozzedout/5e77925381991a9570151550992baf14)
- [PWA iOS Limitations and Safari Support 2026 — MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Phaser 3 Mobile Performance iOS/Android — Phaser Discourse](https://phaser.discourse.group/t/phaser-3-mobile-performance-ios-android/1435)
- [Phaser 3.60 Mobile Performance Changelog](https://github.com/phaserjs/phaser/blob/v3.60.0/changelog/3.60/MobilePerformance.md)
- [WebGL iOS Memory Crash — PixiJS Discussion](https://github.com/pixijs/pixijs/discussions/8000)
- [Solo Game Dev Scope Creep — Wayline](https://www.wayline.io/blog/solo-game-dev-scope-creep-stay-on-track)
- [Essential Scope Rules Solo Game Dev — Wayline](https://www.wayline.io/blog/essential-scope-rules-solo-game-dev)
- [AI Voice Imitation and Personality Rights — German Law (SE Legal)](https://se-legal.de/ai-voice-imitation-personality-rights-german-law/?lang=en)
- [Parody and Free Use in Germany — IPKat](https://ipkitten.blogspot.com/2016/09/parody-and-free-use-in-germany-federal.html)
- [Right of Publicity in Germany — Lexology](https://www.lexology.com/library/detail.aspx?g=2d450050-94dd-40e8-9bf1-a1798deac2a6)
- [Email Marketing in Germany — Globig](https://globig.co/email-marketing-in-germany-how-to-stay-compliant-and-effective/)
- [Electronic Marketing in Germany — DLA Piper Data Protection](https://www.dlapiperdataprotection.com/index.html?t=electronic-marketing&c=DE)
- [Germany Impressum Requirements — IONOS](https://www.ionos.com/digitalguide/websites/digital-law/a-case-for-thinking-global-germanys-impressum-laws/)
- [Impressum Complete Guide — Captain Compliance](https://captaincompliance.com/education/the-complete-guide-to-impressum-legal-requirements-implementation-and-compliance/)
- [BaFin Finfluencer Guide — SZA Legal](https://www.sza.de/en/thinktank/bafin-finfluencer-guide-legal-requirements-social-media)
- [BaFin Warning on Investment Advice via Social Media — Mondaq](https://www.mondaq.com/germany/financial-services/1205320/bafin-issues-warning-for-investment-advice-and-tips-using-social-media-or-messenger-services)
- [eToro Affiliate Compliance Guidelines](https://etoropartners.com/compliance-guidelines/)
- [Supabase Free Tier Limits 2026 — IT Path Solutions](https://www.itpathsolutions.com/supabase-free-tier-limits)
- [Supabase Auth Rate Limits — Supabase Docs](https://supabase.com/docs/guides/auth/rate-limits)
- [Mobile Game Funnel Drop-Off — Playio Blog](https://blog.playio.co/mobile-game-marketing-funnel)
- [AI Game Asset Legal Risk — SEELE AI](https://www.seeles.ai/resources/blogs/are-ai-generated-game-assets-copyright-safe)
- [How to Use AI in Game Development Legally — Wayline](https://www.wayline.io/blog/how-to-use-ai-game-development-legal-ethical)
- [HTML5 Mobile Game Best Practices — Gamedev.js](https://gamedevjs.com/articles/best-practices-of-building-mobile-friendly-html5-games/)
- [Optimizing HTML5 Action Games for Mobile — DEV Community](https://dev.to/gamh5games/optimizing-html5-action-games-for-mobile-devices-19ce)

---
*Pitfalls research for: Barren Wuffett — solo HTML5 mobile game + marketing funnel, German operator*
*Researched: 2026-06-11*
