# Zelda & FF Mystic Quest — Opening-Hours Design Patterns (Research Brief)

**Purpose:** Extract concrete, *copyable* early-game patterns from *The Legend of Zelda* (1986), *Link's Awakening*, *A Link to the Past* (ALttP), and *Final Fantasy Mystic Quest* (FFMQ, 1992) to redesign **Barren Wuffett Level 1**: a cozy town with bush-whacking (rolled-up newspaper), coin economy, shops, a patrolling-dog hazard, and a thematic "Mr. Market" boss.

**How to read this:** Each section ends with a **→ How to apply in Barren Wuffett** note. Numbers are taken from the source games where documented; where exact rates aren't published, the structure is given and a sensible tuned default is proposed. Confidence + sources at the bottom.

**Scope reminder:** mobile-first, touch + virtual joystick, 16px pixel art, fully offline, local save only. Keep every mechanic cheap to build and readable on a phone screen. Parody framing only — no real trademarks/likenesses.

---

## 1. Onboarding without text walls

**What the source games actually do:**

- **Zelda 1 (1986):** You spawn on a single screen with one cave. No text, no tutorial. The cave gives the wooden sword with the single line *"It's dangerous to go alone! Take this."* — that's the entire instruction. The world itself is the teacher; the first screen has a cave (curiosity), one exit, and immediately-visible Octoroks so you learn "thing moves toward me → it hurts → my sword stops it" by doing. Crucially you *can* leave without the sword — agency over hand-holding. (Miyamoto deliberately withheld guidance because discovery is the fun.)
- **Link's Awakening:** Tightly scripted but *still* text-light. Beat order: wake up → Marin/Tarin give context + a **one-line objective** ("head to the beach") → talk to Tarin to get the **Shield** (auto-equipped) → walk south (teaches movement + ledge-drops by geometry) → a **sign** ("Beware of sea urchins! Don't touch them with bare hands!") teaches the shield's *purpose* exactly where you need it → push urchins with shield → pick up the **Sword** on the beach → owl delivers the first story beat. Each mechanic is introduced **one at a time, just-in-time, with a safe place to practice it**.
- **FFMQ:** Climbs the Hill of Destiny → earthquake destroys the village (story hook in 30 seconds) → first town (Foresta) hands you the **Cure** spell from a chest → the companion **Kaeli cuts down trees blocking the path**, demonstrating "weapons manipulate the environment" before you must do it yourself. No random battles — all enemies are visible on the field, so the player is never ambushed while still learning. The game even auto-equips gear so beginners can't mis-configure.

**The shared pattern (teach the core verb through geometry + just-in-time prompts):**
1. Give the verb (weapon/item) within the first ~30 seconds.
2. Immediately place a **safe, low-stakes target** for that verb (a lone weak enemy, a breakable object, a pushable block).
3. Put a **one-line, in-world prompt** (sign / NPC / companion demo) *at the exact spot* the verb is first needed — never a wall of text up front.
4. Gate the first real challenge behind successful use of the verb.

**→ How to apply in Barren Wuffett:**
- Hand the player the **rolled-up newspaper (the "whack" verb) in the first 10 seconds** — e.g., Mom hands it to him at the front door with one line: *"Don't forget your papers, sweetie."*
- Put **2–3 obvious bushes right outside the house** as the safe practice target. First whack → guaranteed coin drop (a deterministic "first hit always rewards" — see §2) so the verb feels good instantly.
- Use a **wooden sign or a single NPC line** at the spot it matters, not a tutorial popup: e.g., a sign by the dog's patrol path — *"Beware of the Pemberton hound. He bites."* — teaching the hazard exactly where it lives.
- No upfront text screen. Mirror Zelda 1's restraint: one line, then let them play.

---

## 2. Destructible bushes / grass → drop economy

This is the **highest-value section** for Barren Wuffett — your bush-whacking IS the early economy.

**ALttP — the deterministic "prize pack" system (copy this):**
- Every bush/grass cut and every enemy belongs to one of **8 numbered "prize packs"** (0–7). A pack is an **ordered list of 8 drop slots**.
- Drops are **NOT pure random**. Each pack has its own **counter**: the 1st drop from that pack gives slot 1, the 2nd gives slot 2, … wrapping after 8. Whether a drop happens *at all* is a per-pack probability; *what* drops when it does is the deterministic slot.
- Documented pack rates & contents:

