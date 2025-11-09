/**
 * Test utilities for @compilothq/database
 *
 * This module exports all test-related utilities including:
 * - Database helpers for setup, cleanup, and management
 * - Reference data seeding functions
 * - Test data factories for generating valid test data
 * - Type-safe assertion helpers
 */

// Database helpers
export {
  setupTestDatabase,
  cleanupTestDatabase,
  getTestDatabaseClient,
  disconnectTestDatabase,
} from './db-helpers'

// Reference data seeding
export { seedReferenceData } from './seed-reference-data'

// Test data factories
export * from './factories'

/**
 * Type-safe assertion helper: Asserts that a value is defined (not null or undefined)
 * Throws an error if the value is null or undefined
 *
 * @param value - Value to check
 * @param message - Optional error message
 * @throws Error if value is null or undefined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Expected value to be defined'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message)
  }
}

/**
 * Type-safe assertion helper: Asserts that a value is an array
 * Throws an error if the value is not an array
 *
 * @param value - Value to check
 * @param message - Optional error message
 * @throws Error if value is not an array
 */
export function assertArray<T>(
  value: unknown,
  message = 'Expected value to be an array'
): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new Error(message)
  }
}

/**
 * Type-safe assertion helper: Asserts that an error is a validation error
 * Useful for testing Zod validation errors
 *
 * @param error - Error to check
 * @param message - Optional error message
 * @throws Error if the error is not a validation error with issues
 */
export function assertValidationError(
  error: unknown,
  message = 'Expected error to be a validation error'
): asserts error is { issues: Array<{ message: string; path: (string | number)[] }> } {
  if (
    !error ||
    typeof error !== 'object' ||
    !('issues' in error) ||
    !Array.isArray((error as { issues?: unknown }).issues)
  ) {
    throw new Error(message)
  }
}
