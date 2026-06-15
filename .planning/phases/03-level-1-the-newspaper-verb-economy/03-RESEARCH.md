# Phase 3: Level 1 — The Newspaper Verb & Economy - Research

**Researched:** 2026-06-15
**Domain:** Phaser 4 Arcade Physics — melee hitbox, contact hazards, UIScene modal overlay extension, deterministic drop economy, data-manifest content extension
**Confidence:** HIGH (all architecture derived from verified codebase reads + Phaser 4 public API; tuning numbers are locked design decisions from CONTEXT.md)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### A. Newspaper Whack Verb (L1E-01)
- **D-01:** Add `Action.WHACK` to `InputBus`. Touch: newspaper button bottom-right thumb zone (≥44px, ~x=360,y=750). Keyboard: Space/Enter when no NPC in range (otherwise INTERACT); dedicated always-whack key `J`. Talk-to-NPC stays existing tap-on-NPC zone.
- **D-02:** Hit detection = short-lived directional hitbox in front of player based on `facing`, active ~120–180ms, ~300–400ms cooldown. Overlaps a Phaser Arcade physics "whackable" group.
- **D-03:** Crisp feedback — swing animation, bush shake → leaf/puff particle → bush clears (hidden + marked cleared), whack SFX + coin "ding" on drop. Bushes regrow on level re-entry.
- **D-04:** Player swing animation = overlay sprite `newspaper_swing` anchored by facing — NOT a player-sheet re-cut (8-frame sheet stays untouched).

#### B. Prize-Pack Economy & Snowball HUD (L1E-02)
- **D-05:** ALttP deterministic 8-slot prize-pack: `[1 coin, nothing, 1 coin, 3 coins, 1 coin, snack(heart), 1 coin, 5 coins]`, ~55% drop chance per whack. Average ≈ 1.7 coins/successful whack.
- **D-06:** First bush of a new game ALWAYS drops a coin (one-time override via `first_whack_done` flag).
- **D-07:** Streak bonus — whack 8 bushes without dog hit → bonus pile (8 coins start) or Journal page at milestone bushes. Dog hit resets streak to 0. Streak is transient (not persisted).
- **D-08:** Wire coins → HUD via `COINS_CHANGED` event. OverworldScene → UIScene/HUD. Reuse existing `flashPatienceBonus` float pattern for "+N" pickups.

#### C. Dog Hazard & Hospital Loop (L1E-03)
- **D-09:** Convert existing patrol dog to hazard. Keep patience-gap reward (GAME-06). Add bite on contact when player is not in i-frames.
- **D-10:** On bite — knockback ~150–200ms tween, grant ~0.8–1.0s i-frames with sprite flash.
- **D-11:** "WAKE UP IN HOSPITAL" splash (new UIScene overlay state `HOSPITAL`, ~1–1.5s, tap/auto-dismiss) → respawn at (96,96) → deduct 5 coins (floored at 0) → reset streak. Never a death screen.
- **D-12:** Helmet (`upgrade_helmet`) waives hospital coin fee. Still knockback + i-frames + streak reset.

#### D. Shop, Upgrades & Traversal Gate (L1E-04)
- **D-13:** Shop opens via storeClerk NPC (352,160). New UIScene overlay state `SHOP`. Coins authoritative in OverworldScene; purchases flow over events.
- **D-14:** Four items — Sunday Edition (~20c, `upgrade_newspaper`), Bike Helmet (~35c, `upgrade_helmet`), Bus Pass (~60c, `upgrade_traversal`), Snack (~5c, consumable not persisted).
- **D-15:** Permanent upgrades via `SaveState.flags` bag. No schema migration. Snack consumable only.
- **D-16:** Traversal gate = collidable barrier removed when `upgrade_traversal` flag is set. Candidate: east path cols 20–29 rows 7–8.

#### E. Architecture, Data & Cross-cutting
- **D-17:** New systems are content-agnostic. Level-specific content in level data (extend `level-01` manifest or add `level-01-economy.ts`).
- **D-18:** All new strings via `t()` + `src/data/dialogue/en/level-01.json`.
- **D-19:** New GameEvents constants: `COINS_CHANGED`, `BUSH_WHACKED`, `PLAYER_HOSPITALIZED`, `SHOP_OPEN`, `SHOP_PURCHASE`, `STREAK_BONUS`.
- **D-20:** Art/audio via existing Kenney CC0 pipeline through `Preloader`. New assets: bush sprite, `newspaper_swing` overlay, shop/helmet icons. SFX keys: whack, coin-ding, dog-bite, purchase-chime, hospital-sting.

### Claude's Discretion
- All tuning numbers (prices, drop %, hospital fee, i-frame duration, streak threshold, knockback distance, cooldown) — starting defaults, adjust by playtest.
- Exact gated-area location and placement of 2–4 special/hidden bushes.
- Exact whack key letter(s); whether shop stays UIScene overlay or becomes ShopScene.
- Whether newspaper-upgrade effect is reach, hitbox size, or both.

### Deferred Ideas (OUT OF SCOPE)
- Mood-Pendulum boss redesign + paper-route glow-up → Phase 4.
- Story spine, new parody NPCs, cutscenes, Count-the-Caps, Pinball-Snowball mini-games, full Journal reward payoff → Phase 5.
- Sell/trade loop, second shop, hidden cellar/shed "cave".
- Scatter-coins-you-can-re-collect dog-penalty variant.
- Funnel/backend, cloud-save, real Journal email unlock → Phase 7.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| L1E-01 | Newspaper as real interaction verb — swing to destroy bushes/props, crisp visual + audio feedback | D-01..D-04: InputBus.WHACK, directional hitbox, overlay swing sprite, feedback pipeline |
| L1E-02 | Deterministic 8-slot prize-pack, first bush = coin, HUD snowball coin counter | D-05..D-08: PrizePack module, COINS_CHANGED event, HUD.setCoins() wiring |
| L1E-03 | Non-lethal dog hazard: knockback + i-frames + hospital respawn + coin fee + streak reset | D-09..D-12: Arcade body disable, i-frame flash tween, HOSPITAL UIScene state |
| L1E-04 | Town shop: 4 items, permanent upgrade flags, traversal gate opens gated area | D-13..D-16: SHOP UIScene state, SaveState.flags, barrier removal pattern |
</phase_requirements>

---

## Summary

Phase 3 implements four mechanical systems on top of the existing Phaser 4 + TypeScript codebase: (1) the newspaper whack verb as a directional short-lived Arcade hitbox; (2) a deterministic prize-pack drop economy wired to the HUD coin counter; (3) the patrolling dog converted from a patience reward into a non-lethal contact hazard with knockback, i-frames, and the hospital gag; and (4) a town shop modal with four permanent upgrades and a traversal gate. All design decisions are locked in CONTEXT.md — this document answers only the "how" for the planner.

