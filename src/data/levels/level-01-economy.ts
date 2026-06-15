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

// Bush placement: 12 regular bushes + 2 special milestone bushes.
// Verified against DECO_DATA: all coords are on -1 (empty) cells.
// Pixel formula: tile_col * 16 + 8, tile_row * 16 + 8 (centers on 16px cells).
//
// Cluster A (south-west open area, rows 9-12, cols 0-3 and 6-10): safe open grass
// Cluster B (east open area south of east path, rows 10-12, cols 22-29): safe open grass
// Milestone bushes: placed at row 10,col 7 and row 11,col 25 — both -1 in DECO_DATA
export const ECONOMY_DATA: EconomyData = {
    bushes: [
        // Cluster A — start area near grandpa (player learns the verb early — D-01)
        { id: 'bush_01', x: 24,  y: 152, special: false }, // tile col 1, row 9 — -1
        { id: 'bush_02', x: 40,  y: 152, special: false }, // tile col 2, row 9 — -1
        { id: 'bush_03', x: 72,  y: 152, special: false }, // tile col 4, row 9 — -1 (row 9 not in dog gap)
        { id: 'bush_04', x: 24,  y: 168, special: false }, // tile col 1, row 10 — -1
        { id: 'bush_05', x: 56,  y: 168, special: false }, // tile col 3, row 10 — -1
        { id: 'bush_06', x: 120, y: 168, special: true  }, // tile col 7, row 10 — -1, SPECIAL (milestone 1)
        { id: 'bush_07', x: 24,  y: 184, special: false }, // tile col 1, row 11 — -1
        { id: 'bush_08', x: 40,  y: 184, special: false }, // tile col 2, row 11 — -1
        { id: 'bush_09', x: 72,  y: 184, special: false }, // tile col 4, row 11 — -1
        // Cluster B — east open area (incentivises exploration before traversal gate)
        { id: 'bush_10', x: 360, y: 152, special: false }, // tile col 22, row 9 — -1
        { id: 'bush_11', x: 392, y: 152, special: false }, // tile col 24, row 9 — -1
        { id: 'bush_12', x: 360, y: 168, special: false }, // tile col 22, row 10 — -1
        { id: 'bush_13', x: 408, y: 168, special: false }, // tile col 25, row 10 — -1
        { id: 'bush_14', x: 408, y: 184, special: true  }, // tile col 25, row 11 — -1, SPECIAL (milestone 2)
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

    // East-path gate: cols 20-29 rows 7-8 → pixel x=320, y=112 (16px tiles)
    // Candidate from RESEARCH / CONTEXT D-16 — blocks the east corridor until traversal upgrade
    gateBarrier: { x: 320, y: 112, w: 144, h: 32 },

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
