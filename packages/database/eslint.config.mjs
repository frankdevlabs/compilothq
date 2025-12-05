import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import security from 'eslint-plugin-security'

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'generated/**'],
  },

  js.configs.recommended,
  security.configs.recommended,

  {
    files: ['**/*.ts', '**/*.mts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      // Inherit strict rules from root config
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',

      // Database-specific strict rules
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',

      // Extra strictness for DAL functions (data access layer)
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // Database operations should have explicit error handling
      '@typescript-eslint/only-throw-error': 'error',  // v8 renamed from no-throw-literal

      // Prisma client safety
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },

  // Integration tests - relax unsafe type rules for Prisma client usage
  {
    files: [
      '__tests__/integration/**/*.test.ts',
      '__tests__/integration/**/*.integration.test.ts',
      '__tests__/integration/**/*.test.tsx',
      '__tests__/integration/**/*.integration.test.tsx',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
]
