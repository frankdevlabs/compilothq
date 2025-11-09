import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Vitest Configuration for @compilothq/database
 *
 * This configuration is for testing:
 * - Data Access Layer (DAL) functions
 * - Prisma models and queries
 * - Database utilities and helpers
 *
 * Environment: Node.js (for Prisma and database operations)
 */
export default defineConfig({
  test: {
    name: '@compilothq/database',
    environment: 'node',

    // Setup file for test environment initialization
    setupFiles: ['./__tests__/setup.ts'],

    // Test file patterns
    include: ['**/__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/test-utils/**', // Test utilities excluded from coverage
        '**/*.test.ts',
        '**/index.ts', // Re-export files typically don't need coverage
      ],
    },

    // Database tests may take longer
    testTimeout: 15000,
    hookTimeout: 15000,
  },

  resolve: {
    alias: {
      '@compilothq/database': path.resolve(__dirname, './src'),
      '.prisma/client': path.resolve(__dirname, './node_modules/.prisma/client'),
    },
  },
})
