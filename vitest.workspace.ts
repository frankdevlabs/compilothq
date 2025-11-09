import { defineConfig } from 'vitest/config'

/**
 * Vitest Workspace Configuration
 *
 * This workspace configuration defines how Vitest runs across the entire monorepo.
 * Each project (packages and apps) has its own vitest.config file for environment-specific
 * settings, while this root config provides shared settings and coverage thresholds.
 *
 * Key architectural decisions:
 * - Projects defined in test.projects array (not defineWorkspace)
 * - Coverage configuration only at root level (Vitest requirement)
 * - Each project config can use defineProject() and extends: true to inherit settings
 *
 * @see https://vitest.dev/guide/workspace.html
 * @see https://vitest.dev/guide/coverage.html#workspace-support
 */
export default defineConfig({
  test: {
    // Global settings inherited by all projects
    globals: true,

    // Projects array - references to individual project configs
    projects: [
      // Database package - Node.js environment for DAL and Prisma tests
      'packages/database/vitest.config.mts',

      // UI package - jsdom environment for React component tests
      'packages/ui/vitest.config.ts',

      // Validation package - Node.js environment for Zod schema tests
      'packages/validation/vitest.config.ts',

      // Web app - Mixed environment (jsdom for components, node for API)
      'apps/web/vitest.config.ts',
    ],

    // Coverage configuration - MUST be at root level for workspace
    // Applies across all projects with 80% minimum threshold
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],

      // Global exclusions that apply to all projects
      exclude: [
        // Test files and directories
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/__tests__/setup.ts',

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
        '**/prisma/seed.ts',
        '**/prisma/seeds/**',

        // Test utilities and mocks
        '**/test-utils/**',
        '**/__mocks__/**',

        // Re-export files (typically just exports, no logic to test)
        '**/index.ts',
        '**/index.tsx',
      ],

      // Coverage thresholds - 80% minimum across all metrics
      // These apply to the entire workspace
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
})
