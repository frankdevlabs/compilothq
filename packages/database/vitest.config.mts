import { config } from 'dotenv'
import path from 'path'
import { defineProject } from 'vitest/config'

/**
 * Load test environment variables explicitly
 * This must run before defineProject to ensure DATABASE_URL is set correctly
 * Priority: .env.test (test DB) overrides .env/.env.local (dev DB)
 */
config({ path: path.resolve(__dirname, '.env.test'), override: true })

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
      // Resolve workspace packages for test imports
      '@compilothq/database': path.resolve(__dirname, './src'),
      '@compilothq/validation': path.resolve(__dirname, '../validation/src'),
    },
  },
})
