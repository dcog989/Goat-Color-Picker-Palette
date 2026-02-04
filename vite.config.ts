import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    // Use relative paths so the app works on any base URL (e.g. /repo-name/)
    base: './',
    plugins: [tailwindcss(), svelte()],
    worker: {
        format: 'es',
    },
    optimizeDeps: {
        include: ['culori', 'culori/all', 'culori/fn', 'color-name-list', 'apca-w3'],
    },
    build: {
        target: 'esnext',
        minify: 'esbuild',
        sourcemap: true, // Add for debugging
        cssMinify: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split vendor bundles
                    'color-libs': ['culori', 'apca-w3', 'color-name-list'],
                    'ui-libs': ['lucide-svelte'],
                },
                // Add content hashes for long-term caching
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]',
            },
        },
    },
});
