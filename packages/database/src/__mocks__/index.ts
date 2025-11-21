/**
 * Mock module for @compilothq/database
 *
 * This module provides a mocked Prisma Client for unit tests using vitest-mock-extended.
 * When vi.mock('../src/index') is called, Vitest automatically uses this mock.
 *
 * Usage in tests:
 * ```typescript
 * import { vi } from 'vitest'
 * import { prisma } from '../src/index'
 *
 * vi.mock('../src/index')
 *
 * // Now prisma is the mocked version
 * prisma.user.findUnique.mockResolvedValue({ ... })
 * ```
 */

import { beforeEach } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'

import { PrismaClient } from '../index'

// Create deep mock of Prisma Client
export const prisma = mockDeep<PrismaClient>()

// Reset mock before each test for isolation
beforeEach(() => {
  mockReset(prisma)
})

// Re-export all types, enums, and utilities from the actual module
export * from '../../generated/client'