| Pack | Theme | Drop chance | The 8 slots |
|---|---|---|---|
| 1 | Hearts | 50% | Heart×4, Green-rupee×2 (+2) |
| 2 | Rupees | 50% | Blue-rupee×4, Green-rupee×2, Red-rupee×1, Green×1 |
| 3 | Magic | 50% | Big-magic×2, Small-magic×4, Blue-rupee×1, Heart×1 |
| 4 | Bombs | **100%** | Single-bomb×5, 4-bomb×1, 8-bomb×1 |
| 5 | Arrows | 50% | 5-arrows×4, Heart×2, 10-arrows×2 |
| 6 | Variety | 50% | mixed |
| 7 | **Premium** | 50% | Heart, **Fairy**, Big-magic, **Red-rupee**, 8-bombs, Heart, Red-rupee, 10-arrows |

- Why this design is good: the deterministic counter means a player who cuts a whole field gets a **predictable, fair mix** (no "20 bushes, nothing" rage), but individual cuts still feel random. It also lets designers **guarantee** a needed resource (the 100% Bomb pack) without RNG frustration.

**Zelda 1 — the kill-counter with FORCED rewards (also copy):**
- Each enemy group has a 0–9 counter; the **slot is fixed**, only *whether* it drops is random.
- **Forced drops reward streaks:** kill **10** enemies *without getting hit* → the next drop is a **guaranteed 5-rupee** (or a guaranteed **bomb** if you killed the 10th with a bomb). Kill **16** without being hit → a **guaranteed Fairy** (heal). **Getting hit clears the counters** — so taking damage literally costs you your streak bonus.

**What's hidden UNDER bushes (rewards thoroughness):**
- ALttP & LA hide **stairs to secret caves, holes/wells, switches, and Heart Pieces** under specific bushes. In Link's Awakening: cutting the right bush opens a **well in Mabe Village hiding a Piece of Heart**; one specific bush at the Witch's Hut hides a **Secret Seashell when you dig under it**. The lesson: *most* bushes give small loot; a *few hand-placed* ones hide something special, which makes cutting **every** bush feel worthwhile.

**→ How to apply in Barren Wuffett (concrete tuned spec):**
- Implement an **ALttP-style deterministic prize-pack counter** for bushes. Suggested starter table (1 "pack" for ordinary town bushes), 8-slot cycle, **~55% drop chance per whack**:
  - Slots: `1 coin, nothing-special, 1 coin, 3 coins, 1 coin, heart(snack), 1 coin, 5 coins`
  - → average ≈ 1.7 coins per *successful* whack, predictable over a field, with a satisfying "5-coin" spike once per cycle.
