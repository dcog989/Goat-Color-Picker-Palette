import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const plugins = [tailwindcss(), svelte()];

if (process.env.BUNDLE_ANALYZE) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic
  const { default: sonda } = await import('sonda/vite');
  plugins.push(sonda());
}

export default defineConfig({
  base: './',
  plugins,
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: process.env.BUNDLE_ANALYZE ? true : process.env.NODE_ENV !== 'production',
    cssMinify: true,
    rollupOptions: {
      external: ['html2canvas', 'canvg', 'dompurify'],
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
