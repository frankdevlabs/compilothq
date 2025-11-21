/**
 * Global test setup for @compilothq/database integration tests
 *
 * This file runs once before all tests in the database package.
 * It sets up the test database by running migrations and ensures
 * the environment is properly configured.
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { afterAll, beforeAll } from 'vitest'

import { disconnectTestDatabase, setupTestDatabase } from '../src/test-utils/db-helpers'

/**
 * Environment Variable Loading Strategy
 *
 * Priority (highest to lowest):
 * 1. Vitest auto-loads: packages/database/.env.test (PRIMARY - created in Phase 1)
 * 2. CI/Shell environment variables (for pipeline overrides)
 * 3. Fallback: root .env.test file loaded below
 *
 * Why override: false?
 * - Allows CI/CD to inject DATABASE_URL for pipeline databases
 * - .env.test in package directory is already loaded by Vitest before this runs
 * - This acts as a fallback for edge cases or legacy setups
 */
const envPath = resolve(__dirname, '../../../.env.test')
config({ path: envPath, override: false })

/**
 * Global setup - runs once before all tests
 */
beforeAll(() => {
  // Verify DATABASE_URL is set
  if (!process.env['DATABASE_URL']) {
    throw new Error(
      'DATABASE_URL is not set. Ensure .env.test file exists at project root with test database URL.'
    )
  }

  // Verify we're using the test database (ends with compilothq_test)
  if (!process.env['DATABASE_URL'].includes('compilothq_test')) {
    throw new Error(
      `Test database must be 'compilothq_test'. Current URL uses: ${process.env['DATABASE_URL'].split('/').pop() ?? 'unknown database'}`
    )
  }

  console.log('\nSetting up test database...')

  try {
    // Run migrations on test database (only once for all tests)
    setupTestDatabase()
    console.log('Test database setup complete.\n')
  } catch (error) {
    console.error('Failed to set up test database:', error)
    throw error
  }
}, 30000) // 30 second timeout for database setup

/**
 * Global teardown - runs once after all tests
 */
afterAll(async () => {
  console.log('\nCleaning up test database connections...')

  try {
    // Disconnect from test database
    await disconnectTestDatabase()
    console.log('Test database disconnected.\n')
  } catch (error) {
    console.error('Failed to disconnect from test database:', error)
    // Don't throw here, as tests have already completed
  }
})
