/**
 * Test setup for @compilothq/ui
 *
 * This file configures the testing environment for UI components:
 * - Extends expect with @testing-library/jest-dom matchers via Vitest-specific import
 * - Sets up DOM cleanup after each test to prevent test pollution
 */

import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup DOM after each test to prevent test pollution
afterEach(() => {
  cleanup()
})
