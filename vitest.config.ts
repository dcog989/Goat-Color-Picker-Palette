import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [svelte({ hot: !process.env.VITEST })],
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        setupFiles: ['./vitest.setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                '.svelte-kit/',
                '**/types.ts',
                '**/*.d.ts',
                '**/constants.ts',
                '**/data/**',
            ],
        },
    },
    resolve: {
        alias: {
            $lib: path.resolve(__dirname, './src/lib'),
        },
    },
});
