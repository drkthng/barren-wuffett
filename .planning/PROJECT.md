# Barren Wuffett

## What This Is

A free mobile-first browser game (HTML5/PWA) that playfully retells Warren Buffett's life story as a loving parody — successes and setbacks included. Players explore a 16-bit pixel-art world (Zelda-light top-down adventure) through the stations of Buffett's youth, with mini-games and boss fights borrowing mechanics from Mario, Kingdom, and point & click adventures. The game doubles as an organic marketing funnel for the creator's wikifolio portfolios and eToro profile via an unlockable, genuinely valuable "Investment Journal" collectible system and email capture.

## Core Value

A fun, shareable game that makes players *want* to leave their email and discover the creator's real investment portfolios — entertainment first, funnel second, never feeling like an ad.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Playable top-down adventure (Zelda-light) core loop with touch controls, mobile-first
- [ ] 3–5 levels covering Buffett's childhood/youth (paper route, Coca-Cola six-packs, pinball machines, first stock investment "Cities Service")
- [ ] Each level has distinct length/difficulty and a boss fight; mini-games inject Mario / Kingdom / point & click mechanics as accents
- [ ] 16-bit pixel-art retro visual style, consistent across all assets
- [ ] English-language content (i18n-friendly structure for later German localization)
- [ ] Email capture via cloud-save ("save your progress"), bonus content unlock, and highscore leaderboard — GDPR-compliant with double opt-in for marketing use
- [ ] Unlockable "Investment Journal" collectible: one genuinely valuable, entertaining investing insight per level/boss, with subtle pointers to the creator's wikifolios/eToro
- [ ] Discreet creator mention on end screens (no blunt advertising in gameplay)
- [ ] Runs entirely on free tiers (hosting, backend, email tool) — zero recurring cost
- [ ] Architecture prepared for later paid content (level packs, equipment, companion characters like "Charlie") without building payments in v1

### Out of Scope

- Native App Store / Play Store apps — browser/PWA first; store distribution adds review risk, 15–30% cut, and rules around email gating and finance links; revisit after web traction
- Payments / in-app purchases in v1 — monetization comes later as level packs, equipment, side characters (e.g., Charlie Munger figure); v1 only keeps the architecture extensible
- Full life story (Graham era, partnership, Berkshire, 2008 crisis) — v1 is childhood/youth only; later eras ship as updates or paid packs
- German localization in v1 — English first for the larger audience; text is structured for easy i18n later
- Real names, photos, or logos of living/deceased persons and companies — parody names only ("Barren Wuffett" et al.) to keep legal risk low
- Multiple full genres as equal pillars — one core genre carries the game; other genres appear only as mini-games/boss mechanics (four genres ≈ four games of effort)

## Context

- Solo developer with little/no game-dev experience; Claude Code does the heavy lifting on code, assets come from AI generation and free asset packs (e.g., Kenney, itch.io)
- The creator runs wikifolio portfolios (DACH audience) and an eToro profile (international); the game's audience (Buffett/value-investing fans) overlaps almost perfectly with the funnel target
- Distribution plan: shareable link placed in wikifolio/eToro profiles and social channels — no store gatekeeping
- Buffett's biography natively provides level structure and antagonists ("Mr. Market" as recurring boss archetype, era-specific crises as boss fights)
- Operating from Germany: GDPR applies to email collection (double opt-in, privacy policy, Impressum)
- Tone: loving parody — humorous and exaggerated, but with real respect and genuine investing lessons underneath; legally safest and most shareable framing

## Constraints

- **Budget**: 0 € recurring — free tiers only (hosting e.g. Cloudflare Pages, backend e.g. Supabase free tier, free email-tool tier)
- **Timeline**: First playable version live ASAP (weeks, not months) — aggressively lean MVP, then iterate
- **Platform**: Mobile-first browser (HTML5/PWA); must play well on phone touchscreens, desktop is secondary
- **Legal**: Parody framing throughout; no real likenesses/trademarks; GDPR-compliant email handling; finance references must not constitute regulated investment advice
- **Skills**: No prior game-dev experience — favor well-documented mainstream tooling with strong AI-assistance ergonomics

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Browser/PWA first, no app stores in v1 | Instant shareable distribution via portfolio profiles, no store rules on email capture/finance links, no revenue cut | — Pending |
| One core genre (Zelda-light top-down) + mini-game accents | Four full genres = four games of effort; top-down works well with touch and absorbs other mechanics naturally | — Pending |
| v1 scope = childhood/youth (3–5 levels) | Fastest path to a complete, satisfying arc; later eras become updates/paid packs | — Pending |
| 16-bit pixel-art style | Matches the genre homage, most reliable style for AI/free assets, small file sizes for web | — Pending |
| English first | Larger audience, Buffett topic is international, eToro followers reachable; i18n structure kept for German later | — Pending |
| Email capture: cloud-save + bonus unlock + leaderboard | Cloud-save converts best and feels like a feature, not marketing; multiple soft touchpoints | — Pending |
| Investment Journal must stand on its own | User explicitly wants funnel content to be "unannoying", intriguing, and valuable independent of the sales aspect | — Pending |
| Loving-parody tone with parody names | Legally safest treatment of real persons, strongest viral potential | — Pending |
| Free tiers only for all infrastructure | Zero-cost operation until traction justifies spending | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-11 after initialization*
