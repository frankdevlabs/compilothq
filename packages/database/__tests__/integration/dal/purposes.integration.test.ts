import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createPurpose,
  deletePurpose,
  getPurposeById,
  listPurposesByOrganization,
  updatePurpose,
} from '../../../src/dal/purposes'
import type { Organization } from '../../../src/index'
import { prisma, PurposeCategory, PurposeScope } from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils/factories'

/**
 * Purposes DAL - Integration Tests
 *
 * Tests purpose data access layer functions against a real test database.
 * Uses shared organizations for testing multi-tenancy isolation.
 *
 * Coverage goals:
 * - CRUD operations
 * - Multi-tenancy isolation
 * - Category and scope filtering
 * - Cascade delete behavior
 */
describe('Purposes DAL - Integration Tests', () => {
  // Shared test organizations
  let org1: Organization
  let org2: Organization

  beforeAll(async () => {
    // Create shared test organizations
    const { org: testOrg1 } = await createTestOrganization({
      slug: 'purposes-dal-org1',
      userCount: 1,
    })
    const { org: testOrg2 } = await createTestOrganization({
      slug: 'purposes-dal-org2',
      userCount: 1,
    })

    org1 = testOrg1
    org2 = testOrg2
  })

  afterAll(async () => {
    // Cleanup shared test data
    await cleanupTestOrganizations([org1.id, org2.id])
  })

  describe('createPurpose', () => {
    it('should create purpose with required fields', async () => {
      // Arrange
      const purposeData = {
        name: 'Marketing Communications',
        description: 'Email and SMS marketing campaigns',
        category: PurposeCategory.MARKETING,
        scope: PurposeScope.EXTERNAL,
        organizationId: org1.id,
      }

      // Act
      const result = await createPurpose(purposeData)

      // Assert
      expect(result).toBeDefined()
      expect(result.name).toBe(purposeData.name)
      expect(result.description).toBe(purposeData.description)
      expect(result.category).toBe(purposeData.category)
      expect(result.scope).toBe(purposeData.scope)
      expect(result.organizationId).toBe(org1.id)
      expect(result.isActive).toBe(true) // Default value
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('should create purpose with custom isActive status', async () => {
      // Act
      const result = await createPurpose({
        name: 'Inactive Purpose',
        category: PurposeCategory.OTHER,
        scope: PurposeScope.INTERNAL,
        organizationId: org1.id,
        isActive: false,
      })

      // Assert
      expect(result.isActive).toBe(false)
    })

    it('should create purpose without description (optional field)', async () => {
      // Act
      const result = await createPurpose({
        name: 'Purpose Without Description',
        category: PurposeCategory.ANALYTICS,
        scope: PurposeScope.INTERNAL,
        organizationId: org1.id,
      })

      // Assert
      expect(result.description).toBeNull()
    })
  })

  describe('listPurposesByOrganization', () => {
    it('should return only purposes for current organization', async () => {
      // Arrange - Create purposes for both orgs
      const org1Purpose = await createPurpose({
        name: 'Org1 Marketing',
        category: PurposeCategory.MARKETING,
        scope: PurposeScope.EXTERNAL,
        organizationId: org1.id,
      })

      await createPurpose({
        name: 'Org2 Marketing',
        category: PurposeCategory.MARKETING,
        scope: PurposeScope.EXTERNAL,
        organizationId: org2.id,
      })

      // Act - Query purposes for org1
      const result = await listPurposesByOrganization(org1.id)

      // Assert - Should only include org1 purposes
      expect(result.length).toBeGreaterThanOrEqual(1)
      expect(result.some((p) => p.id === org1Purpose.id)).toBe(true)
      expect(result.every((p) => p.organizationId === org1.id)).toBe(true)
    })

    it('should filter purposes by category', async () => {
      // Arrange - Create purposes with different categories
      await createPurpose({
        name: 'Marketing Purpose',
        category: PurposeCategory.MARKETING,
        scope: PurposeScope.EXTERNAL,
        organizationId: org1.id,
      })

      await createPurpose({
        name: 'Analytics Purpose',
        category: PurposeCategory.ANALYTICS,
        scope: PurposeScope.INTERNAL,
        organizationId: org1.id,
      })

      // Act - Query by marketing category
      const result = await listPurposesByOrganization(org1.id, {
        category: PurposeCategory.MARKETING,
      })

      // Assert
      expect(result.every((p) => p.category === PurposeCategory.MARKETING)).toBe(true)
    })

    it('should filter purposes by scope', async () => {
      // Arrange - Create purposes with different scopes
      await createPurpose({
        name: 'Internal Purpose',
        category: PurposeCategory.ANALYTICS,
        scope: PurposeScope.INTERNAL,
        organizationId: org1.id,
      })

      await createPurpose({
        name: 'External Purpose',
        category: PurposeCategory.MARKETING,
        scope: PurposeScope.EXTERNAL,
        organizationId: org1.id,
      })

      // Act - Query by internal scope
      const result = await listPurposesByOrganization(org1.id, {
        scope: PurposeScope.INTERNAL,
      })

      // Assert
      expect(result.every((p) => p.scope === PurposeScope.INTERNAL)).toBe(true)
    })

    it('should filter purposes by isActive status', async () => {
      // Arrange - Create active and inactive purposes
      await createPurpose({
        name: 'Active Purpose',
        category: PurposeCategory.ANALYTICS,
        scope: PurposeScope.INTERNAL,
        organizationId: org1.id,
        isActive: true,
      })

      await createPurpose({
        name: 'Inactive Purpose',
        category: PurposeCategory.ANALYTICS,
        scope: PurposeScope.INTERNAL,
        organizationId: org1.id,
        isActive: false,
      })

      // Act - Query only active purposes
      const result = await listPurposesByOrganization(org1.id, {
        isActive: true,
      })

      // Assert
      expect(result.every((p) => p.isActive === true)).toBe(true)
    })

    it('should return purposes ordered by name', async () => {
      // Arrange - Create purposes with different names
      await createPurpose({
        name: 'Zebra Purpose',
        category: PurposeCategory.OTHER,
        scope: PurposeScope.INTERNAL,
        organizationId: org2.id,
      })

      await createPurpose({
        name: 'Alpha Purpose',
        category: PurposeCategory.OTHER,
        scope: PurposeScope.INTERNAL,
        organizationId: org2.id,
      })

      await createPurpose({
        name: 'Beta Purpose',
        category: PurposeCategory.OTHER,
        scope: PurposeScope.INTERNAL,
        organizationId: org2.id,
      })

      // Act
      const result = await listPurposesByOrganization(org2.id)

      // Assert - Should be ordered alphabetically by name
      const names = result.map((p) => p.name)
      const sortedNames = [...names].sort()
      expect(names).toEqual(sortedNames)
    })
  })

  describe('getPurposeById', () => {
    it('should retrieve purpose by ID', async () => {
      // Arrange
      const purpose = await createPurpose({
        name: 'Test Purpose',
        category: PurposeCategory.CUSTOMER_SERVICE,
        scope: PurposeScope.BOTH,
        organizationId: org1.id,
      })

      // Act
      const result = await getPurposeById(purpose.id)

      // Assert
      expect(result).not.toBeNull()
      expect(result?.id).toBe(purpose.id)
      expect(result?.name).toBe('Test Purpose')
    })

    it('should return null for non-existent purpose ID', async () => {
      // Act
      const result = await getPurposeById('non-existent-id')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('updatePurpose', () => {
    it('should update purpose name and description', async () => {
      // Arrange
      const purpose = await createPurpose({
        name: 'Original Name',
        description: 'Original description',
        category: PurposeCategory.ANALYTICS,
        scope: PurposeScope.INTERNAL,
        organizationId: org1.id,
      })

      // Act
      const result = await updatePurpose(purpose.id, {
        name: 'Updated Name',
        description: 'Updated description',
      })

      // Assert
      expect(result.name).toBe('Updated Name')
      expect(result.description).toBe('Updated description')
      expect(result.category).toBe(PurposeCategory.ANALYTICS) // Unchanged
    })

    it('should update purpose category and scope', async () => {
      // Arrange
      const purpose = await createPurpose({
        name: 'Test Purpose',
        category: PurposeCategory.OTHER,
        scope: PurposeScope.INTERNAL,
        organizationId: org1.id,
      })

      // Act
      const result = await updatePurpose(purpose.id, {
        category: PurposeCategory.MARKETING,
        scope: PurposeScope.EXTERNAL,
      })

      // Assert
      expect(result.category).toBe(PurposeCategory.MARKETING)
      expect(result.scope).toBe(PurposeScope.EXTERNAL)
    })

    it('should update isActive status', async () => {
      // Arrange
      const purpose = await createPurpose({
        name: 'Active Purpose',
        category: PurposeCategory.ANALYTICS,
        scope: PurposeScope.INTERNAL,
        organizationId: org1.id,
        isActive: true,
      })

      // Act
      const result = await updatePurpose(purpose.id, {
        isActive: false,
      })

      // Assert
      expect(result.isActive).toBe(false)
    })
  })

  describe('deletePurpose', () => {
    it('should delete purpose', async () => {
      // Arrange
      const purpose = await createPurpose({
        name: 'Purpose To Delete',
        category: PurposeCategory.OTHER,
        scope: PurposeScope.INTERNAL,
        organizationId: org1.id,
      })

      // Act
      await deletePurpose(purpose.id)

      // Assert - Purpose should no longer exist
      const result = await getPurposeById(purpose.id)
      expect(result).toBeNull()
    })
  })

  describe('Cascade delete behavior', () => {
    it('should delete all purposes when organization is deleted', async () => {
      // Arrange - Create a temporary organization with purposes
      const { org: tempOrg } = await createTestOrganization({
        slug: 'purposes-cascade-test',
        userCount: 0,
      })

      const purpose1 = await createPurpose({
        name: 'Purpose 1',
        category: PurposeCategory.MARKETING,
        scope: PurposeScope.EXTERNAL,
        organizationId: tempOrg.id,
      })

      const purpose2 = await createPurpose({
        name: 'Purpose 2',
        category: PurposeCategory.ANALYTICS,
        scope: PurposeScope.INTERNAL,
        organizationId: tempOrg.id,
      })

      // Act - Delete the organization
      await prisma.organization.delete({
        where: { id: tempOrg.id },
      })

      // Assert - Purposes should be cascade deleted
      const result1 = await getPurposeById(purpose1.id)
      const result2 = await getPurposeById(purpose2.id)
      expect(result1).toBeNull()
      expect(result2).toBeNull()
    })
  })
})