The codebase is in excellent shape for this phase. OverworldScene owns coins and dog; Player has movement only and needs three new capabilities; UIScene has a clean 4-state machine ready for two new states (SHOP, HOSPITAL); SaveState.flags already handles arbitrary boolean upgrades; GameEvents is an extensible frozen-constants bus; the Preloader pipeline handles any new assets without structural changes. The single most important gap to close first is the HUD↔coins wiring (D-08) — nothing else in the snowball HUD criterion is visible until COINS_CHANGED is emitted and HUD.setCoins() is called.

The cleanest vertical-slice sequence is: (1) add WHACK action + whack button → (2) add PrizePack module + bush entities → (3) wire COINS_CHANGED → HUD → (4) add dog bite + knockback + i-frames + hospital overlay → (5) add SHOP overlay + upgrade flags → (6) add traversal gate barrier. Each step is independently runnable on the dev server.

**Primary recommendation:** Build the thinnest "whack one bush → coin drops → HUD increments → save persists" slice first (Wave 1), then layer dog/hospital (Wave 2) and shop/gate (Wave 3). The PrizePack module must be a pure TS function with no Phaser dependency so it is unit-testable without a DOM.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Whack input (WHACK action) | InputBus (client utility) | Player.update() poll | InputBus is the existing unified input abstraction; all actions live here |
| Directional hitbox activation | Player entity (owns facing) | OverworldScene (owns whackable group) | Player knows facing; OverworldScene owns the physics group and overlap check |
| Prize-pack drop logic | PrizePack module (pure TS) | OverworldScene (calls module, owns coins) | Logic must be testable without Phaser; OverworldScene applies the result |
| Coin state + persistence | OverworldScene (authoritative) | SaveService (persistence) | Single source of truth; all other systems read via events |
| HUD coin display | HUD / UIScene | GameEvents (COINS_CHANGED) | UIScene renders; OverworldScene emits |
| Dog collision + knockback | OverworldScene (owns dog + player) | Player entity (receives knockback) | OverworldScene owns both objects; Player exposes a knockback/iframes API |
| Hospital overlay | UIScene (HOSPITAL state) | OverworldScene (emits PLAYER_HOSPITALIZED) | UIScene is the overlay layer; OverworldScene handles game-state effects |
| Shop modal | UIScene (SHOP state) | OverworldScene (validates + applies purchase) | Modal rendering in UIScene; coin validation stays in OverworldScene |
| Upgrade persistence | SaveState.flags (generic bag) | OverworldScene (reads flags on init) | Flags bag already exists; no schema change needed |
| Traversal gate barrier | OverworldScene (collidable object) | level-01 data (barrier position) | Barrier is a world-space object; removal is triggered by flag check |
| SFX playback | AudioService (existing toggle gate) | OverworldScene / Player (call site) | AudioService guards all SFX behind the sfx-enabled toggle |
| New strings | i18n / common.json + level-01.json | All call sites via t() | INFR-05: all player-facing strings must go through t() |

---

## Standard Stack

No new packages required for this phase. All mechanics are built on the existing stack.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `phaser` | 4.1.0 | Game engine — Arcade physics, tweens, particles, tilemaps | [VERIFIED: package.json] Already installed; Arcade physics group + overlap is the standard Phaser hitbox pattern |
| `idb-keyval` | ^6.2.5 | IndexedDB persistence via SaveService | [VERIFIED: package.json] Already installed; SaveState.flags covers upgrade persistence with zero schema change |
| `phaser4-rex-plugins` | 4.0.7 | VirtualJoystick (already in use) | [VERIFIED: package.json] Already installed; whack button is a separate Phaser Rectangle/Image, not a rex plugin |
| `vitest` | ^2.0.0 | Unit test runner | [VERIFIED: package.json] Already installed; PrizePack module tests run in `node` environment, no DOM |
| `fake-indexeddb` | ^6.2.5 | SaveService tests | [VERIFIED: package.json] Already installed |

### No New Packages
This phase adds zero npm dependencies. All required primitives exist in Phaser 4.1.0:
- `Phaser.Physics.Arcade.Group` — whackable bush group
- `this.physics.add.overlap()` — hitbox-vs-group detection
- `this.physics.add.collider()` — dog-vs-player (or manual distance check)
- `this.tweens.add()` — knockback tween, swing tween, i-frame flash
- `this.add.particles()` — leaf/puff particle on bush clear (Phaser 4 new particles API)
- `Phaser.GameObjects.Rectangle` — hitbox body (static, enable/disable)
- `Phaser.GameObjects.Image` / `Phaser.GameObjects.Sprite` — bush entity, newspaper overlay

**Installation:** none required.

---

## Package Legitimacy Audit

No new packages are installed in this phase. All libraries are already in `package.json` and have been in active use since Phase 1/2.

| Package | Registry | In Use | Verdict | Disposition |
|---------|----------|--------|---------|-------------|
| phaser@4.1.0 | npm | Yes (Phase 1+) | OK | Approved |
| idb-keyval@^6.2.5 | npm | Yes (Phase 1+) | OK | Approved |
| phaser4-rex-plugins@4.0.7 | npm | Yes (Phase 2+) | OK | Approved |
| vitest@^2.0.0 | npm | Yes (Phase 1+) | OK | Approved |
| fake-indexeddb@^6.2.5 | npm | Yes (Phase 2+) | OK | Approved |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious (SUS):** none

---

## Architecture Patterns

### System Architecture Diagram

```
[InputBus]
  + Action.WHACK (new)
      |
      v
[Player.update()]
  - polls InputBus.isActive(WHACK)
  - if whacking && cooldown elapsed:
      → show newspaper_swing overlay (tween)
      → notify OverworldScene: activateHitbox(facing)
      |
      v
[OverworldScene.activateHitbox(facing)]
  - creates/repositions Rectangle body in front of player
  - physics.add.overlap(hitboxRect, whackableGroup, onHit)
  - schedules deactivation after 150ms
      |
      v (on overlap)
[onHit(hitbox, bushEntity)]
  - bushEntity.onWhacked() → hide sprite, mark cleared, play particles
  - PrizePack.roll(packState) → { coins: N, item: 'snack'|null }
  - if D-06 first_whack: force coin drop
  - this.coins += N
  - emit BUSH_WHACKED
  - emit COINS_CHANGED(this.coins)
  - if streak: emit STREAK_BONUS
      |
      v
[UIScene ← GameEvents.COINS_CHANGED(n)]
  - hud.setCoins(n)         ← closes the HUD gap (D-08)
  - hud.flashCoinPickup(n)  ← "+N" float tween (reuse flashPatienceBonus pattern)
      |
[GameEvents.SAVE_AUTOSAVE or checkpoint]
  → SaveService.save(buildSaveState())

[Dog Patrol (existing tween)]
  - manual distance check vs player in OverworldScene.update()
  - if overlap && !player.isInvincible():
      → player.applyKnockback(dogPos) → tween away, iframes ON (flash)
      → emit PLAYER_HOSPITALIZED
      → this.coins = max(0, this.coins - 5)
      → emit COINS_CHANGED(this.coins)
      → streak = 0
      |
      v
[UIScene ← PLAYER_HOSPITALIZED]
  - setState('HOSPITAL')      ← new UIScene state
  - show "WAKE UP IN HOSPITAL" overlay 1.5s (auto-dismiss or tap)
  - on dismiss: setState('HUD'), respawn player at (96,96)

[storeClerk NPC tap / interact]
  - existing handleInteract() gates → if npcId === 'storeClerk' && !inDialogue:
      → emit SHOP_OPEN
      |
      v
[UIScene ← SHOP_OPEN]
  - setState('SHOP')   ← new UIScene state
  - render shop panel with 4 items from level-01-economy data
  - on item tap: emit SHOP_PURCHASE({itemId, price})
      |
      v
[OverworldScene ← SHOP_PURCHASE]
  - validate: this.coins >= price && !flags[itemId]
  - if valid: this.coins -= price; this.flags[itemId] = true
  - emit COINS_CHANGED(this.coins)
  - emit SHOP_CLOSE (or re-emit SHOP_OPEN with updated state)
  - if itemId === 'upgrade_traversal': remove gate barrier
  - SaveService.save(buildSaveState())
```

