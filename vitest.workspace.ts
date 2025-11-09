import { defineWorkspace } from 'vitest/config'

/**
 * Vitest Workspace Configuration
 *
 * This workspace configuration defines how Vitest runs across the entire monorepo.
 * Each workspace project (packages and apps) can have its own specific configuration.
 *
 * @see https://vitest.dev/guide/workspace.html
 */
export default defineWorkspace([
  // Database package - Node.js environment for DAL and Prisma tests
  'packages/database/vitest.config.mts',

  // UI package - jsdom environment for React component tests
  'packages/ui/vitest.config.ts',

  // Validation package - Node.js environment for Zod schema tests
  'packages/validation/vitest.config.ts',

  // Web app - Mixed environment (jsdom for components, node for API)
  'apps/web/vitest.config.ts',

  // Shared workspace configuration
  {
    test: {
      // Test file patterns - all packages follow this structure
      include: ['**/__tests__/**/*.test.{ts,tsx}'],

      // Coverage configuration - 80% minimum threshold
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          // Test files and directories
          '**/__tests__/**',
          '**/*.test.{ts,tsx}',

          // Configuration files
          '**/*.config.{ts,js,mjs,mts}',
          '**/vitest.config.ts',
          '**/vitest.config.mts',
          '**/vitest.workspace.ts',

          // Build output and dependencies
          '**/node_modules/**',
          '**/dist/**',
          '**/.next/**',
          '**/coverage/**',

          // Type definitions
          '**/*.d.ts',

          // Database specific
          '**/prisma/migrations/**',
          '**/prisma/seed/**',
          '**/src/test-utils/**', // Test utilities are not subject to coverage
        ],

        // Coverage thresholds - 80% minimum across all metrics
        thresholds: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },

      // Global settings
      globals: true,

      // Default timeout settings
      testTimeout: 10000,
      hookTimeout: 10000,
    },
  },
])
