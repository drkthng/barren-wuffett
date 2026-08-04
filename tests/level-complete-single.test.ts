/**
 * Phase 3.1 (FEEL-05): level-complete shows exactly once — source invariants.
 *
 * Root cause guarded here: BossScene emitted BOSS_DEFEATED, UIScene showed the
 * level-complete screen, then OverworldScene RE-EMITTED BOSS_DEFEATED after
 * waking — stacking a second overlay (two typewriters, duplicate buttons) over
 * an overworld that was never paused.
 *
 * Follows the repo's source-assertion pattern (see save-service "no supabase"
 * proof and share-service anti-pattern assertions): these are wiring invariants
 * that a full Phaser scene harness would be disproportionate to test.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// NOTE: source-only assertions — GameEvents imports Phaser, which needs a DOM,
// so the constant is checked in the source text rather than via import.
const eventsSrc    = readFileSync(resolve(__dirname, '../src/events/GameEvents.ts'), 'utf8');
const overworldSrc = readFileSync(resolve(__dirname, '../src/game/scenes/OverworldScene.ts'), 'utf8');
const uiSrc        = readFileSync(resolve(__dirname, '../src/game/scenes/UIScene.ts'), 'utf8');

describe('FEEL-05: level-complete fires exactly once', () => {

    it('LEVEL_COMPLETE_SHOW event constant exists', () => {
        expect(eventsSrc).toMatch(/LEVEL_COMPLETE_SHOW:\s*'LEVEL_COMPLETE_SHOW'/);
    });

    it('OverworldScene never re-emits BOSS_DEFEATED (the double-overlay bug)', () => {
        expect(overworldSrc).not.toMatch(/GameEvents\.emit\(\s*Events\.BOSS_DEFEATED/);
    });

    it('OverworldScene emits LEVEL_COMPLETE_SHOW after the boss handoff', () => {
        expect(overworldSrc).toMatch(/GameEvents\.emit\(\s*Events\.LEVEL_COMPLETE_SHOW/);
    });

    it('UIScene listens for LEVEL_COMPLETE_SHOW, not raw BOSS_DEFEATED', () => {
        expect(uiSrc).toMatch(/GameEvents\.on\(\s*Events\.LEVEL_COMPLETE_SHOW/);
        expect(uiSrc).not.toMatch(/GameEvents\.on\(\s*Events\.BOSS_DEFEATED/);
    });

    it('UIScene pauses the overworld under the level-complete overlay', () => {
        const handler = uiSrc.slice(uiSrc.indexOf('onLevelCompleteShow'));
        expect(handler).toMatch(/pause\('OverworldScene'\)/);
    });

});
