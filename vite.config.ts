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
        include: ['culori', 'culori/all', 'culori/fn', 'apca-w3'],
    },
    build: {
        target: 'esnext',
        minify: 'esbuild',
        sourcemap: true, // Add for debugging
        cssMinify: true,
        rollupOptions: {
            external: ['html2canvas', 'canvg', 'dompurify'],
            output: {
                manualChunks(id: string) {
                    if (id.includes('culori') || id.includes('apca-w3')) {
                        return 'color-libs';
                    }
                    if (id.includes('lucide-svelte')) {
                        return 'ui-libs';
                    }
                },
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]',
            },
        },
    },
});