- **First-whack guarantee:** the very first bush of a new game always drops a coin (juice the tutorial).
- **Streak bonus (Zelda-1 style):** whack **8 bushes without taking a dog-hit** → next bush drops a **bonus pile (5–10 coins)** or a **collectible** (e.g., a torn "Investment Journal" page — ties to your funnel collectible). Getting bitten by the dog **resets the streak** → this is the elegant link between the hazard (§4) and the economy: the dog isn't just annoying, it *costs you money*.
- **Hand-place 2–4 "special" bushes** in Level 1 hiding: a **shortcut path**, a **hidden coin stash**, a **Journal page**, and maybe a **shop discount token**. Reward the completionist who clears the whole town.
- Bushes should **regrow** on re-entry (like FFMQ's respawning chests / Zelda grass) so the player can softly farm if they want a shop item — but cap it so it never feels like a grind (see §3).

---

## 3. Economy + shops

**What the source games teach about early money + shops:**

- **Early currency sources** are *exploration*, not grinding: grass/bushes, pots, enemy drops, and hidden chests. ALttP players are explicitly advised the basic item shops are *skippable* because "you can obtain Hearts and Bombs from defeated enemies, under pots/skulls, etc." → **the shop is a convenience/upgrade outlet, not the only path.**
- **ALttP early prices (real numbers, for calibration of feel):** Bottle = **100 rupees** (the single best early buy — it's permanent utility, a fairy/potion container), Bombs = 30 for **100**, Arrows = 10 for **30**, Heart refill = **10**, Zora's Flippers = **500** (a big-ticket *gate* item that unlocks new traversal). ALttP also lets you **sell** (Golden Bee → 100 rupees), adding a tiny trading loop.
- **Link's Awakening:** there's **exactly ONE shop** on the island. It sells the **Bow, Shovel, Shield** — i.e., a *key tool* (Shovel) needed to dig up secrets/seashells, plus consumables. One shop keeps the economy legible. (It also has a famous "steal and the shopkeeper kills you" gag — a memorable consequence, not relevant to copy but note the tone.)
- **FFMQ:** gold from visible battles + Battlefields buys **weapons/armor that are clear linear upgrades**; the game even auto-equips them. Simplicity over optimization.

**What makes a shop loop rewarding vs. grindy:**
- **Rewarding:** a *small number* of meaningful purchases, each visibly changing play — a **permanent tool** (Shovel/Bottle), a **traversal gate** (Flippers), a **capacity upgrade** (bigger wallet/quiver). You buy it once, you feel it forever.
- **Grindy:** infinite consumables you must keep re-buying, or prices tuned so high you must farm the same screen 10×. Avoid.

**→ How to apply in Barren Wuffett:**
- **One or two shops, max, in Level 1.** Suggest: a **General Store** (Mr. Pemberton's?) + maybe a **vending machine** gag.
- Sell **3–4 hand-picked items**, each a clear win, roughly tiered so the player can afford ~1–2 by boss time (don't force farming):
  1. **Better newspaper** (e.g., "Sunday Edition" — bigger whack hitbox / longer reach) — *upgrades the core verb*, the Zelda "sword upgrade" beat. ~Cheap.
  2. **Sturdy cap / bike helmet** — reduces dog-bite consequence (fewer coins lost, or one free hit) — *the "shield/armor" buy*. ~Mid.
  3. **Bus pass / good shoes** — a **traversal/gate** item that opens a shortcut or the road to the boss arena — the **Flippers-equivalent big-ticket gate**. ~Expensive (the thing you save for).
  4. **Snacks (heart refill)** — the only consumable, cheap, optional.
- **Selling loop (optional, thematic):** let the player **sell found collectibles** (bottle caps, found marbles — young Buffett *did* resell things) back for coins → a tiny "buy low / sell" gag that foreshadows the Mr. Market theme.
- **Gate progress softly:** the road to Mr. Market can be walkable for free, but the **bus pass/shoes** open a faster/safer route or a secret — so the shop *matters* without being mandatory (FFMQ's "blocked until event" but gentler).

---

## 4. Contact hazards / early enemies (the dog)

**How NON-lethal contact damage works in these games:**

- **Contact damage + knockback + i-frames** is the universal early-Zelda hazard. On touch: you take a chunk of damage, you're **knocked back** away from the enemy, and you get a brief **invincibility (mercy) window** so you can recover and aren't instantly chain-hit to death.
- **Knockback is a double-edged design tool:** in Zelda 1 the knockback can shove you *into* another enemy, off a ledge, or into hazards — so contact has *positional* consequences, not just HP loss. (Tune carefully on mobile so it never feels cheap.)
- **Streak/economy coupling (Zelda 1):** getting hit **clears your kill-counter**, so damage costs you your *forced-drop bonus*, not just hearts. Damage has an **economic** sting, which is exactly the "dog costs you coins" idea.
- **Visible, readable patrols (FFMQ):** all enemies are on-field and telegraphed; a simple patrolling enemy you can *see coming* creates "time your movement past it" tension without unfairness. The fun of a patroller is the **rhythm/timing puzzle** of slipping past, not the damage itself.
- General game-feel best practice from devs: i-frames "go a long way towards making the game feel fair"; reduce knockback if it frustrates recovery; entities take **no damage while being knocked back** (prevents instant re-hit).

**→ How to apply in Barren Wuffett (the dog):**
- The dog **patrols left↔right** on a fixed path (you already have this). Make its path and turn points **clearly readable** so slipping past is a timing puzzle, not a coin-flip.
- **On contact (non-lethal, recoverable — the gag):**
  - Player is **knocked back** a few tiles + brief **i-frames** (~0.8–1.0s, flash the sprite) so they can't be instantly re-bitten.
  - **Consequence, not death:** the player **drops some coins** (they scatter on the ground and can be re-collected within a few seconds before they vanish — a Sonic-rings-style "you can claw some back" moment, softer than pure loss), AND the **bush-streak (§2) resets**.
  - **Escalation gag:** if bitten with very low/zero "composure," cut to a quick **"WAKE UP IN HOSPITAL"** splash → respawn at home/clinic having lost a small coin fee (the parody "ambulance bill"). This is the memorable consequence beat (à la LA's shopkeeper gag) without ever being a hard game-over.
- The **helmet shop item (§3)** directly counters the dog → ties hazard ↔ economy ↔ shop into one loop.
- Keep it **fully recoverable**: no permanent loss, no death screen. The tension comes from *protecting your streak and coins*, which is more motivating for a cozy parody than fear of dying.

---

## 5. Early boss design — non-linear & thematic (replace the linear Mr. Market)

**The reusable "Zelda boss" formula (and its trap):**
- The classic pattern: **the dungeon's new item is the key to the boss.** You learn an item in the level → the boss has a weakness only that item exposes → fight = "apply the verb you just learned, under pressure, in a pattern."
- **Multi-phase reveal** is the standard juice: **Phase 1** = expose the weak point; **Phase 2** = once exposed, the boss gets **faster/more erratic** and you must hit the now-vulnerable spot while dodging.
- **Concrete models:**
  - **Helmasaur King (ALttP):** armored mask → **break the mask** with the dungeon item (bombs/hammer) → reveals a **glowing weak point** → phase 2 it thrashes erratically. *(Pattern: strip the armor, then strike the exposed core.)*
  - **Agahnim (ALttP):** can't be hit directly — he **lobs energy balls you must deflect back** with sword/net ("tennis"). Phase 2: **three illusions**, only the real one can be volleyed. 4 good returns = win. *(Pattern: turn the boss's own attack against it; later, see through deception.)*
  - **Flamerus Rex (FFMQ):** an **undead** T-rex → it takes **massive damage from the *healing* (Cure) spell** — i.e., the "counter" is **the opposite of what it looks like you should do**. *(Pattern: thematic inversion — the obvious attack fails, the unintuitive one wins.)*
  - **Squidite (FFMQ):** boss + **two minions** → you must **clear the adds first**, then exploit the boss's **elemental weakness**. *(Pattern: priority targeting + know-the-weakness.)*
- **The trap to avoid:** critics call the rigid "always use the dungeon item in one scripted way" version **"The Zelda Pattern"** — too formulaic. Counter it by making the **counter-action a player-read of the boss's *state*, not a fixed scripted key.**

**Designing "Mr. Market" — theme = market psychology (greed ⇄ panic, FOMO, volatility, patience as the counter).** Mr. Market should **visibly swing between two moods**, and the player's job is to **read his mood and act counter-cyclically** — that IS Buffett's whole philosophy ("be greedy when others are fearful, fearful when others are greedy"). Patience/discipline is the meta-counter. Here are **4 copyable archetypes** (pick 1 as the core, optionally chain 2–3 as phases):

### Archetype A — "The Mood Pendulum" (RECOMMENDED CORE; greed ⇄ panic read)
- **Pattern:** Mr. Market openly cycles between **GREED** (he glows green, inflates huge, hurls "FOMO" projectiles — shiny fake coins that lure you toward him into a damage zone) and **PANIC** (he glows red, shrinks, flails, drops "crash" shockwaves). A big visible **mood meter** shows the swing.
- **Player counter-action:** **Act against the mood.** When he's in greedy euphoria, you must **NOT grab the shiny lures** (resist FOMO) and instead **whack him while he's overexposed**; when he's panicking, you **rush in and "buy"** (whack him) because he's weak/cheap. Hitting him at the *wrong* phase hurts *you* (greed-phase contact = expensive).
- **Why it's fun:** it's a **read-and-react rhythm** with a clean "patience is rewarded" payoff; the lure mechanic makes greed a real temptation, not a slogan.
- **Thematic fit:** *perfect* — it literally dramatizes "be fearful when others are greedy." This is the headline boss.

### Archetype B — "The Bubble" (volatility / inflation telegraph; Helmasaur-style armor)
- **Pattern:** Mr. Market inflates into a giant **speculative bubble** (armor = the hype). He's invulnerable while inflating; you **can't hurt the bubble directly**.
- **Player counter-action:** wait for the **over-inflation telegraph** (he flashes, over-extends — "the top of the market") and **pop him at the peak** with a well-timed newspaper whack (the dungeon-item-exposes-weakness beat). Pop → he deflates into a small panicked core (phase 2) you finish off.
- **Why it's fun:** pure **timing/telegraph read** — punish impatience (popping early does nothing/hurts) and greed (waiting too long, he bursts on *you*).
- **Thematic fit:** strong — "bubbles pop; time the peak." Great as **Phase 1** feeding into A or D.

### Archetype C — "The Deflector / Sentiment Tennis" (Agahnim-style)
- **Pattern:** Mr. Market is untouchable directly and **flings sentiment at you** — green "HYPE" orbs and red "FEAR" orbs.
- **Player counter-action:** **whack the orbs back at him** (deflect), but **only the correct-colored orb in the current mood damages him** (return GREED orbs while he's greedy, FEAR orbs while panicking — i.e., feed his own excess back). Later phase: **decoys/illusions** ("analyst clones" all shouting noise) — only the real Mr. Market can be hit.
- **Why it's fun:** reaction + discrimination ("which orb, which moment"), with a deception layer that rewards focus over noise.
- **Thematic fit:** good — "the market's own emotions, reflected; ignore the noise." Best as a **mid/late phase**.

### Archetype D — "The Patience Test / Compounding" (thematic inversion, Flamerus-Rex-style)
- **Pattern:** Mr. Market **taunts you to attack constantly** (flashing "BUY BUY BUY", "DON'T MISS OUT"). If you **mash whacks** (overtrade), he **counter-attacks harder each time** and you barely scratch him — attacking feeds him.
- **Player counter-action:** the **inverted counter** — you must **hold still / "do nothing" (wait out the noise)** to charge a **"Patience"/compounding meter**; when full, **one disciplined whack** does massive damage. The unintuitive move (restraint) is the win, like Curing the undead.
- **Why it's fun:** subverts boss-fight reflexes; the "aha, *waiting* is the weapon" reveal is memorable and on-brand.
- **Thematic fit:** *the* Buffett thesis — "the stock market is a device for transferring money from the impatient to the patient." Excellent **final phase** or a chained capstone after A/B.

**Recommended composition:** Build the fight as **3 short phases** that each teach a market lesson:
**Phase 1 = B (The Bubble: time the peak)** → **Phase 2 = A (The Mood Pendulum: act counter-cyclically)** → **Phase 3 = D (Patience Test: restraint as the finisher)**. Non-linear in spirit (you read his *state*, not a script), thematically coherent (bubble → swings → patience wins), and each phase reuses the **one verb you already have (the newspaper whack)** — no new control to teach mid-boss. Optionally fold C's deflect into Phase 2.

**→ How to apply in Barren Wuffett:** lead with **Archetype A** if you only build one; it's the cleanest "read greed vs. panic and act against it" loop and needs only a mood meter + lure projectiles + whack. Add B and D as phases when you have time. Avoid the menu/"decline×3 → buy low" linearity by making the win condition a **timing/positioning read of a visible mood state.**

---

## 6. Secrets & exploration rewards

**What the source games do:**
- **Hidden caves/rooms** behind bushes, bombable walls, and pushable blocks. ALttP/LA reward "cut this specific bush → stairs/well appear." Examples in LA: a Mabe Village **well (under bushes) hides a Heart Piece**; a bush at the Witch's Hut **hides a Seashell you dig up**; pushing skulls/stones in caves reveals **50-rupee chests**.
- **Optional collectibles with a meta-payoff:** **Secret Seashells** (LA) — scattered everywhere, found by cutting/digging/ramming trees with Pegasus Boots, and **turning in enough unlocks a powerful reward**. **Heart Pieces** (4 = +1 heart) reward thoroughness with permanent power.
- **Curiosity cues:** an out-of-place bush, a lone tree, a suspicious dead-end, a cracked wall — the game *visually hints* "something's here" so secrets feel earned, not pixel-hunted.

**→ How to apply in Barren Wuffett:**
- Give Level 1 a **small collectible set with a real payoff**, mirroring Seashells: e.g., **"Investment Journal" pages** (ties directly to your funnel collectible — finding them in-world is more compelling than an email gate). Hide them under special bushes, behind the dog's patrol, in a back alley, under a "dig here" dirt patch (needs the **Shovel/shop tool**), and as the **boss reward**.
- **Collect N pages → unlock something genuinely good** (a permanent newspaper upgrade, a coin bonus, a peek at the real Investment Journal content) — the Seashell-reward pattern.
- **One hidden "cave"** equivalent: a **cellar/shed** you open by whacking the right bush → a small room with a coin stash + a story Easter egg (young Buffett's first "business"). One memorable secret > ten boring ones.
- **Telegraph secrets visually:** a bush that's a slightly different tint, a lone tree, a dead-end alley — give the curious player a reason to look.

---

## 7. First-level pacing template (reusable for OUR Level 1)

**Distilled from all four games' openings:**

| Beat | Zelda 1 | Link's Awakening | FFMQ | **→ Barren Wuffett Level 1** |
|---|---|---|---|---|
| **Arrive / hook** | drop into overworld, cave beckons | shipwreck, wake at Marin's | climb hill → earthquake destroys village | Buffett wakes; Mom: *"Time for your paper route, sweetie."* (30-sec story hook) |
| **Get the verb** | wooden sword from cave | Shield from Tarin, Sword on beach | Cure spell + watch Kaeli chop trees | Mom hands the **rolled-up newspaper** at the door |
| **Safe practice** | lone Octoroks | push urchins with shield | first visible weak enemies | **2–3 bushes outside the house** (first whack = guaranteed coin) |
| **Small challenge** | clear a screen of enemies | navigate to beach past hazards | Level Forest path | **the patrolling dog** — slip past / it bites (consequence) |
| **Story beat** | (minimal) | the **Owl** + Marin's song | Minotaur poisons Kaeli; meet Tristam | meet the **3 NPCs** (neighbors w/ wants); learn what Mr. Market is doing to the town |
| **Mini-challenge / earn** | find dungeon 1 entrance | trading quest, Trendy Game | Bone Dungeon w/ Tristam | the **paper-route mini-game** (deliver to characterful houses) + bush-whacking to earn coins |
| **Spend / upgrade** | buy candle/shield in shop | the one shop (Bow/Shovel) | buy weapon/armor upgrades | **shop**: newspaper upgrade / helmet / bus-pass-gate |
| **Boss** | Aquamentus / Dodongo | Moldorm (Tail Cave) | Flamerus Rex (Bone Dungeon) | **Mr. Market** (Phase B→A→D, see §5) |
| **Reward / hook to next** | Triforce shard + heart container | instrument + map opens | Elixir + new spell/region | **+1 heart-equiv / journal pages / shop discount**, and a tease of Level 2 |

**The reusable rule of thumb (the "teach → practice → test → story → earn → spend → boss" loop):**
1. **Hook in <60s** (story + the verb).
2. **One verb, one safe practice spot, one just-in-time prompt** (§1).
3. **Introduce the hazard** only after the verb feels good (the dog).
4. **Story beat** (NPCs) to give the coins/effort *meaning* before asking for grind.
5. **Earn loop** (bushes + mini-game) sized so the player can afford **1–2 shop items** by boss time — *no forced farming*.
6. **Spend** on something that **visibly changes play** (verb upgrade / hazard counter / traversal gate).
7. **Boss** that **reuses the one verb** under a **state-read pattern** (never a new control, never a menu).
8. **Reward = permanent power + a tease** of the next area.

**Pacing cadence target (mobile, cozy):** the whole of Level 1 should be ~**15–25 minutes** of first play. Front-load a guaranteed reward (first-whack coin, first shop affordability) so the dopamine arrives early; keep the boss readable enough to beat in 2–3 attempts.

---

## Sources

**HIGH confidence (mechanics from dedicated wikis/speedrun docs with exact numbers):**
- ALttP prize-pack drop system, pack tables, deterministic counter, dash/stun rules — *ALttP Speedrunning Wiki, "Enemy prize packs"*: https://alttp-wiki.net/index.php/Enemy_prize_packs
- Zelda 1 kill-counter, forced 10-kill (5-rupee/bomb) & 16-kill (fairy) drops, counters cleared on hit — *Red Candle, "Legend of Zelda / Technical Information"*: https://redcandle.us/Legend_of_Zelda/Technical_Information ; *ZeldaSpeedRuns, "Forced Item Drops"*: https://www.zeldaspeedruns.com/loz/tech/forced-item-drops and "Item Drops Chart": https://www.zeldaspeedruns.com/loz/generalknowledge/item-drops-chart
- FFMQ Battlefields (10 battles → GP/EXP/item/spell, optional, non-respawning), linear gated world map — *Final Fantasy Wiki (Fandom), "Battlefield (Mystic Quest)"*: https://finalfantasy.fandom.com/wiki/Battlefield_(Mystic_Quest)

**HIGH/MEDIUM confidence (boss & shop specifics from guides):**
- ALttP boss patterns — Helmasaur (break mask → weak point → erratic phase 2), Agahnim (deflect energy balls, 3 illusions, 4 hits) — *Links Hideaway, "A Link To The Past Bosses"*: https://www.linkshideaway.com/a-link-to-the-past/boss-guide/ ; *ZeldaCentral boss guide*: https://zeldacentral.com/games/a-link-to-the-past/boss-guide/
- FFMQ bosses — Flamerus Rex (undead, hurt by Cure), Squidite (minions + elemental weakness), Minotaur/Behemoth opening — *Final Fantasy Wiki*: https://finalfantasywiki.com/wiki/Flamerus_Rex ; *Mike's RPG Center bestiary*: https://mikesrpgcenter.com/ffmq/bestiary.html ; *GameFAQs FFMQ walkthroughs*: https://gamefaqs.gamespot.com/snes/532476-final-fantasy-mystic-quest/faqs/5510
- ALttP early shop prices (Bottle 100R, Bombs 30/100, Arrows 10/30, Flippers 500R, selling Golden Bees) — *GameFAQs ALttP Shops Guide*: https://gamefaqs.gamespot.com/snes/588436-the-legend-of-zelda-a-link-to-the-past/faqs/6913
- Link's Awakening single shop (Bow/Shovel/Shield), opening beat order, urchin sign teaching shield — *Nintendo Life, "Leaving Mabe Village, Finding The Sword"*: https://www.nintendolife.com/guides/zelda-links-awakening-leaving-mabe-village-finding-the-sword ; *Game8 Shops & Mini-Games*: https://game8.co/games/Zelda-Links-Awakening/archives/272244
- LA secrets (Mabe well Heart Piece under bushes, Witch's Hut seashell dig, 50-rupee skull-cave chests) — *Zelda's Palace LA walkthrough*: https://www.zeldaspalace.com/linksawakening/soluce.php?p=1 ; rupee guide: https://www.zeldaspalace.com/linksawakening/rupees.php

**HIGH confidence (onboarding/philosophy):**
- Zelda 1 "It's dangerous to go alone," Miyamoto's deliberate no-guidance design, player agency — *Wikipedia, "It's dangerous to go alone!"*: https://en.wikipedia.org/wiki/It%27s_dangerous_to_go_alone%21
- FFMQ "simplified RPG for entry-level players," visible enemies / no random battles / auto-equip / respawning chests, action-adventure dungeon navigation — *TV Tropes, FFMQ*: https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/FinalFantasyMysticQuest ; *Wikipedia, FFMQ*: https://en.wikipedia.org/wiki/Final_Fantasy_Mystic_Quest
- FFMQ opening (Hill of Destiny earthquake → Foresta Cure spell → Kaeli chops path → Bone Dungeon → Flamerus Rex) — *StrategyWiki FFMQ Walkthrough*: https://strategywiki.org/wiki/Final_Fantasy_Mystic_Quest/Walkthrough

**MEDIUM confidence (general game-feel / synthesis):**
- "The Zelda Pattern" boss critique (use-the-item formula = formulaic) — *Zelda Dungeon, "Critical Analysis … 'The Zelda Pattern'"*: https://www.zeldadungeon.net/critical-analysis-video-examines-the-zelda-pattern-in-boss-design/
- Contact damage / knockback / mercy-invincibility best practices (i-frames = fairness; no damage during knockback; reduce KB if it frustrates recovery) — *TV Tropes "Mercy Invincibility" & "Knockback"*: https://tvtropes.org/pmwiki/pmwiki.php/Main/MercyInvincibility , https://tvtropes.org/pmwiki/pmwiki.php/Main/Knockback ; *LasTeamLab Godot knockback lesson*: https://lasteamlab.com/documentation/game-design/godot/RPG/lessons/4-knockback.html

**Confidence note:** Drop-system *structures* (deterministic counters, forced-streak drops, prize-pack slots) and *boss patterns* are well-documented and high-confidence. Exact per-bush probabilities for Barren Wuffett are **proposed tuned defaults**, not lifted numbers — they're starting points to playtest and adjust. ALttP/Zelda-1 percentages quoted are as documented by the speedrun community (very reliable but specific to those games). FFMQ details are consistent across multiple guide sources.