### Recommended Project Structure (new files only)

```
src/
├── systems/
│   ├── TriggerSystem.ts         (existing — no change)
│   ├── PrizePack.ts             (NEW — pure TS, no Phaser dep)
│   └── WhackSystem.ts           (NEW — hitbox lifecycle, bush group management)
├── entities/
│   ├── Player.ts                (EXTEND — add whack(), applyKnockback(), isInvincible)
│   ├── NPC.ts                   (existing — no change)
│   └── BushEntity.ts            (NEW — whackable prop entity)
├── data/
│   └── levels/
│       ├── level-01.ts          (existing — no change, or minor manifest extension)
│       └── level-01-economy.ts  (NEW — bush positions, prize-pack table, shop inventory, gate coords)
├── input/
│   └── InputBus.ts              (EXTEND — add Action.WHACK)
├── events/
│   └── GameEvents.ts            (EXTEND — add COINS_CHANGED, BUSH_WHACKED, PLAYER_HOSPITALIZED, SHOP_OPEN, SHOP_PURCHASE, STREAK_BONUS)
├── ui/
│   ├── HUD.ts                   (EXTEND — add flashCoinPickup(n), wire to COINS_CHANGED)
│   └── ShopOverlay.ts           (NEW — renders SHOP UIScene state panel)
│   └── HospitalOverlay.ts       (NEW — renders HOSPITAL UIScene state panel)
├── game/scenes/
│   ├── OverworldScene.ts        (EXTEND — dog bite, hitbox, shop/hospital dispatch)
│   └── UIScene.ts               (EXTEND — add SHOP + HOSPITAL states)
└── public/locales/en/
    └── common.json              (EXTEND — add shop/hospital/whack strings)
src/data/dialogue/en/
    └── level-01.json            (EXTEND — add shop dialogue lines, hospital line, clerk shop-intro)
```

### Pattern 1: Directional Melee Hitbox (Phaser 4 Arcade)

**What:** A short-lived invisible Rectangle placed in front of the player based on `facing`. Enable it for 150ms, check overlap against the whackable group, then disable it.

**When to use:** Any melee interaction where "swing and hit what's in front" semantics are needed. Reusable for boss phase in Phase 4.

**Example:**
```typescript
// Source: Phaser 4 Arcade Physics documentation + codebase pattern
// In WhackSystem.ts (or inlined in OverworldScene)

activateHitbox(scene: Phaser.Scene, playerX: number, playerY: number, facing: string): void {
    // Position hitbox 24px in front of player based on facing
    const offsets: Record<string, {dx: number, dy: number}> = {
        down:  { dx: 0,   dy: 24  },
        up:    { dx: 0,   dy: -24 },
        left:  { dx: -24, dy: 0   },
        right: { dx: 24,  dy: 0   },
    };
    const { dx, dy } = offsets[facing] ?? offsets.down;

    // hitboxRect is a pre-created static arcade body Rectangle, kept hidden most of the time
    this.hitboxRect.setPosition(playerX + dx, playerY + dy);
    this.hitboxRect.setActive(true).setVisible(false); // invisible but active for overlap

    // Physics body: enable for this frame window
    (this.hitboxRect.body as Phaser.Physics.Arcade.StaticBody).enable = true;

    // Deactivate after 150ms
    scene.time.delayedCall(150, () => {
        (this.hitboxRect.body as Phaser.Physics.Arcade.StaticBody).enable = false;
        this.hitboxRect.setActive(false);
    });
}
```

**Key detail:** Use a **static** Arcade body (`physics.add.staticSprite` or `physics.add.staticImage`) for the hitbox — it does not need velocity, just a position and enable toggle. The overlap callback fires as long as the body is enabled and overlapping. [ASSUMED — Phaser 4 StaticBody overlap with dynamic group is the documented pattern; verify exact API against Phaser 4 docs if behavior differs]

### Pattern 2: Physics Group for Whackable Bushes

**What:** A Phaser Arcade Physics Group whose members are BushEntity sprites. The group is populated at scene create() from level-01-economy data. `this.physics.add.overlap(hitboxRect, whackableGroup, onHit)` fires the callback.

**When to use:** Any set of homogeneous whackable objects.

```typescript
// Source: Phaser 4 Arcade Physics Group pattern
// In OverworldScene.create():

this.whackableGroup = this.physics.add.group();

for (const bushDef of ECONOMY_DATA.bushes) {
    const bush = new BushEntity(this, bushDef.x, bushDef.y, bushDef.id, bushDef.special);
    this.whackableGroup.add(bush.sprite);
    this.bushEntities.set(bushDef.id, bush);
}

this.physics.add.overlap(
    this.hitboxRect,
    this.whackableGroup,
    (hitbox, bushSprite) => {
        const bushId = (bushSprite as Phaser.Physics.Arcade.Sprite).getData('bushId') as string;
        const bush = this.bushEntities.get(bushId);
        if (bush && !bush.isCleared()) this.onBushHit(bush);
    }
);
```

### Pattern 3: I-Frames Flash (Sprite Alpha Tween)

**What:** While the player is invincible after a dog bite, flash the sprite alpha between 1 and 0 repeatedly for the i-frame duration.

**When to use:** Any mercy-invincibility period (standard game-feel pattern).

