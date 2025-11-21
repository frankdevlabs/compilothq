import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  createOrganization,
  getOrganizationById,
  getOrganizationBySlug,
  listOrganizations,
  restoreOrganization,
  softDeleteOrganization,
  updateOrganization,
} from '../../../src/dal/organizations'
import type { Organization } from '../../../src/index'
import { prisma } from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils/factories'

/**
 * Organizations DAL - Integration Tests
 *
 * Tests organization data access layer functions against a real test database.
 * Uses hybrid setup: shared data for read operations, per-test data for mutations.
 */
describe('Organizations DAL - Integration Tests', () => {
  // Shared data for READ-ONLY tests (faster)
  let sharedOrg: Organization

  beforeAll(async () => {
    // Create shared test organization for read operations
    const { org } = await createTestOrganization({
      name: 'Shared Test Organization',
      slug: 'org-dal-shared',
      status: 'ACTIVE',
    })
    sharedOrg = org
  })

  afterAll(async () => {
    // Cleanup shared test data
    await cleanupTestOrganizations([sharedOrg.id])
  })

  describe('getOrganizationById', () => {
    it('should retrieve organization by ID from database', async () => {
      // Act
      const result = await getOrganizationById(sharedOrg.id)

      // Assert - Verify complete data integrity
      expect(result).toBeDefined()
      expect(result?.id).toBe(sharedOrg.id)
      expect(result?.name).toBe('Shared Test Organization')
      expect(result?.slug).toBe('org-dal-shared')
      expect(result?.status).toBe('ACTIVE')
      expect(result?.deletedAt).toBeNull()
    })

    it('should return null when organization ID does not exist in database', async () => {
      // Act - Query with non-existent UUID
      const result = await getOrganizationById('00000000-0000-0000-0000-000000000000')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getOrganizationBySlug', () => {
    it('should retrieve organization by slug from database', async () => {
      // Act
      const result = await getOrganizationBySlug('org-dal-shared')

      // Assert - Verify complete data integrity
      expect(result).toBeDefined()
      expect(result?.id).toBe(sharedOrg.id)
      expect(result?.name).toBe('Shared Test Organization')
      expect(result?.slug).toBe('org-dal-shared')
    })

    it('should return null when slug does not exist in database', async () => {
      // Act
      const result = await getOrganizationBySlug('non-existent-slug-12345')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('listOrganizations', () => {
    it('should exclude soft-deleted organizations by default', async () => {
      // Arrange - Create active and deleted orgs
      const { org: activeOrg } = await createTestOrganization({
        slug: 'test-org-active',
        status: 'ACTIVE',
      })
      const { org: deletedOrg } = await createTestOrganization({
        slug: 'test-org-deleted',
        status: 'CANCELLED',
      })

      // Soft delete one org
      await softDeleteOrganization(deletedOrg.id)

      // Act - List without includeDeleted
      const result = await listOrganizations()

      // Assert - Should not include deleted org
      const resultIds = result.map((o) => o.id)
      expect(resultIds).toContain(activeOrg.id)
      expect(resultIds).toContain(sharedOrg.id) // Shared org is active
      expect(resultIds).not.toContain(deletedOrg.id) // Deleted org excluded

      // Cleanup
      await cleanupTestOrganizations([activeOrg.id, deletedOrg.id])
    })

    it('should include soft-deleted organizations when includeDeleted=true', async () => {
      // Arrange - Create and soft-delete an org
      const { org: deletedOrg } = await createTestOrganization({
        slug: 'test-org-deleted-include',
        status: 'CANCELLED',
      })
      await softDeleteOrganization(deletedOrg.id)

      // Act - List with includeDeleted=true
      const result = await listOrganizations(true)

      // Assert - Should include deleted org
      const deletedOrgInResult = result.find((o) => o.id === deletedOrg.id)
      expect(deletedOrgInResult).toBeDefined()
      expect(deletedOrgInResult?.deletedAt).not.toBeNull()

      // Cleanup
      await cleanupTestOrganizations([deletedOrg.id])
    })
  })

  // Mutation tests - Use per-test isolation
  describe('Mutation Operations', () => {
    let testOrg: Organization

    beforeEach(async () => {
      // Create fresh organization for each mutation test
      const { org } = await createTestOrganization({
        name: 'Test Mutation Org',
        slug: `test-org-mutation-${Date.now()}`,
        status: 'ACTIVE',
      })
      testOrg = org
    })

    afterEach(async () => {
      // Cleanup after each mutation test
      await cleanupTestOrganizations([testOrg.id])
    })

    describe('createOrganization', () => {
      it('should create organization with provided data and default status', async () => {
        // Act
        const result = await createOrganization({
          name: 'New Organization',
          slug: `new-org-${Date.now()}`,
        })

        // Assert - Verify organization created
        expect(result).toBeDefined()
        expect(result.name).toBe('New Organization')
        expect(result.status).toBe('ACTIVE') // Default from DAL
        expect(result.deletedAt).toBeNull()

        // Verify persistence - Re-fetch from database
        const refetched = await getOrganizationById(result.id)
        expect(refetched?.name).toBe('New Organization')

        // Cleanup this extra org
        await cleanupTestOrganizations([result.id])
      })

      it('should create organization with custom status', async () => {
        // Act
        const result = await createOrganization({
          name: 'Trial Organization',
          slug: `trial-org-${Date.now()}`,
          status: 'TRIAL',
        })

        // Assert
        expect(result).toBeDefined()
        expect(result.status).toBe('TRIAL')

        // Verify persistence
        const refetched = await getOrganizationById(result.id)
        expect(refetched?.status).toBe('TRIAL')

        // Cleanup
        await cleanupTestOrganizations([result.id])
      })
    })

    describe('softDeleteOrganization', () => {
      it('should set deletedAt timestamp and persist to database', async () => {
        // Arrange - Verify org is not deleted initially
        expect(testOrg.deletedAt).toBeNull()

        // Act - Soft delete
        const result = await softDeleteOrganization(testOrg.id)

        // Assert - Verify deletedAt is set
        expect(result.deletedAt).not.toBeNull()
        expect(result.deletedAt).toBeInstanceOf(Date)

        // Verify persistence - Re-fetch from database
        const refetched = await getOrganizationById(testOrg.id)
        expect(refetched?.deletedAt).not.toBeNull()
        expect(refetched?.deletedAt).toBeInstanceOf(Date)
      })
    })

    describe('restoreOrganization', () => {
      it('should clear deletedAt timestamp and restore organization', async () => {
        // Arrange - Soft delete the org first
        await softDeleteOrganization(testOrg.id)
        const afterDelete = await getOrganizationById(testOrg.id)
        expect(afterDelete?.deletedAt).not.toBeNull()

        // Act - Restore the organization
        const result = await restoreOrganization(testOrg.id)

        // Assert - Verify deletedAt is cleared
        expect(result.deletedAt).toBeNull()

        // Verify persistence - Re-fetch from database
        const refetched = await getOrganizationById(testOrg.id)
        expect(refetched?.deletedAt).toBeNull()

        // Verify org appears in default list again
        const orgs = await listOrganizations()
        expect(orgs.map((o) => o.id)).toContain(testOrg.id)
      })
    })

    describe('updateOrganization', () => {
      it('should update organization fields and persist changes to database', async () => {
        // Arrange - Get initial state
        const initialName = testOrg.name
        const initialStatus = testOrg.status

        // Act - Update organization
        const result = await updateOrganization(testOrg.id, {
          name: 'Updated Organization Name',
          status: 'SUSPENDED',
        })

        // Assert - Verify update
        expect(result.name).toBe('Updated Organization Name')
        expect(result.name).not.toBe(initialName)
        expect(result.status).toBe('SUSPENDED')
        expect(result.status).not.toBe(initialStatus)

        // Verify persistence - Re-fetch from database
        const refetched = await getOrganizationById(testOrg.id)
        expect(refetched?.name).toBe('Updated Organization Name')
        expect(refetched?.status).toBe('SUSPENDED')
      })
    })
  })

  // Edge case: Verify slug uniqueness constraint
  describe('Database Constraints', () => {
    it('should enforce unique slug constraint', async () => {
      // Arrange - Create org with specific slug
      const uniqueSlug = `unique-slug-${Date.now()}`
      const { org } = await createTestOrganization({ slug: uniqueSlug })

      // Act & Assert - Attempt to create org with same slug should fail
      await expect(
        prisma.organization.create({
          data: {
            name: 'Duplicate Slug Org',
            slug: uniqueSlug,
            status: 'ACTIVE',
          },
        })
      ).rejects.toThrow()

      // Cleanup
      await cleanupTestOrganizations([org.id])
    })
  })
})
