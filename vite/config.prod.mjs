import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2
            },
            mangle: true,
            format: {
                comments: false
            }
        }
    },
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            // Use public/manifest.webmanifest as the single source of truth.
            // Setting manifest: false prevents vite-plugin-pwa from generating a
            // competing manifest that would shadow the static file and lose
            // orientation: "portrait" and start_url fields.
            manifest: false,
            // workbox globPatterns deferred to Phase 4 — Phase 1 uses manifest stub only
        })
    ]
});
