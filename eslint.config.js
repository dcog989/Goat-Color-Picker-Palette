import js from '@eslint/js';
import tailwindcss from 'eslint-plugin-better-tailwindcss';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
    {
        ignores: [
            'build/',
            '.svelte-kit/',
            'dist/',
            'eslint.config.js',
            'vite.config.ts',
            'svelte.config.js',
            'scripts/**',
        ],
    },
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs['flat/recommended'],
    prettier,
    ...svelte.configs['flat/prettier'],
    tailwindcss.configs['recommended-error'],
    {
        settings: {
            'better-tailwindcss': {
                entryPoint: 'src/app.css',
                detectComponentClasses: true,
            },
        },
        rules: {
            'better-tailwindcss/no-unknown-classes': [
                'error',
                {
                    ignore: [
                        // Animation classes
                        '^animate-(fade|scale)-(in|out)$',
                        '^animate-slide-up$',
                        // Custom utility classes
                        '^text-on-current$',
                        '^hover:text-on-current$',
                        '^group-hover:text-on-current$',
                        // Component classes
                        '^checkerboard$',
                        '^custom-scrollbar$',
                    ],
                },
            ],
        },
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    {
        files: ['**/*.svelte', '**/*.svelte.ts'],
        languageOptions: {
            parserOptions: {
                parser: ts.parser,
            },
        },
        rules: {
            'svelte/no-at-html-tags': 'error',
            'svelte/valid-compile': 'error',
        },
    },
    {
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'inline-type-imports',
                },
            ],
        },
    },
);
