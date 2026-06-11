# Feature Research

**Domain:** Mobile-first HTML5 browser adventure game / branded marketing funnel
**Researched:** 2026-06-11
**Confidence:** HIGH (table stakes / anti-features), MEDIUM (conversion rate estimates, GDPR patterns)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken or unprofessional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Touch controls (virtual D-pad / tap-to-move) | Every mobile player assumes they can play with their thumbs; keyboard-only kills engagement instantly on phone | MEDIUM | Virtual joystick or tap-target overlay; Phaser 3 has built-in touch input; must feel responsive (<50ms latency perception threshold) |
| Portrait-mode support with orientation lock/overlay | >70% of casual browser sessions start in portrait; a hard landscape lock loses half the audience before first interaction | LOW | Show "please rotate" overlay OR design the viewport to work in portrait natively; top-down Zelda-style maps well to portrait with a virtual D-pad below the viewport |
| Audio toggle (music + SFX separately) | Mobile users frequently play in public or silent mode; blaring audio on page load is an immediate close trigger | LOW | Two persistent toggles (music / SFX); persist preference in localStorage; never auto-play audio before first user gesture (iOS WebAudio policy blocks it anyway) |
| Visible loading progress indicator | First load of a pixel-art sprite sheet can be 1–3 MB; blank screen with no feedback = assumed crash | LOW | A branded loading bar (e.g., Barren Wuffett walking across a progress bar) doubles as a first impression; target initial bundle <300 KB, lazy-load level assets |
| Fast first load (<3 s on 4G) | Mobile users abandon sites that take >3 s; game players are slightly more patient but not by much | MEDIUM | Asset compression (TexturePacker), lazy-loading level packs, service worker pre-cache for repeat visits; Cloudflare Pages CDN handles edge caching |
| Local save / progress persistence | Casual players return days later; losing progress on refresh = permanent churn | LOW | localStorage for immediate saves; IndexedDB for larger state blobs; this is the prerequisite for cloud-save email capture |
| Pause / resume | Phones interrupt constantly (calls, notifications); a game that can't pause feels hostile | LOW | Pause menu accessible via on-screen button and OS back-gesture intercept |
| Basic settings screen | Sound toggles, credits, privacy policy link, Impressum link (legally required in Germany) | LOW | Must be reachable from main menu AND from in-game pause menu |
| Mobile viewport meta tag + prevent zoom | Pinch-zoom breaks game layout; browser chrome eating into viewport causes layout jumps | LOW | `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">` |
| Legal pages: Impressum + Privacy Policy | Legally mandatory for DE-operated web services; absent = GDPR violation risk | LOW | Static pages linked from footer and settings; must name responsible person, address, email; privacy policy must describe all data collected (email, localStorage, analytics if any) |
| Cookie/consent banner (non-essential cookies only) | Required by German TTDSG / GDPR if using any analytics, third-party embeds, or marketing pixels | LOW | If the game uses only functional localStorage and no third-party tracking, a simple "this site uses functional storage" notice suffices — no banner needed; any analytics (e.g., Plausible) that is cookieless and privacy-first avoids consent overhead |

### Differentiators (Competitive Advantage)

