import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Organization } from '../../src/index'
import { prisma } from '../../src/index'
import { cleanupTestOrganizations, createTestOrganizations } from '../../src/test-utils/factories'
import { createTestUser } from '../../src/test-utils/factories/userFactory'

/**
 * Organization-User Relationships Integration Tests
 *
 * Self-contained integration tests that verify organization and user relationships
 * work correctly without depending on external seed data.
 *
 * Tests create their own data, verify relationships, and clean up after themselves.
 */
describe('Organization-User Relationships', () => {
  let testOrgs: Array<{
    org: Organization
    users: Array<{ id: string; email: string; name: string }>
  }>
  let acme: Organization
  let beta: Organization
  let gamma: Organization

  beforeAll(async () => {
    // Create test organizations with different user counts
    testOrgs = await createTestOrganizations([
      { name: 'Test Acme Corp', slug: 'test-acme-corp', status: 'ACTIVE', userCount: 2 },
      { name: 'Test Beta Inc', slug: 'test-beta-inc', status: 'TRIAL', userCount: 5 },
      { name: 'Test Gamma LLC', slug: 'test-gamma-llc', status: 'ACTIVE', userCount: 0 }, // Will add users manually for persona test
    ])

    acme = testOrgs[0]!.org
    beta = testOrgs[1]!.org
    gamma = testOrgs[2]!.org

    // Create users for Gamma with specific persona distribution
    await createTestUser({ organizationId: gamma.id, primaryPersona: 'DPO' })
    await createTestUser({ organizationId: gamma.id, primaryPersona: 'PRIVACY_OFFICER' })
    await createTestUser({ organizationId: gamma.id, primaryPersona: 'PRIVACY_OFFICER' })
    await createTestUser({ organizationId: gamma.id, primaryPersona: 'BUSINESS_OWNER' })
    await createTestUser({ organizationId: gamma.id, primaryPersona: 'BUSINESS_OWNER' })
    await createTestUser({ organizationId: gamma.id, primaryPersona: 'BUSINESS_OWNER' })
    await createTestUser({ organizationId: gamma.id, primaryPersona: 'BUSINESS_OWNER' })
    await createTestUser({ organizationId: gamma.id, primaryPersona: 'BUSINESS_OWNER' })
  })

  afterAll(async () => {
    // Clean up test data
    await cleanupTestOrganizations([acme.id, beta.id, gamma.id])
  })

  describe('Organizations', () => {
    it('should create and retrieve multiple organizations', async () => {
      // Act
      const organizations = await prisma.organization.findMany({
        where: {
          slug: {
            in: ['test-acme-corp', 'test-beta-inc', 'test-gamma-llc'],
          },
        },
      })

      // Assert
      expect(organizations).toHaveLength(3)
    })

    it('should store organization attributes correctly', async () => {
      // Act
      const retrievedAcme = await prisma.organization.findUnique({
        where: { slug: 'test-acme-corp' },
      })
      const retrievedBeta = await prisma.organization.findUnique({
        where: { slug: 'test-beta-inc' },
      })
      const retrievedGamma = await prisma.organization.findUnique({
        where: { slug: 'test-gamma-llc' },
      })

      // Assert
      expect(retrievedAcme).toBeDefined()
      expect(retrievedAcme!.name).toBe('Test Acme Corp')
      expect(retrievedAcme!.status).toBe('ACTIVE')

      expect(retrievedBeta).toBeDefined()
      expect(retrievedBeta!.name).toBe('Test Beta Inc')
      expect(retrievedBeta!.status).toBe('TRIAL')

      expect(retrievedGamma).toBeDefined()
      expect(retrievedGamma!.name).toBe('Test Gamma LLC')
      expect(retrievedGamma!.status).toBe('ACTIVE')
    })
  })

  describe('Users', () => {
    it('should create users belonging to organizations', async () => {
      // Act
      const users = await prisma.user.findMany({
        where: {
          organizationId: {
            in: [acme.id, beta.id, gamma.id],
          },
        },
      })

      // Assert - Total users: 2 (acme) + 5 (beta) + 8 (gamma) = 15
      expect(users.length).toBeGreaterThanOrEqual(15)
    })

    it('should associate correct number of users with Acme Corp', async () => {
      // Act
      const userCount = await prisma.user.count({
        where: { organizationId: acme.id },
      })

      // Assert
      expect(userCount).toBe(2)
    })

    it('should associate correct number of users with Beta Inc', async () => {
      // Act
      const userCount = await prisma.user.count({
        where: { organizationId: beta.id },
      })

      // Assert
      expect(userCount).toBe(5)
    })

    it('should associate correct number of users with Gamma LLC', async () => {
      // Act
      const userCount = await prisma.user.count({
        where: { organizationId: gamma.id },
      })

      // Assert
      expect(userCount).toBe(8)
    })

    it('should maintain correct persona distribution per organization', async () => {
      // Act
      const dpoUsers = await prisma.user.count({
        where: { organizationId: gamma.id, primaryPersona: 'DPO' },
      })
      const privacyOfficers = await prisma.user.count({
        where: { organizationId: gamma.id, primaryPersona: 'PRIVACY_OFFICER' },
      })
      const businessOwners = await prisma.user.count({
        where: { organizationId: gamma.id, primaryPersona: 'BUSINESS_OWNER' },
      })

      // Assert - Gamma LLC: 1 DPO, 2 PRIVACY_OFFICER, 5 BUSINESS_OWNER
      expect(dpoUsers).toBe(1)
      expect(privacyOfficers).toBe(2)
      expect(businessOwners).toBe(5)
    })
  })
})
