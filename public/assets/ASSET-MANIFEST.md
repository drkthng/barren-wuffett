# Asset Manifest — Barren Wuffett

Provenance and license tracking for all shipped game assets.
Every asset in this table is CC0 or commercially-licensed with verified provenance.
No [ASSUMED] license entries — all verified before commit.

| Asset Key | File | Format/Size | Source | License | Provenance | ART Req |
|-----------|------|-------------|--------|---------|------------|---------|
| tiny_town_tiles | tilesets/tiny_town_tiles.png | PNG, 192×176px, 12×11 tiles @ 16px, 5 KB | kenney.nl/assets/tiny-town (Tiny Town v1.1) | CC0 1.0 Universal — see .planning/spikes/001-cozy-art-pipeline/assets/tiny-town/License.txt | Spike 001 downloaded 2026-06-14; packed sheet (0 margin, 0 spacing); license confirmed from License.txt | ART-01 |
| player_sheet | images/player.png | PNG, 128×16px spritesheet (8 frames @ 16×16), 511 bytes | Original pixel art created in-house (PowerShell System.Drawing), palette-locked to Kenney Tiny Town warm tones (#6abe30, #71c442, #ffe478, #b86f50) | Our own work — no third-party license required (treat as CC0 / project-owned). No real likenesses. | Generated 2026-06-14; frames 0-1=down-walk, 2-3=up-walk, 4-5=left-walk, 6-7=right-walk | ART-02 |
| npc_grandpa | images/npc_grandpa.png | PNG, 16×16px, 221 bytes | Original pixel art created in-house (PowerShell System.Drawing), palette-locked to Kenney Tiny Town warm tones | Our own work — no third-party license required (treat as CC0 / project-owned). No real likenesses. | Generated 2026-06-14; distinct elderly-character sprite, palette-matched | ART-02 |
| npc_store_clerk | images/npc_store_clerk.png | PNG, 16×16px, 226 bytes | Original pixel art created in-house (PowerShell System.Drawing), palette-locked to Kenney Tiny Town warm tones | Our own work — no third-party license required (treat as CC0 / project-owned). No real likenesses. | Generated 2026-06-14; distinct clerk-character sprite, palette-matched | ART-02 |
| npc_rival | images/npc_rival.png | PNG, 16×16px, 243 bytes | Original pixel art created in-house (PowerShell System.Drawing), palette-locked to Kenney Tiny Town warm tones | Our own work — no third-party license required (treat as CC0 / project-owned). No real likenesses. | Generated 2026-06-14; distinct rival-character sprite, palette-matched | ART-02 |
| dog | images/dog.png | PNG, 32×16px, 263 bytes | Original pixel art created in-house (PowerShell System.Drawing), palette-locked to Kenney Tiny Town warm tones | Our own work — no third-party license required (treat as CC0 / project-owned). No real likenesses. | Generated 2026-06-14; side-view dog sprite, renders at setDisplaySize(32,16) | ART-02 |
| boss_mr_market_greed | images/boss_mr_market_greed.png | PNG, 32×48px, 399 bytes | Original pixel art created in-house (PowerShell System.Drawing), palette-locked to Kenney Tiny Town warm tones | Our own work — no third-party license required (treat as CC0 / project-owned). Mr. Market is a parody archetype — not a real person (LEGL-02). | Generated 2026-06-14; greed pose (confident/arms-wide); renders at setDisplaySize(64,96) | ART-02 |
| boss_mr_market_panic | images/boss_mr_market_panic.png | PNG, 32×48px, 392 bytes | Original pixel art created in-house (PowerShell System.Drawing), palette-locked to Kenney Tiny Town warm tones | Our own work — no third-party license required (treat as CC0 / project-owned). Mr. Market is a parody archetype — not a real person (LEGL-02). | Generated 2026-06-14; panic pose (hands-up/distressed); swapped via setTexture on greed→panic transition | ART-02 |

---

**Verified:** 2026-06-14  
**License gate:** Task 1 human-verify completed — user chose in-house generation.  
**Palette:** #6abe30, #71c442, #ffe478, #b86f50 (Kenney Tiny Town warm tones)  
**No LPC sprites** — GPL propagation risk eliminated; all character art is original project-owned work.
