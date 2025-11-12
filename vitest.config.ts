import { defineConfig } from 'vitest/config'

/**
 * Vitest Root Configuration with Projects
 *
 * This configuration defines how Vitest runs across the entire monorepo using the projects pattern (Vitest 3.2+).
 * Each project (packages and apps) has its own vitest.config file for environment-specific
 * settings, while this root config provides shared settings and coverage thresholds.
 *
 * Key architectural decisions:
 * - Projects defined in test.projects array (replaces deprecated workspace pattern)
 * - Coverage configuration only at root level (Vitest requirement)
 * - Each project config uses defineProject() for proper type safety
 * - Environment variables loaded from .env.test at module load time with override: true
 *
 * @see https://vitest.dev/guide/workspace
 * @see https://vitest.dev/guide/coverage.html#workspace-support
 */
export default defineConfig({
  test: {
    // Global settings inherited by all projects
    globals: true,

    // Global test exclusions - prevents testing dist/, E2E, and node_modules
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.spec.ts', // Playwright E2E test files
      '**/__tests__/e2e/**', // E2E test directories
      '**/e2e/**',
      '**/coverage/**',
      '**/.next/**',
    ],

    // Projects array - references to individual project configs
    projects: [
      // Database package - Node.js environment for DAL and Prisma tests
      'packages/database/vitest.config.mts',

      // UI package - jsdom environment for React component tests
      'packages/ui/vitest.config.ts',

      // Validation package - Node.js environment for Zod schema tests
      'packages/validation/vitest.config.ts',

      // Web app - Commented out until unit tests are added
      // 'apps/web/vitest.config.ts',
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
