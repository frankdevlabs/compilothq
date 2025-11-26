/**
 * Test Factory for Organization entities
 *
 * Provides utilities to create test organizations with configurable properties.
 * Used in integration tests to create isolated test data.
 */

import { randomUUID } from 'crypto'

import type { Organization, OrganizationStatus } from '../../index'
import { prisma } from '../../index'

export interface OrganizationFactoryOptions {
  name?: string
  slug?: string
  status?: OrganizationStatus
  userCount?: number
}

/**
 * Creates a test organization with optional associated users
 *
 * @param options - Configuration options for the organization
 * @returns Created organization with array of associated users
 *
 * @example
 * ```typescript
 * const { org, users } = await createTestOrganization({
 *   slug: 'test-acme',
 *   userCount: 3,
 *   status: 'ACTIVE'
 * })
 * ```
 */
export async function createTestOrganization(
  options: OrganizationFactoryOptions = {}
): Promise<{ org: Organization; users: Array<{ id: string; email: string; name: string }> }> {
  const {
    name = `Test Organization ${randomUUID().slice(0, 8)}`,
    slug = `test-org-${randomUUID().slice(0, 8)}`,
    status = 'ACTIVE',
    userCount = 0,
  } = options

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      status,
    },
  })

  // Create associated users if requested
  const users = []
  for (let i = 0; i < userCount; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user-${i + 1}-${slug}@test.example.com`,
        name: `Test User ${i + 1} of ${name}`,
        primaryPersona: i === 0 ? 'DPO' : 'PRIVACY_OFFICER', // First user is DPO
        organizationId: org.id,
      },
    })
    users.push(user)
  }

  return { org, users }
}

/**
 * Creates multiple test organizations in a single transaction
 *
 * @param configs - Array of organization configurations
 * @returns Array of created organizations with their users
 *
 * @example
 * ```typescript
 * const orgs = await createTestOrganizations([
 *   { slug: 'test-acme', userCount: 2 },
 *   { slug: 'test-beta', userCount: 5 }
 * ])
 * ```
 */
export async function createTestOrganizations(
  configs: OrganizationFactoryOptions[]
): Promise<
  Array<{ org: Organization; users: Array<{ id: string; email: string; name: string }> }>
> {
  const results = []

  for (const config of configs) {
    const result = await createTestOrganization(config)
    results.push(result)
  }

  return results
}

/**
 * Cleans up test organizations and their associated data
 *
 * This removes organizations and cascading deletes will handle related users.
 *
 * @param organizationIds - Array of organization IDs to delete
 *
 * @example
 * ```typescript
 * await cleanupTestOrganizations([org1.id, org2.id])
 * ```
 */
export async function cleanupTestOrganizations(organizationIds: string[]): Promise<void> {
  // Delete in correct order due to FK constraints:
  // 1. Invitations (reference users)
  // 2. Users (referenced by invitations)
  // 3. Organizations (referenced by users)

  // Delete invitations first
  await prisma.invitation.deleteMany({
    where: {
      organizationId: {
        in: organizationIds,
      },
    },
  })

  // Delete users
  await prisma.user.deleteMany({
    where: {
      organizationId: {
        in: organizationIds,
      },
    },
  })

  // Delete organizations
  await prisma.organization.deleteMany({
    where: {
      id: {
        in: organizationIds,
      },
    },
  })
}
