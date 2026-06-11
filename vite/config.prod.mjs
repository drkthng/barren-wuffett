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
            manifest: {
                name: 'Barren Wuffett',
                short_name: 'BarrenW',
                display: 'standalone',
                background_color: '#1a1a2e',
                theme_color: '#1a1a2e',
                icons: [
                    {
                        src: '/favicon.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
            // workbox globPatterns deferred to Phase 4 — Phase 1 uses manifest stub only
        })
    ]
});