```typescript
// Source: Phaser 4 tweens API, standard mercy-invincibility pattern [ASSUMED]
// In Player.ts:

applyKnockback(fromX: number, fromY: number, onComplete: () => void): void {
    this._invincible = true;
    const KNOCKBACK_DIST = 48;
    const angle = Math.atan2(this.sprite.y - fromY, this.sprite.x - fromX);
    const targetX = this.sprite.x + Math.cos(angle) * KNOCKBACK_DIST;
    const targetY = this.sprite.y + Math.sin(angle) * KNOCKBACK_DIST;

    // Knockback tween: move away from dog over 180ms
    this.sprite.scene.tweens.add({
        targets: this.sprite,
        x: targetX, y: targetY,
        duration: 180,
        ease: 'Power2',
        onComplete: () => {
            // I-frame flash: alpha oscillation for 900ms
            this.sprite.scene.tweens.add({
                targets: this.sprite,
                alpha: 0,
                duration: 80,
                yoyo: true,
                repeat: 5,
                onComplete: () => {
                    this.sprite.setAlpha(1);
                    this._invincible = false;
                    onComplete();
                }
            });
        }
    });
}

get isInvincible(): boolean { return this._invincible; }
```

**Critical:** Set velocity to zero during knockback tween OR disable physics body briefly to prevent the tween fighting the physics system. After tween completes, re-enable normal velocity. [ASSUMED — standard pattern for tween + Arcade body coexistence]

### Pattern 4: UIScene State Machine Extension

**What:** The existing `UIState = 'HUD' | 'DIALOGUE' | 'PAUSE' | 'LEVEL_COMPLETE'` union type is extended to `'HUD' | 'DIALOGUE' | 'PAUSE' | 'LEVEL_COMPLETE' | 'SHOP' | 'HOSPITAL'`. The `setState()` method already hides/shows objects based on state — extend it to handle the new overlay containers.

**When to use:** Any new full-canvas modal in UIScene.

```typescript
// Source: UIScene.ts (verified codebase read)

type UIState = 'HUD' | 'DIALOGUE' | 'PAUSE' | 'LEVEL_COMPLETE' | 'SHOP' | 'HOSPITAL';

private setState(state: UIState): void {
    this.uiState = state;
    this.hud.setVisible(state === 'HUD');
    this.pauseBackdrop.setVisible(state === 'PAUSE');
    this.pauseOverlay.setVisible(state === 'PAUSE');
    // NEW:
    this.shopOverlay?.setVisible(state === 'SHOP');
    this.hospitalOverlay?.setVisible(state === 'HOSPITAL');
}

// HOSPITAL: auto-dismiss after 1.5s OR on tap
private onPlayerHospitalized = (): void => {
    this.setState('HOSPITAL');
    // Pause the overworld while splash is showing
    if (this.scene.get('OverworldScene')?.scene.isActive()) {
        this.scene.pause('OverworldScene');
    }
    const dismiss = (): void => {
        this.setState('HUD');
        if (this.scene.get('OverworldScene')?.scene.isPaused()) {
            this.scene.resume('OverworldScene');
        }
    };
    this.time.delayedCall(1500, dismiss);
    this.input.once('pointerdown', dismiss);
};
```

### Pattern 5: Traversal Gate Barrier

**What:** A collidable Arcade body placed at the gate location (e.g., east path cols 20–29, rows 7–8, pixel coords ~320–464, 112–128). When `upgrade_traversal` flag is set, the body is disabled and the barrier sprite is hidden.

**When to use:** Any one-time-unlockable environmental barrier.

```typescript
// Source: Phaser 4 StaticBody enable/disable pattern [ASSUMED]
// In OverworldScene.create():

// Create gate as a static physics body rectangle
this.gateBarrier = this.add.rectangle(392, 120, 144, 32, 0x000000, 0); // invisible
this.physics.add.existing(this.gateBarrier, true); // true = static body
this.physics.add.collider(this.player.sprite, this.gateBarrier);

// Optional: visible gate sprite (fence/chain) at same position
this.gateSprite = this.add.image(392, 120, 'gate_barrier');

// After purchase of upgrade_traversal:
removeGate(): void {
    (this.gateBarrier.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.gateSprite?.setVisible(false);
    this.flags['upgrade_traversal'] = true;
    void SaveService.save(this.buildSaveState());
}

// On scene create(), restore gate state from saved flags:
if (!this.flags['upgrade_traversal']) {
    // gate is active (default state above)
} else {
    this.removeGate(); // immediately open if already purchased
}
```

### Anti-Patterns to Avoid

- **Putting coin state in UIScene:** UIScene must only display what OverworldScene emits. If UIScene owns coins, purchases will desync from saves. All coin arithmetic stays in OverworldScene. [VERIFIED: existing architecture pattern]
- **Using `physics.add.collider()` for the hitbox:** Collider pushes objects apart; use `physics.add.overlap()` for hit detection that doesn't affect positions. [ASSUMED — standard Phaser collision vs overlap semantics]
- **Re-cutting player_sheet for the swing animation:** D-04 locks this as an overlay sprite. The existing 8-frame sheet has no space for swing frames, and re-art would break Phase 2 work. [VERIFIED: Preloader.ts — sheet is 128×16, 8 frames]
- **Emitting COINS_CHANGED from UIScene or SaveService:** Only OverworldScene emits COINS_CHANGED. Other systems only listen. Avoids event loops. [VERIFIED: D-13 decision + existing GameEvents pattern]
- **Making PrizePack stateful via Phaser:** PrizePack must be a plain TypeScript class/module with no `this.scene` reference, so it is unit-testable with vitest in node environment. [VERIFIED: existing test pattern in tests/input-bus.test.ts + tests/save-service.test.ts]
- **Destroying bush sprites:** Mark cleared with `setVisible(false)` + `body.enable = false`, and store cleared state in OverworldScene (not in SaveState — bushes regrow on re-entry per D-03). Re-entry = re-enable sprites and clear the session-cleared-set.
- **Tween + physics body fighting:** During knockback tween, set `player.sprite.body.velocity.set(0,0)` or temporarily `setImmovable(true)` on the body so the tween position is not overridden by physics velocity. Re-enable after tween. [ASSUMED]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Particle burst on bush clear | Custom sprite animation | `this.add.particles()` Phaser 4 particle emitter | Phaser 4 particles API handles burst emitters, gravity, scale, alpha tween in one call |
| Smooth tween-based knockback | Manual position delta in update() | `this.tweens.add()` | Tweens handle interpolation, easing, onComplete callback cleanly; update() approach fights Arcade physics |
| Hitbox rectangle | Phaser.Geom.Rectangle distance check | `this.physics.add.overlap()` with StaticBody | physics.overlap fires per-frame automatically; manual rect checks require update() polling and miss sub-frame overlaps |
| HUD "+N" float text | Custom update() Y decrement | Tween (same as existing `flashPatienceBonus`) | Already implemented in HUD.ts — reuse the pattern verbatim |
| UIScene overlay backdrop | A new Phaser Scene | UIScene state machine extension | The existing `setState()` pattern handles show/hide; a new Scene adds launch/sleep overhead and input routing complexity |
| Timer for i-frame duration | `Date.now()` delta in update() | `this.time.delayedCall()` | Phaser timer handles scene pause correctly; Date.now() does not pause when scene is paused |

