import path from 'path'
import { defineProject } from 'vitest/config'

/**
 * Vitest Project Configuration for @compilothq/database
 *
 * This configuration is for testing:
 * - Data Access Layer (DAL) functions
 * - Prisma models and queries
 * - Database utilities and helpers
 *
 * Environment: Node.js (for Prisma and database operations)
 *
 * Note: Uses defineProject() instead of defineConfig() for workspace projects.
 * Coverage configuration is handled at the workspace level.
 */
export default defineProject({
  test: {
    name: '@compilothq/database',
    environment: 'node',

    // Setup file for test environment initialization
    setupFiles: ['./__tests__/setup.ts'],

    // Test file patterns - specific to this package
    include: ['**/__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Database tests may take longer than default
    testTimeout: 15000,
    hookTimeout: 15000,

    // Run test files sequentially to avoid database race conditions
    // All test files share the same test database, so parallel execution
    // causes truncate operations to interfere with other running tests
    fileParallelism: false,
  },

  resolve: {
    alias: {
      '@compilothq/database': path.resolve(__dirname, './src'),
    },
  },
})
