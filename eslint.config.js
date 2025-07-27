// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default [js.configs.recommended, {
    files: ['**/*.js', '**/*.ts', '**/*.svelte'],
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            ...globals.es2020
        },
        ecmaVersion: 2020,
        sourceType: 'module'
    }
}, {
    files: ['**/*.ts', '**/*.svelte'],
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            project: './tsconfig.json',
            extraFileExtensions: ['.svelte']
        }
    },
    plugins: {
        '@typescript-eslint': ts
    },
    rules: {
        ...ts.configs['recommended'].rules,
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn'
    }
}, {
    files: ['**/*.svelte'],
    languageOptions: {
        parser: svelteParser,
        parserOptions: {
            parser: tsParser
        }
    },
    plugins: {
        svelte
    },
    rules: {
        ...svelte.configs.recommended.rules,
        'svelte/no-at-html-tags': 'off'
    }
}, {
    ignores: [
        '.svelte-kit/**',
        'build/**',
        'dist/**',
        'node_modules/**',
        '.env',
        '.env.*',
        'vite.config.js.timestamp-*',
        'vite.config.ts.timestamp-*'
    ]
}, ...storybook.configs["flat/recommended"]];