Features that set Barren Wuffett apart. Not required, but directly serve the funnel and retention goals.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Cloud-save email gate | Converts the save system into the primary email capture touchpoint; feels like a feature ("sync your progress across devices"), not a demand; value-first framing triggers reciprocity | MEDIUM | Supabase free tier: user provides email → receives magic-link or confirmation → local save synced to DB; must be framed as "never lose your progress" not "give us your email"; GDPR: separate checkbox for marketing vs functional save (save = legitimate interest, marketing = explicit consent) |
| Investment Journal collectibles | The differentiating funnel mechanic; one unlockable per level/boss gives a genuine, entertaining investing insight in Barren Wuffett's voice; subtle eToro/wikifolio mention at the end of each entry | HIGH | Each journal entry = 150–300 words of real value; illustrated in pixel-art style; acts as the "reward" that justifies giving an email; must stand alone as interesting content even to someone who never visits the portfolio links |
| Dynamic share card (result image) | Wordle-style shareability: after each boss defeat, a pre-composed PNG shows score, level name, quote from the Journal entry, and game URL; one tap to share to Twitter/WhatsApp | MEDIUM | html2canvas or Canvas API renders a 1200×630 shareable card; og:image meta tag ensures rich previews in social feeds; the share text carries the game URL = organic distribution loop |
| Leaderboard (email-gated score submission) | Competitive players will give an email for a chance to appear on a leaderboard; adds retention hook beyond story completion | MEDIUM | Supabase table for top scores per level; email required to submit (second touchpoint after cloud-save); display top 10 publicly; no account needed beyond email — keeps friction minimal |
| Bonus content unlock (Journal "deep cut" entries) | A secondary email touchpoint: players who didn't save to cloud can still unlock an exclusive "behind-the-scenes" Journal entry by subscribing; lower-stakes ask for players who don't care about cloud save | LOW | One exclusive entry per act (not per level) keeps the incentive scarce; delivered via email (first email in the drip sequence doubles as content delivery) |
| PWA install prompt (deferred) | "Add to home screen" = bookmarked return visits; icon on home screen = constant recall; increases Day 7 and Day 30 retention meaningfully | LOW | Trigger the install prompt after level 1 completion (not on first load); use `beforeinstallprompt` event; Chromium/Android supports full install; iOS shows partial support (Safari "Add to Home Screen") |
| Offline play via Service Worker | Once installed as PWA, game works on the subway; rare but appreciated; signals quality | MEDIUM | Cache game shell + Level 1 assets on install; Level 2–5 assets fetched and cached on first play; cloud-save sync queued for next connection |
| Narrative collectibles system (lore cards) | Drives exploration and replay; per-level "moment cards" (e.g., "The Paper Route," "The Coca-Cola Discovery") that fill a collectible album; gives completionists a reason to replay | MEDIUM | Simple flag array in save state; displayed in a gallery screen; not email-gated (reward exploration freely); Journal entries ARE gated (reward email) |
| "Barren's Wisdom" end-screen quote | After completing each level, a short Buffett-parody quote (in Barren Wuffett's voice) with a tiny "Discover Barren's real portfolios →" link; the one moment where the funnel is made explicit | LOW | Must be charming, not salesy; the quote IS the content; the link is small; finance-audience players are primed to click if the game has earned their trust |
| Share-with-friend referral bonus | Players earn an in-game bonus (extra collectible or cosmetic) by sharing a referral link; this mechanic drove +108% extra entries in documented branded game case studies | MEDIUM | Referral code appended to share URL; Supabase tracks referral → credit; in-game cosmetics (different character hat, color palette swap) keep reward tangible without monetization |

### Anti-Features (Things to Deliberately NOT Build)

Features that seem reasonable but would damage the trust of a finance-audience funnel — this audience is sophisticated, skeptical, and will immediately associate dark patterns with the creator's investment credibility.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Forced login/account wall before play | Reduces anonymous load, enables personalization | 93% of players abandon games with deceptive registration walls; finance audience associates forced accounts with data harvesting; eliminates word-of-mouth ("just send the link and play") | Let anyone play immediately; offer cloud-save as an opt-in benefit after level 1 |
| Interstitial ads (banner, video, popups between levels) | Obvious monetization path | 45% of players delete a game after overly frequent interstitials; 61% actively discourage friends from downloading; for a trust-building funnel, one bad ad placement poisons the investment content that follows | v1 has zero ads; monetization is via email-to-portfolio conversion, not ad CPMs; revisit ad formats only after v2+ paid content is live |
| Aggressive email popups (modal on page load, countdown timers, "wait — don't go!" exit-intent) | Standard lead-gen playbook | Finance-savvy audience recognizes and resents dark patterns; associates manipulation with the creator's investment judgment; static popup opt-in rate is only 1.9% anyway vs 12.8% for gamified capture | Cloud-save gate after level 1 (12–20% opt-in realistic); bonus Journal entry offer (softer ask); leaderboard submission (competitive players self-select) |
| Pre-ticked marketing consent checkbox | Reduces friction at signup | Explicitly illegal under GDPR; voids consent; German data protection authorities (e.g., BayLDA, LfDI) actively enforce this; single fine could exceed entire project lifetime value | Separate unchecked checkbox: "I'd like to receive Barren's Investment Journal updates (optional)" — this is also better for list quality |
| Daily login streaks / FOMO timers ("Offer expires in 2:47!") | Drives DAU and urgency | Manufactured urgency reads as manipulation to a value-investing audience that prizes patience and rationality; contradicts the Buffett brand ("our favorite holding period is forever"); creates churn if players miss a day | Natural re-engagement via email drip (Journal entries land in inbox on a schedule the player consented to) |
| Social login (Facebook/Google OAuth) as the only save option | Reduces password friction | Requires App Review (Facebook), OAuth credentials management, privacy policy updates for third-party data; adds vendor dependency; privacy-conscious finance audience may distrust social login for an investment-adjacent app | Magic-link email auth (Supabase) — frictionless, no password, no third-party data sharing, fully GDPR-controllable |
| Real names / likenesses of Warren Buffett, Charlie Munger, or corporate logos | Obvious authenticity signal | Legal risk: defamation, right of publicity (Buffett is a public figure but commercial exploitation differs from parody commentary); trademark infringement for logos | Parody names throughout ("Barren Wuffett," "Chucky Munger," "Omahoma Investments"); parody is a protected expression category in most jurisdictions when clearly satirical |
| Aggressive upsell modals mid-gameplay | Monetization preparation | Breaks immersion; signals that the "free" game was bait-and-switch; destroys the trust built by the gameplay-first approach | Architecture prepared for paid content (level packs) but zero upsell prompts in v1; any paid content in v2+ should be surfaced only from main menu, never mid-play |
| Full-screen cookie consent banner blocking gameplay | GDPR "compliance theater" | If game uses only functional localStorage (no third-party analytics, no ad pixels, no cross-site tracking), a full consent banner is not legally required; showing one anyway trains players to dismiss-and-ignore, adds friction, and signals privacy paranoia | Cookieless analytics (Plausible, Umami) require no consent banner; Supabase auth uses server-side session, not tracking cookies; link to privacy policy in footer |

---

## Feature Dependencies

```
[Local save / localStorage]
    └──required by──> [Cloud-save email gate]
                          └──enables──> [Leaderboard email touchpoint]
                          └──enables──> [Investment Journal gated delivery]
                          └──enables──> [Email drip sequence]

[Level 1 complete]
    └──triggers──> [Cloud-save prompt (first email ask)]
    └──triggers──> [PWA install prompt]
    └──triggers──> [Barren's Wisdom end-screen with portfolio link]

[Email captured]
    └──unlocks──> [Investment Journal entry (per level)]
    └──unlocks──> [Leaderboard submission]
    └──unlocks──> [Cloud sync across devices]

[Investment Journal entry]
    └──contains──> [Subtle eToro/wikifolio link]
    └──feeds──> [Email drip sequence (one entry per email)]

[Share card feature]
    └──requires──> [Canvas/html2canvas rendering]
    └──requires──> [og:image meta tags on page]
    └──enhances──> [Referral bonus system]

[PWA install]
    └──requires──> [Service worker]
    └──requires──> [Web app manifest]
    └──enables──> [Offline play]

[Leaderboard]
    └──requires──> [Supabase backend]
    └──requires──> [Email captured] (gated submission)

[Narrative collectibles (lore cards)]
    └──enhances──> [Replay motivation]
    └──does NOT require──> [Email capture] (deliberately ungated)

[Audio toggle]
    └──requires──> [localStorage] (persist preference)

[Orientation handling]
    └──required by──> [Portrait-mode play]
    └──independent of──> [All other features]
```

### Dependency Notes

- **Cloud-save gate requires local save first:** The prompt only makes sense after the player has something worth saving; trigger at end of Level 1 (not before).
- **Investment Journal requires email:** The Journal IS the primary value exchange; ungating it would eliminate the conversion mechanism.
- **Leaderboard conflicts with anonymous play:** Leaderboard score display can be public, but submission must require email; show the board to everyone to create FOMO, gate submission.
- **Share card enhances referral bonus:** Without a referral tracking URL, the share card is still a valuable virality mechanic; the bonus system is a v1.x enhancement.
- **Narrative collectibles (lore cards) must NOT require email:** Free exploration reward maintains goodwill and keeps the game feeling generous; the email-gated Journal entries land as premium by contrast.

---

## MVP Definition

### Launch With (v1)

Minimum viable product for validating the core loop and funnel concept.

- [ ] Touch controls (virtual D-pad) — without this, the game is unplayable for mobile users (primary audience)
- [ ] Portrait-mode with orientation overlay — most mobile sessions start portrait; locked landscape loses ~50% of organic traffic
- [ ] Audio toggle (music + SFX, persisted) — iOS auto-play policy makes this unavoidable anyway; must exist from day one
- [ ] Loading progress indicator — blank screen kills first impressions before gameplay begins
- [ ] Local save (localStorage) — prerequisite for cloud-save; also prevents frustration on page refresh
- [ ] Cloud-save email gate (post-Level-1) — the primary conversion mechanism; must ship with the game, not after
- [ ] Investment Journal (1 entry per level, email-gated) — the funnel's value payload; the reason the email ask feels fair
- [ ] Barren's Wisdom end-screen with portfolio link — one discreet, charming mention of real portfolios per level
- [ ] Impressum + Privacy Policy pages — legally mandatory in Germany; absent = immediate legal exposure
- [ ] Share card (Canvas-rendered) — zero-cost distribution; each boss defeat becomes a potential acquisition touchpoint
- [ ] og:image + og:title + og:description meta tags — ensures share card renders properly in all social previews

### Add After Validation (v1.x)

Add once core loop and email capture are working and validated.

- [ ] Leaderboard — add when there are enough players to make it feel alive (dead leaderboard is worse than no leaderboard); trigger: >100 email captures
- [ ] PWA manifest + install prompt — add after first 50 players; verify the core game is stable before encouraging home screen installs
- [ ] Service worker / offline support — add after PWA install; only valuable if players are actually installing
- [ ] Referral bonus system — add when share card traffic shows measurable referral patterns; trigger: share card click data from analytics
- [ ] Bonus Journal "deep cut" unlock — secondary email touchpoint for players who skipped cloud-save; add when observing >30% of players completing game without converting
- [ ] Narrative collectibles gallery screen — lore cards exist in Level 1 from launch, but the gallery UI can ship in v1.x when there are enough to display meaningfully

### Future Consideration (v2+)

Defer until product-market fit is established and v1 players have validated the funnel.

- [ ] Daily hooks / streak system — only after establishing a reason to return daily (new content); avoid FOMO mechanics that conflict with the Buffett brand
- [ ] Paid level packs (v2 arc: Graham era, Berkshire era) — architecture prepared from v1; build payment flow only after traction justifies App Store alternative channels
- [ ] German localization — English first per PROJECT.md; add after validating English audience; i18n structure kept tidy from day one
- [ ] Charlie Munger companion character ("Chucky") — delightful differentiation for v2; adds dev scope disproportionate to v1 value
- [ ] Multiple save slots — adds complexity; single slot is sufficient for v1 solo play
- [ ] Social login (OAuth) — adds OAuth dependencies and privacy policy complexity; magic-link is better for this audience anyway

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Touch controls | HIGH | MEDIUM | P1 |
| Portrait-mode handling | HIGH | LOW | P1 |
| Audio toggle | HIGH | LOW | P1 |
| Loading progress bar | HIGH | LOW | P1 |
| Local save (localStorage) | HIGH | LOW | P1 |
| Cloud-save email gate | HIGH | MEDIUM | P1 |
| Investment Journal (email-gated) | HIGH | HIGH | P1 |
| Barren's Wisdom end-screen | HIGH | LOW | P1 |
| Impressum + Privacy Policy | HIGH (legal) | LOW | P1 |
| Share card (Canvas) | HIGH | MEDIUM | P1 |
| og:image meta tags | MEDIUM | LOW | P1 |
| Narrative collectibles (lore cards) | MEDIUM | MEDIUM | P2 |
| Leaderboard | MEDIUM | MEDIUM | P2 |
| PWA install prompt | MEDIUM | LOW | P2 |
| Service worker / offline | MEDIUM | MEDIUM | P2 |
| Referral bonus system | MEDIUM | MEDIUM | P2 |
| Bonus Journal deep-cut unlock | MEDIUM | LOW | P2 |
| Accessibility settings (text size, contrast) | LOW | LOW | P2 |
| Daily streak system | LOW | LOW | P3 |
| Paid level pack architecture | LOW | HIGH | P3 |
| German localization (i18n wiring) | LOW | MEDIUM | P3 |
| Charlie companion character | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have — add once core loop is stable
- P3: Nice to have — future consideration

---

## Email Capture Conversion Rate Benchmarks

Realistic expectations for the funnel, based on documented gamified lead-generation data:

| Touchpoint | Mechanism | Expected Opt-in Rate | Notes |
|------------|-----------|----------------------|-------|
| Cloud-save gate (post-Level-1) | "Save progress across devices" framing | 15–25% of players who reach Level 1 end | Best-performing pattern; value-first; comparable gamified captures average 12.8–22% |
| Leaderboard submission gate | Score board + competitive framing | 8–15% of players who complete a level | Competitive players self-select; lower volume but higher intent |
| Bonus Journal unlock | "Unlock exclusive insight" offer | 5–10% of remaining non-converters | Secondary touchpoint for players who passed on cloud-save |
| Share card referral (indirect) | Organic social share → new player → conversion | Multiplier on above rates, not additive | Branded game case study showed +108% reach from referral bonus alone |

**Net realistic expectation:** If 100 players complete Level 1, expect 15–25 email captures. Marketing consent (separate checkbox) will be a subset — expect 50–70% of capturers to tick the marketing box. This means ~8–17 marketing-consented leads per 100 Level 1 completions. Quality will be high: self-selected value-investing audience who completed gameplay.

---

## Competitor Feature Analysis

| Feature | Wordle (viral browser game benchmark) | Typical F2P Mobile Game | Barren Wuffett Approach |
|---------|---------------------------------------|-------------------------|-------------------------|
| Login required | None — play immediately | Usually required or social login | None to play; email opt-in only for save/leaderboard |
| Ads | None | Interstitials, banner, rewarded video | None in v1 |
| Save system | Daily cookie (no account) | Account-required cloud save | Local save default; cloud save as email-capture feature |
| Shareability | Emoji grid, frictionless 1-tap | Screenshot with watermark | Canvas share card, OG tags, referral URL |
| Monetization | None (acquired by NYT) | IAP, loot boxes, energy systems | Email → portfolio traffic (indirect); v2+ paid packs |
| GDPR / compliance | Minimal (US-owned, NYT handles) | Cookie banners, ToS | Full DE compliance: Impressum, double opt-in, cookieless analytics |
| Retention hook | Daily scarcity (one puzzle/day) | Streaks, lives, timers | Story progression, collectibles, Journal drip via email |
| Trust signals | Simple, no dark patterns | Often dark-pattern-heavy | No dark patterns, discreet funnel, genuine educational content |

---

## GDPR / Email Capture Implementation Notes

These are non-negotiable for a Germany-operated project.

1. **Separate consent purposes.** The cloud-save email collection has two distinct legal bases:
   - Functional (account for save sync): legitimate interest OR contractual necessity — does NOT require a marketing checkbox.
   - Marketing (Investment Journal emails, portfolio updates): requires explicit, separate, opt-in consent. Unchecked box, plain language ("I'd like to receive Barren's investing insights by email — optional").

2. **Double opt-in for marketing.** Not legally required by GDPR, but German courts (BGH) and authorities treat it as best practice and it provides consent documentation. Implement: capture email → send confirmation email → player clicks confirm → added to marketing list. Supabase + Resend/Mailgun handle this.

3. **No pre-ticked boxes.** Illegal under GDPR. Both checkboxes (save + marketing) must start unchecked.

4. **Right to withdraw.** Every marketing email must contain an unsubscribe link. Supabase or email tool manages list state.

5. **Data minimization.** Collect only: email address, level progress (for save), score (for leaderboard), consent timestamp. No name, no location beyond what the browser provides, no behavioral tracking beyond functional analytics.

6. **Cookieless analytics.** Use Plausible or Umami (self-hostable on free tier). No consent banner required. No GDPR overhead.

7. **Impressum content.** Full name, physical address, email address, phone number of the responsible person (the creator). Linked from every page footer and from the in-game settings menu.

---

## Sources

- [MDN: Mobile touch controls for HTML5 games](https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Mobile_touch)
- [Mozilla Hacks: Progressive Web Games](https://hacks.mozilla.org/2018/05/progressive-web-games/)
- [Bliz.cc: Gamified Lead Generation (2026)](https://bliz.cc/blog/gamified-lead-generation)
- [SandHill Digital: Gamification in Lead Generation](https://sandhilldigital.io/2025/02/26/gamification-lead-capture/)
- [OptiMonk: 11 Email Capture Best Practices 2026](https://www.optimonk.com/email-capture-best-practices)
- [Tabfoundry Medium: Marketing Game Case Study — 674 leads, 89.5% capture rate](https://medium.com/@tabfoundry/marketing-game-case-study-14-3-days-spent-in-the-game-674-new-leads-3-days-and-871-in-new-sales-923ea4abae77)
- [iubenda: GDPR opt-in consent on mobile](https://www.iubenda.com/en/blog/how-to-collect-opt-in-consent-on-mobile-under-the-gdpr/)
- [heydata.eu: Double opt-in under GDPR/DSGVO](https://heydata.eu/en/magazine/opt-in-and-opt-out-how-does-double-opt-in-work-according-to-gdpr-2)
- [GameAnalytics: GDPR game compliance](https://www.gameanalytics.com/blog/gdpr-game-compliant)
- [AllAboutBerlin: Running a website in Germany (Impressum, GDPR)](https://allaboutberlin.com/guides/website-compliance-germany)
- [Star Loop Studios: Mobile game retention features](https://starloopstudios.com/which-mobile-game-features-keep-players-coming-back/)
- [Digital Edge: Browser game case study 42M sessions (2025)](https://digitaledge.org/how-a-simple-browser-game-reached-42-million-sessions-in-q3-q4-2025-full-case-study/)
- [Peek & Poke: How to use branded games in marketing](https://peekandpoke.com/blog/how-to-use-branded-games/)
- [PocketGamer: Dark patterns in F2P mobile games](https://www.pocketgamer.biz/prevent-ui-ux-dark-patterns-f2p-mobile-games/)
- [arxiv: Dark Patterns in Mobile Games study](https://arxiv.org/html/2412.05039v1)
- [Phaser: Orientation handling](https://phaser.io/examples/v3.55.0/scalemanager/view/orientation-check)
- [WebGameDev: PWA for HTML5 games](https://www.webgamedev.com/publishing/pwa)
- [LogRocket: Offline storage for PWAs](https://blog.logrocket.com/offline-storage-for-pwas/)
- [Wordle viral mechanics — HowToGeek](https://www.howtogeek.com/108120/how-to-share-your-wordle-score-without-spoilers/)
- [Phrazle: History of Wordle virality mechanics](https://phrazle.co.uk/blog/history-of-wordle/)

---

*Feature research for: Barren Wuffett — HTML5 browser adventure game / investment portfolio marketing funnel*
*Researched: 2026-06-11*