**Key insight:** This phase is wiring existing Phaser primitives and existing codebase patterns into new configurations. The biggest risk is inventing new infrastructure when a simpler primitive already exists (especially around timers, tweens, and physics overlap).

---

## Common Pitfalls

### Pitfall 1: Physics Body vs Tween Position Conflict
**What goes wrong:** During knockback tween, the physics system continues to apply velocity. The player's position oscillates or the tween has no visible effect.
**Why it happens:** Arcade physics updates position from velocity every frame, overriding tween-set positions.
**How to avoid:** Before starting the knockback tween, call `this.player.sprite.setVelocity(0, 0)` and/or set `this.player.sprite.body.moves = false`. Re-enable in the tween's `onComplete` callback.
**Warning signs:** Player snaps back or vibrates during knockback.

### Pitfall 2: Dog Overlap Fires Every Frame During I-Frames
**What goes wrong:** The hospital loop triggers repeatedly while the player is overlapping the dog during i-frames, causing multiple deductions per bite.
**Why it happens:** `physics.add.overlap` fires continuously as long as two bodies overlap, not just on first contact.
**How to avoid:** Gate the bite handler with `player.isInvincible` check (as locked in D-09). The i-frame flag is set immediately in `applyKnockback()`, blocking re-entry into the bite handler.
**Warning signs:** Coins drain to 0 in a single dog encounter.

### Pitfall 3: COINS_CHANGED Feedback Loop
**What goes wrong:** UIScene emits a SHOP_PURCHASE event → OverworldScene deducts coins and emits COINS_CHANGED → UIScene re-renders shop with new coin total → this triggers another shop render loop.
**Why it happens:** Bidirectional event wiring without careful ownership.
**How to avoid:** UIScene only listens for COINS_CHANGED to update the HUD counter, not to re-open or re-render the shop. The shop panel reads coin total once on open (via a request/response pattern or by passing coins in the SHOP_OPEN event payload).
**Warning signs:** Shop opens and closes repeatedly on purchase.

### Pitfall 4: UIScene.shutdown() Missing New Event Listeners
**What goes wrong:** SHOP and HOSPITAL listeners are not removed in shutdown(), causing zombie listeners on second game start (the existing CR-03 pattern).
**Why it happens:** UIScene.shutdown() precisely lists each registered listener — new events must be added to this list.
**How to avoid:** For every `GameEvents.on(Events.X, this.handler, this)` in `create()`, add a matching `GameEvents.off(Events.X, this.handler, this)` in `shutdown()`. Store handlers as class fields (existing pattern).
**Warning signs:** Hospital or shop fires twice after returning to main menu and starting again.

### Pitfall 5: PrizePack Counter Not Resetting on Level Re-entry
**What goes wrong:** The prize-pack counter persists in memory across level visits, so bushes that regrow start at a non-zero slot.
**Why it happens:** PrizePack holds module-level state.
**How to avoid:** PrizePack state (the slot counter) is scoped to OverworldScene — passed in or instantiated in OverworldScene.create() and garbage-collected with the scene. Use a class instance, not a module singleton.
**Warning signs:** After leaving and returning to overworld, first bush in a fresh field yields the "wrong" prize.

### Pitfall 6: Whack Button Overlapping the VirtualJoystick
**What goes wrong:** On small phones, the ≥44px whack button and the 80px-radius joystick overlap, causing whack to fire when the player moves.
**Why it happens:** Joystick center is at (120, 750) with 80px radius; if whack button is placed near (120, 750) it will conflict.
**How to avoid:** D-01 specifies whack button at approximately (360, 750) — the opposite thumb zone from the joystick (120, 750). The 480px canvas width leaves 120px separation. Verify on the actual dev server before planning the coordinate as a hard constant.
**Warning signs:** Player whacks while walking on touch devices.

### Pitfall 7: OverworldScene.update() Blocked by inHandoff
**What goes wrong:** The shop open/close cycle needs to pause OverworldScene input while the shop is open. If OverworldScene is not paused during the SHOP state, the player can move while shopping.
**Why it happens:** UIScene overlay states currently only pause OverworldScene during DIALOGUE (see UIScene.ts line 89). SHOP and HOSPITAL need the same pattern.
**How to avoid:** `SHOP_OPEN` → UIScene pauses OverworldScene; `SHOP_CLOSE` → resumes it. Or, add `'SHOP' | 'HOSPITAL'` to the gate condition in OverworldScene.update() (similar to `inDialogue` and `inHandoff` guards at line 232).
**Warning signs:** Player drifts off screen while shopping.

### Pitfall 8: BushEntity Not Found in Overlap Callback
**What goes wrong:** The `physics.add.overlap()` callback receives the physics body (second arg is the child sprite), but `this.bushEntities.get(bushId)` returns undefined.
**Why it happens:** The `getData('bushId')` call returns null if the data was set on a different object (the entity class vs the sprite).
**How to avoid:** Set `bush.sprite.setData('bushId', bushDef.id)` explicitly in BushEntity constructor or in OverworldScene when adding to the group. Test with a console.log in the overlap callback during development.
**Warning signs:** Whacking bushes has no effect (no coin, no clear).

---

## Code Examples

Verified patterns from the existing codebase:

### Extending GameEvents Constants (D-19)
```typescript
// Source: src/events/GameEvents.ts (verified codebase read)
// Pattern: add to the EXISTING Object.freeze — do not create a second const

export const Events = Object.freeze({
    // existing:
    DIALOGUE_START:       'DIALOGUE_START',
    DIALOGUE_COMPLETE:    'DIALOGUE_COMPLETE',
    PAUSE_REQUESTED:      'PAUSE_REQUESTED',
    RESUME_REQUESTED:     'RESUME_REQUESTED',
    MINIGAME_COMPLETE:    'MINIGAME_COMPLETE',
    BOSS_DEFEATED:        'BOSS_DEFEATED',
    PATIENCE_BONUS:       'PATIENCE_BONUS',
    // Phase 3 additions:
    COINS_CHANGED:        'COINS_CHANGED',
    BUSH_WHACKED:         'BUSH_WHACKED',
    PLAYER_HOSPITALIZED:  'PLAYER_HOSPITALIZED',
    SHOP_OPEN:            'SHOP_OPEN',
    SHOP_PURCHASE:        'SHOP_PURCHASE',
    SHOP_CLOSE:           'SHOP_CLOSE',
    STREAK_BONUS:         'STREAK_BONUS',
} as const);
```

