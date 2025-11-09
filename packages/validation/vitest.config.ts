import path from 'path'
import { defineProject } from 'vitest/config'

/**
 * Vitest Project Configuration for @compilothq/validation
 *
 * This configuration is for testing:
 * - Zod validation schemas
 * - Schema refinements and transformations
 * - Type inference and validation error handling
 *
 * Environment: Node.js (Zod validation is runtime-agnostic)
 *
 * Note: Uses defineProject() instead of defineConfig() for workspace projects.
 * Coverage configuration is handled at the workspace level.
 */
export default defineProject({
  test: {
    name: '@compilothq/validation',
    environment: 'node',

    // Test file patterns - specific to this package
    include: ['**/__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Schema validation tests are fast
    testTimeout: 5000,
  },

  resolve: {
    alias: {
      '@compilothq/validation': path.resolve(__dirname, './src'),
    },
  },
})
