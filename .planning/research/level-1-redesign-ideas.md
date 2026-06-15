# Level 1 — Redesign Ideas & Design Direction (working doc)

**Status:** WORKING / brainstorm — captured 2026-06-14. Feeds the future **"Level 1 — Polish & Your Ideas"** phase (roadmap rearrange pending user confirmation). Funnel & backend deferred to the very end per user decision 2026-06-14.

## User's raw ideas (2026-06-14)

1. **More story before the end-boss** — significant narrative buildup leading into the boss; currently too thin.
2. **Boss-fight redesign** — current Mr. Market fight "makes no sense, too linear" (decline ×3 → buy low → win is a menu, not a fight). Wants something that makes *thematic* sense (market psychology) and has real interaction/patterns.
3. **Bush-whacking economy** — hit bushes with a **rolled-up newspaper** (thematic: he's a paperboy) to collect coins/items.
4. **Shops** — spend collected coins/items to buy things in shops (upgrades, gear, consumables).
5. **Dog hazard** — the dog patrolling left/right on the first screen should *do something* on contact: e.g., player gets bitten → "lands in the hospital" / knocked back / loses coins. Parody gag.
6. **Paper-route mini-game is too lame** — improve it:
   - 6a. Targets ("doors") need much more design — proper **houses**, varied and characterful.
   - 6b. **Clear ending** — a final splash / results screen showing your score.
7. **Play-and-iterate** — wants to keep playing (dev server) and add ideas as we go.
8. **Wants a reactable menu** — wants to read a few of Claude's concrete idea proposals + in-game "workflows" (core gameplay loops / player flows) and pick what to implement.

## Research requested (in progress)
- **A. Zelda + FF Mystic Quest early-level design patterns** — how they structure the first few hours; copy more from them. → `.planning/research/zelda-mystic-quest-patterns.md`
- **B. Young Warren Buffett's early years** — translate authentic biography into in-game story/mechanics (parody-safe). → `.planning/research/buffett-early-years-story.md`

## Direction to shape into phase(s)
Likely new **core loop**: explore town → whack bushes / do chores for coins → hit story beats → spend at shops (upgrades) → improved paper-route mini-game → redesigned, thematic Mr. Market boss. Possibly split the phase into: (i) mechanics + economy (bush-whack, coins, shops, dog hazard), (ii) mini-game + boss redesign, (iii) story/content.

## Research complete (2026-06-15)
- `.planning/research/zelda-mystic-quest-patterns.md` — bush prize-pack economy, dog-as-glue, shop upgrades, 4 boss archetypes, core loop.
- `.planning/research/buffett-early-years-story.md` — 7-beat story spine + parody cast (Ohama, Dottie, Donno, Barber Bristle, Old Penny, Fizz, CIVU).

## Locked decisions (2026-06-15)
- **Boss = Direction A, "Mood Pendulum"** (user-picked): visible GREED↔PANIC meter; his FOMO lures hurt on contact; strike when he swings to PANIC. Reuses the newspaper-whack verb (no new controls mid-fight).
- **Overall direction endorsed** ("sounds great"): 7-beat story spine, bush-whack economy (deterministic 8-slot prize-pack, first-whack = coin), dog-as-glue (knockback + "hospital" gag + bush-streak reset), shops (3–4 permanent upgrades incl. newspaper-upgrade + helmet + traversal unlock), paper-route glow-up (house targets + results splash), hidden Investment Journal collectible pages (content-only, seeds the deferred funnel).

## Proposed phase split (pending user confirm)
New Level-1 phases inserted after 2.1; funnel moved to the end:
- **P3 — Level 1: The Newspaper Verb & Economy** — whack/bushes/coins/drops, dog hazard, shop + upgrades + traversal gate. *(foundation)*
- **P4 — Level 1: Set Pieces** — paper-route glow-up + results splash; Mr. Market → Mood Pendulum boss.
- **P5 — Level 1: Story & Heart** — 7-beat spine, new NPCs, tax + First Stock cutscenes, Count-the-Caps + Pinball-Snowball mini-games, Investment Journal pages.
- **P6 — Levels 2-3** (was P4 level half) · **P7 — Funnel & Backend** (moved from P3) · **P8 — Launch**.

Structure is living — more ideas slot in as the user plays.
