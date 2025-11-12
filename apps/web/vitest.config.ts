import react from '@vitejs/plugin-react'
import path from 'path'
import { defineProject } from 'vitest/config'

/**
 * Vitest Project Configuration for web app
 *
 * This configuration is for testing:
 * - React components and pages
 * - Next.js API routes and Server Actions
 * - tRPC procedures and routers
 * - Client-side utilities and hooks
 *
 * Environment: jsdom (for React) and node (for API routes)
 * The test environment is determined by file location/naming patterns
 *
 * Note: Uses defineProject() instead of defineConfig() for workspace projects.
 * Coverage configuration is handled at the workspace level.
 */
export default defineProject({
  plugins: [react()],

  test: {
    name: 'web',

    // Use jsdom as default environment for React components
    environment: 'jsdom',

    // Setup file for test environment initialization
    setupFiles: ['./__tests__/setup.ts'],

    // Test file patterns - specific to this app
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/__tests__/e2e/**', // E2E tests run via Playwright, not Vitest
    ],

    // Standard timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
  },

  resolve: {
    alias: {
      // Match tsconfig.json path aliases
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@compilothq/database': path.resolve(__dirname, '../../packages/database/src'),
      '@compilothq/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@compilothq/validation': path.resolve(__dirname, '../../packages/validation/src'),
    },
  },
})