### Extending InputBus with Action.WHACK
```typescript
// Source: src/input/InputBus.ts (verified codebase read)

export enum Action {
    MOVE_UP    = 'MOVE_UP',
    MOVE_DOWN  = 'MOVE_DOWN',
    MOVE_LEFT  = 'MOVE_LEFT',
    MOVE_RIGHT = 'MOVE_RIGHT',
    INTERACT   = 'INTERACT',
    PAUSE      = 'PAUSE',
    WHACK      = 'WHACK',   // Phase 3 addition
}

// WHACK is fired via setAction(Action.WHACK, true/false) from:
// - on-screen newspaper button pointerdown/pointerup
// - keyboard key 'J' or Space (when no NPC in range)
// It is NOT a held action — it is pulsed (true then false on the same frame or
// set false after cooldown). Player.update() reads it once per press.
```

### Deterministic PrizePack Module (pure TS — unit-testable)
```typescript
// Source: ALttP prize-pack design (zelda-mystic-quest-patterns.md §2, verified design doc read)
// Implementation pattern: pure TS class, no Phaser dependency

export interface PrizePackState {
    slotIndex: number;   // 0..7, wraps after 8
}

export type DropResult = {
    coins: number;
    item: 'snack' | null;
};

// Locked design decision (D-05): these slots and the 55% chance are the starting tune.
const PACK_SLOTS: DropResult[] = [
    { coins: 1, item: null },
    { coins: 0, item: null },   // "nothing" slot
    { coins: 1, item: null },
    { coins: 3, item: null },
    { coins: 1, item: null },
    { coins: 0, item: 'snack' },
    { coins: 1, item: null },
    { coins: 5, item: null },
];
const DROP_CHANCE = 0.55;

export function rollPrizePack(state: PrizePackState, rng: () => number = Math.random): DropResult | null {
    const slot = PACK_SLOTS[state.slotIndex % 8];
    state.slotIndex = (state.slotIndex + 1) % 8;   // advance deterministically
    if (rng() > DROP_CHANCE) return null;           // 45% chance: no drop this whack
    return slot;
}

// First-whack override (D-06): caller checks flags['first_whack_done']
// If not set: force { coins: 1, item: null } regardless of roll.
// Set flags['first_whack_done'] = true after the forced drop.
```

### HUD COINS_CHANGED Wiring (closes D-08 gap)
```typescript
// Source: src/ui/HUD.ts + src/game/scenes/UIScene.ts (verified codebase reads)
// In UIScene.create() — add alongside existing PATIENCE_BONUS listener:

private onCoinsChanged = (n: number): void => {
    this.hud.setCoins(n);
};

// In UIScene.create():
GameEvents.on(Events.COINS_CHANGED, this.onCoinsChanged, this);

// In UIScene.shutdown() — match the on():
GameEvents.off(Events.COINS_CHANGED, this.onCoinsChanged, this);

// In OverworldScene (every time coins change):
this.coins += earned;
GameEvents.emit(Events.COINS_CHANGED, this.coins);
```

### flashCoinPickup in HUD (reuses flashPatienceBonus pattern)
```typescript
// Source: src/ui/HUD.ts flashPatienceBonus() method (verified codebase read)
// Add to HUD.ts alongside the existing method:

flashCoinPickup(amount: number): void {
    if (amount <= 0) return;
    const pickupText = this.scene.add.text(240, 200,
        `+${amount}`,
        {
            fontSize: '8px',
            color: '#f5c842',   // coin-gold color
            fontFamily: '"Press Start 2P", monospace',
        }
    ).setOrigin(0.5).setDepth(25);

    this.scene.tweens.add({
        targets: pickupText,
        y: 160,
        alpha: 0,
        duration: 700,
        onComplete: () => pickupText.destroy(),
    });
}
```

