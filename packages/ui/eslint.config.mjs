import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import importPlugin from 'eslint-plugin-import'

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'storybook-static/**'],
  },

  js.configs.recommended,

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'react-hooks': reactHooks,
      'simple-import-sort': simpleImportSort,
      import: importPlugin,
    },
    rules: {
      // TypeScript strict rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // React 19 Hooks with Compiler rules
      ...reactHooks.configs['recommended-latest'].rules,

      // Promise safety for async operations
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // UI component best practices
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',

      // Import organization for clean component files
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',

      // Disable base rules
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
]
