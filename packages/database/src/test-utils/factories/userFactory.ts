/**
 * Test Factory for User entities
 *
 * Provides utilities to create test users with various personas and configurations.
 * Used in integration tests to create isolated test data.
 */

import { randomUUID } from 'crypto'

import type { User, UserPersona } from '../../index'
import { prisma } from '../../index'

export interface UserFactoryOptions {
  email?: string
  name?: string
  primaryPersona?: UserPersona
  organizationId: string // Required: users must belong to an organization
  emailVerified?: Date | null
  image?: string | null
}

/**
 * Creates a test user with the specified configuration
 *
 * @param options - Configuration options for the user
 * @returns Created user
 *
 * @example
 * ```typescript
 * const user = await createTestUser({
 *   organizationId: org.id,
 *   primaryPersona: 'DPO',
 *   email: 'dpo@test.example.com'
 * })
 * ```
 */
export async function createTestUser(options: UserFactoryOptions): Promise<User> {
  const {
    email = `test-user-${randomUUID()}@test.example.com`,
    name = `Test User ${randomUUID().slice(0, 8)}`,
    primaryPersona = 'PRIVACY_OFFICER',
    organizationId,
    emailVerified = null,
    image = null,
  } = options

  return await prisma.user.create({
    data: {
      email,
      name,
      primaryPersona,
      organizationId,
      emailVerified,
      image,
    },
  })
}

/**
 * Creates multiple test users in batch
 *
 * @param configs - Array of user configurations
 * @returns Array of created users
 *
 * @example
 * ```typescript
 * const users = await createTestUsers([
 *   { organizationId: org.id, primaryPersona: 'DPO' },
 *   { organizationId: org.id, primaryPersona: 'PRIVACY_OFFICER' },
 *   { organizationId: org.id, primaryPersona: 'LEGAL_COUNSEL' }
 * ])
 * ```
 */
export async function createTestUsers(configs: UserFactoryOptions[]): Promise<User[]> {
  const users = []

  for (const config of configs) {
    const user = await createTestUser(config)
    users.push(user)
  }

  return users
}

/**
 * Creates a set of users with different personas for testing
 *
 * @param organizationId - Organization to create users for
 * @param personas - Array of personas to create (defaults to all personas)
 * @returns Map of persona to user
 *
 * @example
 * ```typescript
 * const usersByPersona = await createTestUsersByPersona(org.id, ['DPO', 'PRIVACY_OFFICER'])
 * const dpo = usersByPersona.get('DPO')
 * ```
 */
export async function createTestUsersByPersona(
  organizationId: string,
  personas: UserPersona[] = ['DPO', 'PRIVACY_OFFICER', 'BUSINESS_OWNER']
): Promise<Map<UserPersona, User>> {
  const userMap = new Map<UserPersona, User>()

  for (const persona of personas) {
    const user = await createTestUser({
      organizationId,
      primaryPersona: persona,
      email: `${persona.toLowerCase()}@test.example.com`,
      name: `Test ${persona.replace('_', ' ')}`,
    })
    userMap.set(persona, user)
  }

  return userMap
}

/**
 * Cleans up test users
 *
 * @param userIds - Array of user IDs to delete
 *
 * @example
 * ```typescript
 * await cleanupTestUsers([user1.id, user2.id])
 * ```
 */
export async function cleanupTestUsers(userIds: string[]): Promise<void> {
  await prisma.user.deleteMany({
    where: {
      id: {
        in: userIds,
      },
    },
  })
}