### UIScene SHOP State — Event Flow
```typescript
// Source: UIScene.ts event handler pattern (verified codebase read)
// Coins are passed in the SHOP_OPEN payload so the shop panel renders correctly
// without UIScene needing to store coin state.

// In OverworldScene:
private openShop(): void {
    this.inHandoff = true;   // block player movement
    GameEvents.emit(Events.SHOP_OPEN, {
        coins: this.coins,
        flags: { ...this.flags },  // which items are already owned
    });
}

// In UIScene:
private onShopOpen = (data: { coins: number; flags: Record<string, boolean> }): void => {
    this.setState('SHOP');
    if (this.scene.get('OverworldScene')?.scene.isActive()) {
        this.scene.pause('OverworldScene');
    }
    this.shopOverlay.show(data.coins, data.flags);
};

// Purchase tap in ShopOverlay:
onItemTap(itemId: string, price: number): void {
    GameEvents.emit(Events.SHOP_PURCHASE, { itemId, price });
}

// OverworldScene handles SHOP_PURCHASE:
private onShopPurchase = (data: { itemId: string; price: number }): void => {
    if (this.coins < data.price) return;              // validation
    if (data.itemId !== 'snack' && this.flags[data.itemId]) return;  // already owned
    this.coins -= data.price;
    if (data.itemId !== 'snack') this.flags[data.itemId] = true;
    if (data.itemId === 'upgrade_traversal') this.removeGate();
    GameEvents.emit(Events.COINS_CHANGED, this.coins);
    GameEvents.emit(Events.SHOP_OPEN, { coins: this.coins, flags: { ...this.flags } }); // refresh panel
    void SaveService.save(this.buildSaveState());
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phaser 3 particles (legacy API) | Phaser 4 new particles API (`this.add.particles()` with ParticleEmitter config) | Phaser 4.1.0 (April 2026) | Burst emitter for bush clear uses new API — different from Phaser 3 examples online |
| HUD coin counter shows 0 (unwired) | Wire via COINS_CHANGED event (D-08) | Phase 3 (this phase) | The snowball HUD criterion requires this gap be closed in Wave 1 |
| Dog is a patience reward only | Dog is both patience reward AND contact hazard | Phase 3 (this phase) | Both behaviors coexist per D-09; the patience-gap window (dogGapActive) still awards coins |

**Deprecated/outdated:**
- Phaser 3 particles API (`this.add.particles(x, y, key, config)` old form): Use Phaser 4 `this.add.particles(x, y, textureKey, { ... })` form — the constructor signature changed. [ASSUMED — Phaser 4.1.0 changelog; verify against Phaser 4 docs if particles don't fire]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | StaticBody enable/disable (`body.enable = false`) is the correct pattern for the hitbox toggle in Phaser 4 | Architecture Patterns §1 | If Phaser 4 removed `enable` or changed the API, hitbox will always fire. Verify: `(sprite.body as Phaser.Physics.Arcade.StaticBody).enable` in Phaser 4.1.0 source. |
| A2 | `physics.add.existing(rect, true)` correctly adds a StaticBody to a GameObject.Rectangle | Architecture Patterns §5 | If Phaser 4 requires a Sprite not Rectangle for static bodies, the gate barrier approach needs adjustment. Fallback: use `physics.add.staticSprite()` with alpha 0. |
| A3 | `body.moves = false` prevents Arcade physics from overriding tween position during knockback | Common Pitfalls §1 | If the Phaser 4 API for this changed, knockback tween will fight physics. Fallback: `body.setImmovable(true)` during tween. |
| A4 | Phaser 4 `this.add.particles()` signature accepts `(x, y, textureKey, config)` | State of the Art | If the particles API signature differs, bush-clear particles will throw. Check Phaser 4.1.0 ParticleEmitter docs before implementing. |
| A5 | `sprite.setData('bushId', id)` / `getData('bushId')` is available on Phaser 4 GameObjects | Pattern 2 | Standard Phaser data manager — extremely likely but not re-verified against Phaser 4 source this session. |
| A6 | The whack button at (360, 750) does not conflict with the existing VirtualJoystick at (120, 750) on the actual 480px canvas | Common Pitfalls §6 | If the 480px canvas is scaled down on very small phones, thumb zones may still overlap. Verify on the dev server. |

---

## Open Questions

1. **Phaser 4 new particles API exact signature**
   - What we know: Phaser 4 revamped the particles system; the Phaser 3 API is documented everywhere online but Phaser 4 differs.
   - What's unclear: Exact constructor call for a one-shot burst emitter in Phaser 4.1.0.
   - Recommendation: During Wave 1 execution, check `phaser@4.1.0/src/gameobjects/particles/` or the Phaser 4 changelog. If particles are blocked, a simple alpha-tween on a few small sprites is an acceptable MVP fallback (zero new assets needed).

2. **StoreClerk shop entry vs. DIALOGUE conflict**
   - What we know: `handleInteract()` currently fires `DIALOGUE_START` for the storeClerk NPC (line 354 of OverworldScene.ts). D-13 says the shop opens via the storeClerk.
   - What's unclear: Should the storeClerk's first dialogue line lead into the shop (tapping advance → open shop), or should `handleInteract()` detect `npcId === 'storeClerk'` and bypass dialogue entirely?
   - Recommendation: The safest MVP path is to add a clerk intro dialogue line ("COME IN, COME IN! WHAT CAN I DO FOR YOU?") and emit `SHOP_OPEN` on `DIALOGUE_COMPLETE` when `lastNpcId === 'storeClerk'`. This reuses the entire existing dialogue pipeline with no structural change to `handleInteract()`.

3. **Exact tile indices for gate barrier in DECO_DATA**
   - What we know: The east path (cols 20–29, rows 7–8, pixel ~320–464, 112–128) is a candidate gate location (D-16). DECO_DATA rows 7–8 currently contain: row 7: `[-1,-1,-1,-1,4,-1,...]`, row 8: `[-1,-1,-1,-1,-1,-1,...]` — some open space.
   - What's unclear: The exact fence/chain tile index in the Kenney Tiny Town tileset to use as the visual barrier.
   - Recommendation: For MVP, the gate barrier can be an invisible static body (no art) with a simple text sign ("ROAD CLOSED — BUS PASS REQUIRED"). Art can be added in Phase 2.1 follow-up or Phase 5.

---

## Environment Availability

This phase is entirely code/config/asset changes — no new external tools, services, or CLIs required beyond what already exists.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Phaser 4.1.0 | All mechanics | Yes | 4.1.0 | — |
| vitest | Unit tests | Yes | ^2.0.0 | — |
| Vite dev server | Development | Yes | ^6.3.1 | — |
| Node.js | Build/test | Yes | (project in use) | — |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** none

---

## Validation Architecture

> `workflow.nyquist_validation: true` in `.planning/config.json` — this section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.0.0 |
| Config file | `vitest.config.ts` (verified — exists, environment: 'node') |
| Quick run command | `npm test` (runs `vitest run`) |
| Full suite command | `npm test` |
| Test directory | `tests/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| L1E-01 (D-01) | Action.WHACK is registered in InputBus; setAction(WHACK, true) makes isActive(WHACK) true | unit | `npm test -- --reporter verbose tests/input-bus.test.ts` | Partial — extend existing input-bus.test.ts |
| L1E-01 (D-02) | Hitbox offset is correct for all 4 facing directions | unit | `npm test -- tests/prize-pack.test.ts` | No — Wave 0 gap |
| L1E-01 (D-04) | newspaper_swing overlay does not modify player_sheet frames | static proof | Read Preloader.ts — 0 new anims added to player_sheet | Manual check |
| L1E-02 (D-05) | rollPrizePack() advances slot deterministically 0→7→0, returns correct drop | unit | `npm test -- tests/prize-pack.test.ts` | No — Wave 0 gap |
| L1E-02 (D-05) | Over 8 sequential rolls, coins total matches expected sum from slot table | unit | `npm test -- tests/prize-pack.test.ts` | No — Wave 0 gap |
| L1E-02 (D-06) | First-whack override: if first_whack_done flag absent, returns 1 coin regardless of rng | unit | `npm test -- tests/prize-pack.test.ts` | No — Wave 0 gap |
| L1E-02 (D-07) | Streak resets to 0 when dog bite fires (PLAYER_HOSPITALIZED emitted) | integration (manual) | Run dev server, get bitten, observe streak counter reset | Manual |
| L1E-02 (D-08) | COINS_CHANGED event is emitted whenever OverworldScene.coins changes | unit/static proof | `npm test -- tests/coins-hud.test.ts` | No — Wave 0 gap |
| L1E-03 (D-09) | Dog bite does NOT fire when player.isInvincible is true | unit | `npm test -- tests/dog-hazard.test.ts` | No — Wave 0 gap |
| L1E-03 (D-11) | Hospital coin fee is floored at 0 (never goes negative) | unit | `npm test -- tests/dog-hazard.test.ts` | No — Wave 0 gap |
| L1E-03 (D-12) | Hospital fee is 0 when upgrade_helmet flag is true | unit | `npm test -- tests/dog-hazard.test.ts` | No — Wave 0 gap |
| L1E-04 (D-13) | SHOP_PURCHASE is rejected when this.coins < price | unit | `npm test -- tests/shop-economy.test.ts` | No — Wave 0 gap |
| L1E-04 (D-15) | Permanent upgrade flags persist through save() and load() | unit | extend tests/save-service.test.ts | Partial — extend existing |
| L1E-04 (D-16) | Gate barrier is removed when upgrade_traversal flag is set | integration (manual) | Run dev server, purchase Bus Pass, verify gate opens | Manual |
| INFR-04 | Bush positions, prize-pack table, shop items live in level-01-economy.ts data manifest | static proof | Grep for bush/shop data not in a scene file | Automated grep |
| INFR-05 | All new player-facing strings use t() — no hardcoded literals | static proof | `grep -rn '"HOSPITAL"\|"SHOP"\|"OWNED"' src/` | Automated grep |
| SAVE-02 | SaveService has no new fetch or supabase calls | static proof | Existing test tests/save-service.test.ts SAVE-02 section | Existing test |

### Deterministic Test Seams (critical for Nyquist)

The following are the testable pure functions — written with no Phaser dependency so vitest `node` environment covers them:

