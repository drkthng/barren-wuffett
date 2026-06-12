/**
 * ContentRegistry — level data manifests
 *
 * Phase 1: empty registry. Phase 2+ populates with level data.
 * The interface is established here so Phase 2 scenes can import typed manifests
 * without architectural changes.
 */

export interface LevelManifest {
    id: string;
    titleKey: string;
    tilemapKey: string;
    bgmKey: string;
    enemies: Array<{ type: string; spawnTile: { x: number; y: number } }>;
    triggers: Array<{ zone: string; action: string; target: string; data?: object }>;
    journalUnlock: string;
}

const registry: LevelManifest[] = []; // populated in Phase 2+

export const ContentRegistry = {
    getLevel: (id: string): LevelManifest | undefined => registry.find(l => l.id === id),
    getAllLevels: (): LevelManifest[] => registry,
    // IN-01 fix: guard against duplicate registration on Vite HMR reload —
    // module re-evaluation would push a second entry for the same level id.
    register: (manifest: LevelManifest): void => {
        if (!registry.find(l => l.id === manifest.id)) {
            registry.push(manifest);
        }
    },
};
