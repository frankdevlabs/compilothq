import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Vitest Configuration for @compilothq/validation
 *
 * This configuration is for testing:
 * - Zod validation schemas
 * - Schema refinements and transformations
 * - Type inference and validation error handling
 *
 * Environment: Node.js (Zod validation is runtime-agnostic)
 */
export default defineConfig({
  test: {
    name: '@compilothq/validation',
    environment: 'node',

    // Test file patterns
    include: ['**/__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/index.ts', // Re-export files
      ],
    },

    // Schema validation tests are fast
    testTimeout: 5000,
  },

  resolve: {
    alias: {
      '@compilothq/validation': path.resolve(__dirname, './src'),
    },
  },
})
