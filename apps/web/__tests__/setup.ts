/**
 * Test setup for apps/web
 *
 * This file configures the testing environment for the web application:
 * - Imports @testing-library/jest-dom matchers for better assertions
 * - Loads environment variables from .env.test files
 */

import '@testing-library/jest-dom/vitest'

import { config } from 'dotenv'
import { resolve } from 'path'

/**
 * Environment Variable Loading Strategy
 *
 * Priority (highest to lowest):
 * 1. Vitest auto-loads: apps/web/.env.test (if exists)
 * 2. CI/Shell environment variables (for pipeline overrides)
 * 3. Fallback: root .env.test file loaded below
 *
 * Why override: false?
 * - Allows CI/CD to inject environment variables for pipeline
 * - .env.test in app directory is already loaded by Vitest before this runs
 * - This acts as a fallback for edge cases or when running from root
 */
const envPath = resolve(__dirname, '../../../.env.test')
config({ path: envPath, override: false })
