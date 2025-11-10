import path from 'path'
import { defineProject } from 'vitest/config'

/**
 * Vitest Project Configuration for @compilothq/ui
 *
 * This configuration is for testing:
 * - React components (buttons, cards, inputs, etc.)
 * - UI utilities and helpers
 * - Component accessibility and interactions
 *
 * Environment: happy-dom (for React and DOM testing)
 *
 * Note: Uses defineProject() instead of defineConfig() for workspace projects.
 * Coverage configuration is handled at the workspace level.
 * Test setup (jest-dom matchers, cleanup) is in __tests__/setup.ts
 */
export default defineProject({
  test: {
    name: '@compilothq/ui',
    environment: 'happy-dom',
    globals: true,

    // Use threads pool for component testing
    pool: 'threads',
    isolate: false,

    // Setup file for React Testing Library and jest-dom matchers
    setupFiles: [path.join(__dirname, '__tests__/setup.ts')],

    // Test file patterns - specific to this package
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // UI tests are typically fast
    testTimeout: 10000,
  },

  resolve: {
    alias: {
      '@compilothq/ui': path.resolve(__dirname, './src'),
    },
  },
})
