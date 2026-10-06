---
created: 2026-10-06T15:30:00.000Z
title: Fix offset hit areas on the whack button, pause button and pause menu
area: gameplay
files: [src/game/scenes/UIScene.ts, src/ui/HUD.ts, src/game/scenes/OverworldScene.ts]
---

## Problem

Same root cause as the menu tap fix (commit ab9cbe1, `paddedHitArea`): Phaser hit areas live in the object's LOCAL top-left space, but these are built origin-relative, so each zone is shifted up-left by half its size:

- `UIScene.ts:276` whack button `(-32, -32, 64, 64)` — the right/bottom third of the core touch verb is dead on phones (missed whacks).
- `HUD.ts:70` pause button `(-22, -22, 44, 44)` — right/bottom edge partly dead.
- `UIScene.ts:356/370/384/410` pause-menu items `(-160, -22, 320, 44)` — zone extends left/up instead of centred (labels still hit, but taps right of or below a label miss).
- `OverworldScene.ts:300` set-piece markers `(-16, -16, 32, 32)` — covers the 16-px sprite but skewed up-left.

## Solution

Reuse the centred-bounds pattern from `MainMenu.ts` (`paddedHitArea`; move it to a shared `src/ui/hitArea.ts` helper that also handles Images), apply to the four files, and extend `smoke-taps.mjs` to tap the whack button's right/bottom edge in the overworld. Run via `/gsd-quick` (4 files — over the `/gsd-fast` limit).
