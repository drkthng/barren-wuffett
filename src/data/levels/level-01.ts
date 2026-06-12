/**
 * Level 1 — "The Paper Route" (1936, Young Barren in Omaha)
 *
 * MAP_DATA: 15-col × 26-row array at 32px tiles = 480×832px
 *   tile 0 = ground (walkable)
 *   tile 1 = wall (solid, collision index 1)
 *   tile 2 = decoration (non-colliding)
 *
 * LEVEL_01_MANIFEST: registered into ContentRegistry at module load time
 * so that any scene importing this module gets the manifest auto-registered.
 *
 * Pattern: PATTERNS.md level-01.ts + ContentRegistry
 */
import type { LevelManifest } from '../../services/ContentRegistry';
import { ContentRegistry }   from '../../services/ContentRegistry';

// 15 cols × 26 rows — portrait 480px / 32px = 15 tiles wide
// Border walls of 1, open interior of 0, a few 2 decorations
export const MAP_DATA: number[][] = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,2,2,0,0,0,0,0,0,0,2,2,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,1,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,1,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,2,0,0,0,0,0,0,0,0,0,2,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,0,1,1,1,0,0,0,1,1,1,0,1,1], // dog patrol row — gap in cols 2 and 6-8
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,2,0,0,0,0,0,0,0,0,0,2,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,1,0,0,1,1,0,0,0,1],
    [1,0,0,0,0,1,1,0,0,1,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,2,2,0,0,0,0,0,0,0,2,2,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const LEVEL_01_MANIFEST: LevelManifest = {
    id:         'level-01',
    titleKey:   'level.01.title',
    tilemapKey: 'omaha_tiles',
    bgmKey:     'bgm_overworld',
    enemies:    [],
    triggers: [
        { zone: 'minigame_trigger', action: 'launch', target: 'PaperThrowScene' },
        { zone: 'boss_trigger',     action: 'launch', target: 'BossScene' },
    ],
    journalUnlock: 'journal_01_patience',
};

// Register at module load time — any import of this file auto-registers
ContentRegistry.register(LEVEL_01_MANIFEST);

export { LEVEL_01_MANIFEST };
