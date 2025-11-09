/**
 * Global test setup for @compilothq/database integration tests
 *
 * This file runs once before all tests in the database package.
 * It sets up the test database by running migrations and ensures
 * the environment is properly configured.
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { setupTestDatabase, disconnectTestDatabase } from '../src/test-utils/db-helpers'
import { beforeAll, afterAll } from 'vitest'

// Load .env.test file from root directory
// Use override: true to ensure test DATABASE_URL takes precedence
const envPath = resolve(__dirname, '../../../.env.test')
config({ path: envPath, override: true })

/**
 * Global setup - runs once before all tests
 */
beforeAll(async () => {
  // Verify DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Ensure .env.test file exists at project root with test database URL.'
    )
  }

  // Verify we're using the test database (port 5433)
  if (!process.env.DATABASE_URL.includes(':5433/')) {
    throw new Error(
      `Test database must use port 5433. Current URL uses: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown port'}`
    )
  }

  console.log('\nSetting up test database...')

  try {
    // Run migrations on test database (only once for all tests)
    await setupTestDatabase()
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