1. **`PrizePack.rollPrizePack(state, rng)`** — inject deterministic `rng: () => number` to test:
   - Slot advancement (0→1→...→7→0)
   - Exact coin values per slot
   - First-whack-done override logic
   - Drop chance threshold (rng returns 0.54 → drops; rng returns 0.56 → no drop)

2. **Economy math** — coin delta calculations in OverworldScene can be extracted to a pure function `applyPurchase(coins, price, flags, itemId)` returning `{newCoins, newFlags}` — fully unit-testable without Phaser.

3. **Knockback direction** — the `applyKnockback(fromX, fromY)` angle computation (Math.atan2) can be tested in isolation.

4. **Hospital fee logic** — `computeHospitalFee(coins, flags)` pure function: returns 0 if `flags['upgrade_helmet']`, else min(5, coins).

### Sampling Rate

- **Per task commit:** `npm test` (full suite, all tests, ~5s in node environment)
- **Per wave merge:** `npm test` + manual dev-server smoke of the specific wave behavior
- **Phase gate:** Full suite green + manual end-to-end smoke: "whack a bush → coin → HUD increments → save → refresh → coins preserved → buy upgrade → gate opens" before `/gsd-verify-work`

### Wave 0 Gaps (files that don't exist yet, needed before implementation)

- [ ] `tests/prize-pack.test.ts` — covers L1E-02 (D-05, D-06, D-07): deterministic slots, first-whack guarantee, streak counter reset
- [ ] `tests/dog-hazard.test.ts` — covers L1E-03 (D-09, D-11, D-12): i-frame gate, coin floor, helmet waiver
- [ ] `tests/shop-economy.test.ts` — covers L1E-04 (D-13, D-15): purchase validation, flag persistence, snack no-persist
- [ ] `tests/coins-hud.test.ts` — covers L1E-02 (D-08): COINS_CHANGED is emitted; value matches this.coins

These 4 test files are **Wave 0 deliverables** (write before implementing the feature, consistent with the vitest pattern used in prior phases). Each file uses the existing node environment pattern (`vi.resetModules()` + no Phaser import). The pure-TS seams (PrizePack module, economy math functions) must be designed to be importable from the test file without any Phaser Scene context.

---

## Project Constraints (from CLAUDE.md)

| Directive | Applies to Phase 3 |
|-----------|-------------------|
| Phaser 4.1.0 is the game engine — no version change | No engine changes; all patterns use Phaser 4.1.0 APIs |
| `antialias: false, pixelArt: true` in Phaser config (set at boot) | No Phaser config changes in this phase |
| `image-rendering: pixelated` on canvas via CSS | No CSS changes in this phase |
| All player-facing strings wrapped in `t(key)` | All new shop/hospital/whack strings go through `t()` + `common.json` / `level-01.json` |
| Levels defined as data manifests (ContentRegistry) | New economy data goes in `level-01-economy.ts`, registered or co-located with level-01 |
| Budget: 0€ recurring — free tiers only | No new paid tools; no new npm packages |
| Mobile-first: phone touchscreens primary | Whack button ≥44px at (360, 750) — opposite thumb from joystick |
| Offline/local save (SAVE-02) | All upgrade persistence via idb-keyval SaveState.flags; zero backend calls |
| PRs in draft mode (`gh pr create --draft`) | Required when committing for review |
| `phaser4-rex-plugins` package name (not phaser3) | Package already installed and in use; no new rex imports in this phase |

---

## Sources

### Primary (HIGH confidence — verified codebase reads this session)
- `src/game/scenes/OverworldScene.ts` — verified hub architecture, dog patrol constants, coin state, NPC placement, TriggerSystem wiring
- `src/entities/Player.ts` — verified movement-only state, facing property, 8-frame sheet constraint
- `src/input/InputBus.ts` — verified Action enum, setAction() pattern, update() call site
- `src/ui/HUD.ts` — verified setCoins(), flashPatienceBonus() pattern (D-08 gap confirmed: setCoins() is never called from OverworldScene)
- `src/game/scenes/UIScene.ts` — verified 4-state machine, setState() pattern, shutdown() event cleanup pattern, pause/resume on DIALOGUE
- `src/events/GameEvents.ts` — verified frozen-constants pattern, EventEmitter singleton
- `src/services/SaveService.ts` — verified SaveState.flags generic bag, no migration needed for flags
- `src/systems/TriggerSystem.ts` — verified rectangle zone overlap pattern (reused for gate zone)
- `src/data/levels/level-01.ts` — verified DECO_DATA, NPC coords, east path rows 7–8 cols 20–29
- `src/services/ContentRegistry.ts` — verified LevelManifest type, register() pattern
- `src/game/scenes/Preloader.ts` — verified asset pipeline: image + spritesheet + anims registration
- `src/services/AudioService.ts` — verified toggle semantics (sfx gate pattern for new SFX calls)
- `src/services/i18n.ts` + `public/locales/en/common.json` — verified t() lookup pattern, existing string keys
- `src/data/dialogue/en/level-01.json` — verified dialogue JSON shape
- `vitest.config.ts` — verified node environment, tests/ include pattern
- `tests/input-bus.test.ts` — verified vi.resetModules() pattern for plain-TS module tests
- `tests/save-service.test.ts` — verified fake-indexeddb pattern, flag persistence test structure
- `package.json` — verified installed package versions
- `.planning/research/zelda-mystic-quest-patterns.md` — verified ALttP prize-pack slot table, Zelda-1 streak pattern, dog hazard design
- `.planning/phases/03-level-1-the-newspaper-verb-economy/03-CONTEXT.md` — verified all 20 locked decisions

### Secondary (MEDIUM confidence — design docs)
- `.planning/research/level-1-redesign-ideas.md` — user direction, locked overall scope
- `.planning/REQUIREMENTS.md` — requirement IDs and success criteria

### Tertiary (LOW confidence — [ASSUMED] claims in research)
- Phaser 4 StaticBody `.enable` toggle API — standard Phaser pattern, not re-verified against Phaser 4.1.0 source this session
- Phaser 4 `body.moves = false` for tween + physics coexistence — standard pattern, assumed stable across Phaser 3→4
- Phaser 4 new particles API constructor signature — known to have changed; verify against Phaser 4.1.0 source before implementing

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all existing installs verified via package.json
- Architecture: HIGH — derived directly from verified codebase reads; patterns mirror existing code
- Phaser 4 API specifics (hitbox, particles): MEDIUM — standard patterns assumed stable; verify during Wave 1
- Pitfalls: HIGH — derived from codebase (e.g., CR-03 shutdown pattern, inDialogue guard pattern)
- Tuning numbers: LOW — all tuning values are locked design decisions from CONTEXT.md to be adjusted by playtest

**Research date:** 2026-06-15
**Valid until:** 2026-07-15 (stable stack, 30-day window; Phaser 4 is actively maintained so patch releases possible but API-stable)
