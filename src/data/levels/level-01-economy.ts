/**
 * level-01-economy.ts — Level 1 economy content (Phase 3, L1E-02)
 *
 * Exports the ECONOMY_DATA object consumed directly by OverworldScene.
 * This file is the INFR-04 / D-17 content seam: content-agnostic systems + level-data content.
 * No economy content lives in any *Scene.ts file.
 *
 * Placement notes (all coords are world pixel coords):
 *   - 16px tiles: pixel = tile_col * 16, pixel_y = tile_row * 16
 *   - NPC clear zones (avoid): grandpa(96,96), storeClerk(352,160), rival(224,320)
 *   - Dog corridor clear zone (avoid): DECO rows 13-20 cols 4-5 and 12-17
 *   - Boss zone (avoid): ~(224,720) ±48px
 *   - All bushes placed on DECO_DATA -1 cells (empty/transparent)
 *
 * Pattern: PATTERNS.md level-01-economy.ts (analog: level-01.ts manifest shape)
 */
import type { DropResult } from '../../systems/PrizePack';

export interface ShopItem {
    itemId: string;       // e.g. 'upgrade_newspaper'
    nameKey: string;      // i18n key
    descKey: string;      // i18n key
    iconKey: string;      // Phaser texture key
    price: number;
    consumable: boolean;
}

export interface BushDef {
    id: string;
    x: number;      // world pixel X (center of bush sprite)
    y: number;      // world pixel Y (center of bush sprite)
    special: boolean; // true = milestone bush (streak bonus / journal page — Slice 2)
}

export interface EconomyData {
    bushes: BushDef[];
    shopItems: ShopItem[];
    gateBarrier: { x: number; y: number; w: number; h: number };
    prizePackSlots: DropResult[];
}

// Bush placement: 15 regular bushes + 2 special milestone bushes.
// Phase 3.1 (FEEL-05): every coordinate re-verified against DECO_DATA -1 cells —
// the original set had 8 of 14 bushes buried inside collidable deco tiles.
// Pixel formula: tile_col * 16 + 8, tile_row * 16 + 8 (centers on 16px cells).
// Regression guard: tests/bush-placement.test.ts cross-references this list.
//
// Cluster S (spawn, rows 6-8, cols 8-10): first bushes the player sees (FEEL onboarding —
//   "safe practice target right outside the house", zelda-mystic-quest-patterns §1)
// Cluster A (south-west open area, rows 9-11, cols 0-4 and 7)
// Cluster B (east open area around the shop, rows 7-11, cols 18-24)
export const ECONOMY_DATA: EconomyData = {
    bushes: [
        // Cluster S — right outside the spawn house (first-whack guarantee lands here)
        { id: 'bush_15', x: 136, y: 104, special: false }, // tile col 8,  row 6 — -1
        { id: 'bush_16', x: 152, y: 136, special: false }, // tile col 9,  row 8 — -1
        { id: 'bush_17', x: 168, y: 120, special: false }, // tile col 10, row 7 — -1
        // Cluster A — start area near grandpa (player learns the verb early — D-01)
        { id: 'bush_01', x: 24,  y: 152, special: false }, // tile col 1, row 9 — -1
        { id: 'bush_02', x: 40,  y: 152, special: false }, // tile col 2, row 9 — -1
        { id: 'bush_03', x: 72,  y: 152, special: false }, // tile col 4, row 9 — -1 (row 9 not in dog gap)
        { id: 'bush_04', x: 8,   y: 168, special: false }, // tile col 0, row 10 — -1
        { id: 'bush_05', x: 72,  y: 168, special: false }, // tile col 4, row 10 — -1
        { id: 'bush_06', x: 120, y: 168, special: true  }, // tile col 7, row 10 — -1, SPECIAL (milestone 1)
        { id: 'bush_07', x: 8,   y: 184, special: false }, // tile col 0, row 11 — -1
        { id: 'bush_08', x: 56,  y: 184, special: false }, // tile col 3, row 11 — -1
        { id: 'bush_09', x: 72,  y: 184, special: false }, // tile col 4, row 11 — -1
        // Cluster B — east open area (incentivises exploration before traversal gate)
        { id: 'bush_10', x: 312, y: 120, special: false }, // tile col 19, row 7 — -1
        { id: 'bush_11', x: 392, y: 168, special: false }, // tile col 24, row 10 — -1
        { id: 'bush_12', x: 376, y: 168, special: false }, // tile col 23, row 10 — -1
        { id: 'bush_13', x: 296, y: 136, special: false }, // tile col 18, row 8 — -1
        { id: 'bush_14', x: 392, y: 184, special: true  }, // tile col 24, row 11 — -1, SPECIAL (milestone 2)
    ],

    shopItems: [
        {
            itemId: 'upgrade_newspaper',
            nameKey: 'shop.item.sunday_edition.name',
            descKey:  'shop.item.sunday_edition.desc',
            iconKey:  'item_newspaper_upgrade',
            price: 20,
            consumable: false,
        },
        {
            itemId: 'upgrade_helmet',
            nameKey: 'shop.item.bike_helmet.name',
            descKey:  'shop.item.bike_helmet.desc',
            iconKey:  'item_helmet',
            price: 35,
            consumable: false,
        },
        {
            itemId: 'upgrade_traversal',
            nameKey: 'shop.item.bus_pass.name',
            descKey:  'shop.item.bus_pass.desc',
            iconKey:  'item_bus_pass',
            price: 60,
            consumable: false,
        },
        {
            itemId: 'snack',
            nameKey: 'shop.item.snack.name',
            descKey:  'shop.item.snack.desc',
            iconKey:  'item_snack',
            price: 5,
            consumable: true,
        },
    ],

    // East-pocket gate (Phase 3.1 FEEL-05): a 1×2-tile vertical gate at col 20,
    // rows 6-7 (center 328,112). The reward pocket (rows 5-8, cols 21-29) is now
    // fully fenced in DECO_DATA (col-20 wall, row-4 north edge, row-9 south edge)
    // so this gate is the ONLY way in — previously the barrier floated in open
    // grass and could be walked around on either side.
    gateBarrier: { x: 328, y: 112, w: 16, h: 32 },

    // ALttP 8-slot deterministic prize-pack (D-05 — verbatim)
    prizePackSlots: [
        { coins: 1, item: null },
        { coins: 0, item: null },   // nothing
        { coins: 1, item: null },
        { coins: 3, item: null },
        { coins: 1, item: null },
        { coins: 0, item: 'snack' },
        { coins: 1, item: null },
        { coins: 5, item: null },
    ],
};
