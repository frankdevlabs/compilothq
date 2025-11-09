import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Vitest Configuration for @compilothq/ui
 *
 * This configuration is for testing:
 * - React components (buttons, cards, inputs, etc.)
 * - UI utilities and helpers
 * - Component accessibility and interactions
 *
 * Environment: jsdom (for React and DOM testing)
 */
export default defineConfig({
  test: {
    name: '@compilothq/ui',
    environment: 'jsdom',

    // Setup file for React Testing Library and jest-dom matchers
    setupFiles: ['./__tests__/setup.ts'],

    // Test file patterns
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/index.ts', // Re-export files
        'src/lib/utils.ts', // Simple utility functions
      ],
    },

    // UI tests are typically fast
    testTimeout: 10000,
  },

  resolve: {
    alias: {
      '@compilothq/ui': path.resolve(__dirname, './src'),
    },
  },
})
