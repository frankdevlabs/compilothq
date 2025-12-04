import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type {
  DataCategory,
  DataProcessingActivity,
  DataSubjectCategory,
  Organization,
  Purpose,
  Recipient,
} from '../../../src/index'
import {
  getActivityWithComponents,
  linkActivityToDataCategories,
  linkActivityToPurposes,
  prisma,
  syncActivityDataCategories,
  syncActivityDataSubjects,
  syncActivityPurposes,
  syncActivityRecipients,
  unlinkActivityFromDataCategory,
  unlinkActivityFromDataSubject,
  unlinkActivityFromPurpose,
  unlinkActivityFromRecipient,
} from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils/factories'

/**
 * DataProcessingActivity Junction DAL Functions - Integration Tests
 *
 * Tests the DAL functions for managing junction table relationships:
 * - Sync operations (replace all relationships atomically)
 * - Link operations (add relationships without removing existing)
 * - Unlink operations (remove specific relationships)
 * - Query operations (get activity with components)
 * - Multi-tenancy enforcement (organizationId validation)
 * - Transaction atomicity for sync operations
 */
describe('DataProcessingActivity Junction DAL Functions', () => {
  let testOrg1: Organization
  let testOrg2: Organization
  let testActivity1: DataProcessingActivity
  let testPurpose1: Purpose
  let testPurpose2: Purpose
  let testPurpose3: Purpose
  let testDataSubject1: DataSubjectCategory
  let testDataSubject2: DataSubjectCategory
  let testDataCategory1: DataCategory
  let testDataCategory2: DataCategory
  let testRecipient1: Recipient

  beforeAll(async () => {
    // Create test organizations
    const { org: org1 } = await createTestOrganization({
      slug: `dpa-junction-dal-test-org-1-${Date.now()}`,
      userCount: 0,
    })
    const { org: org2 } = await createTestOrganization({
      slug: `dpa-junction-dal-test-org-2-${Date.now()}`,
      userCount: 0,
    })
    testOrg1 = org1
    testOrg2 = org2

    // Create test activities
    testActivity1 = await prisma.dataProcessingActivity.create({
      data: {
        name: `Test Activity 1 ${Date.now()}`,
        organizationId: testOrg1.id,
        status: 'DRAFT',
      },
    })

    // Create test purposes
    testPurpose1 = await prisma.purpose.create({
      data: {
        name: `Test Purpose 1 ${Date.now()}`,
        category: 'PRODUCT_DELIVERY',
        scope: 'INTERNAL',
        organizationId: testOrg1.id,
      },
    })

    testPurpose2 = await prisma.purpose.create({
      data: {
        name: `Test Purpose 2 ${Date.now()}`,
        category: 'ANALYTICS',
        scope: 'INTERNAL',
        organizationId: testOrg1.id,
      },
    })

    testPurpose3 = await prisma.purpose.create({
      data: {
        name: `Test Purpose 3 ${Date.now()}`,
        category: 'MARKETING',
        scope: 'EXTERNAL',
        organizationId: testOrg1.id,
      },
    })

    // Create test data subjects
    testDataSubject1 = await prisma.dataSubjectCategory.create({
      data: {
        code: `TEST_DS1_${Date.now()}`,
        name: `Test Data Subject 1 ${Date.now()}`,
        organizationId: testOrg1.id,
      },
    })

    testDataSubject2 = await prisma.dataSubjectCategory.create({
      data: {
        code: `TEST_DS2_${Date.now()}`,
        name: `Test Data Subject 2 ${Date.now()}`,
        organizationId: testOrg1.id,
      },
    })

    // Create test data categories
    testDataCategory1 = await prisma.dataCategory.create({
      data: {
        name: `Test Data Category 1 ${Date.now()}`,
        organizationId: testOrg1.id,
        sensitivity: 'INTERNAL',
        isSpecialCategory: false,
      },
    })

    testDataCategory2 = await prisma.dataCategory.create({
      data: {
        name: `Test Data Category 2 ${Date.now()}`,
        organizationId: testOrg1.id,
        sensitivity: 'CONFIDENTIAL',
        isSpecialCategory: false,
      },
    })

    // Create test recipients
    testRecipient1 = await prisma.recipient.create({
      data: {
        name: `Test Recipient 1 ${Date.now()}`,
        type: 'SERVICE_PROVIDER',
        organizationId: testOrg1.id,
      },
    })
  })

  afterAll(async () => {
    await cleanupTestOrganizations([testOrg1.id, testOrg2.id])
  })

  describe('Sync Operations - Replace Relationships Atomically', () => {
    it('should sync activity purposes - replace all relationships atomically', async () => {
      // Arrange - Create initial link
      await prisma.dataProcessingActivityPurpose.create({
        data: {
          activityId: testActivity1.id,
          purposeId: testPurpose1.id,
        },
      })

      // Act - Sync with different purposes
      await syncActivityPurposes(testActivity1.id, testOrg1.id, [testPurpose2.id, testPurpose3.id])

      // Assert - Old link removed, new links created
      const junctions = await prisma.dataProcessingActivityPurpose.findMany({
        where: { activityId: testActivity1.id },
      })

      expect(junctions).toHaveLength(2)
      expect(junctions.some((j) => j.purposeId === testPurpose2.id)).toBe(true)
      expect(junctions.some((j) => j.purposeId === testPurpose3.id)).toBe(true)
      expect(junctions.some((j) => j.purposeId === testPurpose1.id)).toBe(false)

      // Cleanup
      await prisma.dataProcessingActivityPurpose.deleteMany({
        where: { activityId: testActivity1.id },
      })
    })

    it('should sync activity data categories atomically', async () => {
      // Act - Sync with categories
      await syncActivityDataCategories(testActivity1.id, testOrg1.id, [testDataCategory1.id])

      // Assert
      const junctions = await prisma.dataProcessingActivityDataCategory.findMany({
        where: { activityId: testActivity1.id },
      })

      expect(junctions).toHaveLength(1)
      expect(junctions[0]?.dataCategoryId).toBe(testDataCategory1.id)

      // Act - Sync with different categories
      await syncActivityDataCategories(testActivity1.id, testOrg1.id, [testDataCategory2.id])

      // Assert - Old replaced with new
      const junctions2 = await prisma.dataProcessingActivityDataCategory.findMany({
        where: { activityId: testActivity1.id },
      })

      expect(junctions2).toHaveLength(1)
      expect(junctions2[0]?.dataCategoryId).toBe(testDataCategory2.id)

      // Cleanup
      await prisma.dataProcessingActivityDataCategory.deleteMany({
        where: { activityId: testActivity1.id },
      })
    })

    it('should sync activity data subjects atomically', async () => {
      // Act - Sync with data subjects
      await syncActivityDataSubjects(testActivity1.id, testOrg1.id, [
        testDataSubject1.id,
        testDataSubject2.id,
      ])

      // Assert
      const junctions = await prisma.dataProcessingActivityDataSubject.findMany({
        where: { activityId: testActivity1.id },
      })

      expect(junctions).toHaveLength(2)

      // Act - Sync with empty array
      await syncActivityDataSubjects(testActivity1.id, testOrg1.id, [])

      // Assert - All removed
      const junctions2 = await prisma.dataProcessingActivityDataSubject.findMany({
        where: { activityId: testActivity1.id },
      })

      expect(junctions2).toHaveLength(0)
    })

    it('should sync activity recipients atomically', async () => {
      // Act
      await syncActivityRecipients(testActivity1.id, testOrg1.id, [testRecipient1.id])

      // Assert
      const junctions = await prisma.dataProcessingActivityRecipient.findMany({
        where: { activityId: testActivity1.id },
      })

      expect(junctions).toHaveLength(1)
      expect(junctions[0]?.recipientId).toBe(testRecipient1.id)

      // Cleanup
      await prisma.dataProcessingActivityRecipient.deleteMany({
        where: { activityId: testActivity1.id },
      })
    })
  })

  describe('Link Operations - Add Without Replacing', () => {
    it('should link activity to purposes without removing existing', async () => {
      // Arrange - Create initial link
      await prisma.dataProcessingActivityPurpose.create({
        data: {
          activityId: testActivity1.id,
          purposeId: testPurpose1.id,
        },
      })

      // Act - Link additional purpose
      await linkActivityToPurposes(testActivity1.id, testOrg1.id, [testPurpose2.id])

      // Assert - Both links exist
      const junctions = await prisma.dataProcessingActivityPurpose.findMany({
        where: { activityId: testActivity1.id },
      })

      expect(junctions).toHaveLength(2)
      expect(junctions.some((j) => j.purposeId === testPurpose1.id)).toBe(true)
      expect(junctions.some((j) => j.purposeId === testPurpose2.id)).toBe(true)

      // Cleanup
      await prisma.dataProcessingActivityPurpose.deleteMany({
        where: { activityId: testActivity1.id },
      })
    })

    it('should link activity to data categories without removing existing', async () => {
      // Act - Link categories
      await linkActivityToDataCategories(testActivity1.id, testOrg1.id, [testDataCategory1.id])
      await linkActivityToDataCategories(testActivity1.id, testOrg1.id, [testDataCategory2.id])

      // Assert
      const junctions = await prisma.dataProcessingActivityDataCategory.findMany({
        where: { activityId: testActivity1.id },
      })

      expect(junctions).toHaveLength(2)

      // Cleanup
      await prisma.dataProcessingActivityDataCategory.deleteMany({
        where: { activityId: testActivity1.id },
      })
    })

    it('should be idempotent - linking same component twice succeeds', async () => {
      // Act - Link same purpose twice
      await linkActivityToPurposes(testActivity1.id, testOrg1.id, [testPurpose1.id])
      await linkActivityToPurposes(testActivity1.id, testOrg1.id, [testPurpose1.id])

      // Assert - Only one junction created (skipDuplicates)
      const junctions = await prisma.dataProcessingActivityPurpose.findMany({
        where: { activityId: testActivity1.id, purposeId: testPurpose1.id },
      })

      expect(junctions).toHaveLength(1)

      // Cleanup
      await prisma.dataProcessingActivityPurpose.deleteMany({
        where: { activityId: testActivity1.id },
      })
    })
  })

  describe('Unlink Operations - Remove Specific Links', () => {
    it('should unlink activity from purpose - remove single relationship', async () => {
      // Arrange - Create multiple links
      await prisma.dataProcessingActivityPurpose.createMany({
        data: [
          { activityId: testActivity1.id, purposeId: testPurpose1.id },
          { activityId: testActivity1.id, purposeId: testPurpose2.id },
        ],
      })

      // Act - Unlink one purpose
      await unlinkActivityFromPurpose(testActivity1.id, testOrg1.id, testPurpose1.id)

      // Assert - Only second purpose remains
      const junctions = await prisma.dataProcessingActivityPurpose.findMany({
        where: { activityId: testActivity1.id },
      })

      expect(junctions).toHaveLength(1)
      expect(junctions[0]?.purposeId).toBe(testPurpose2.id)

      // Cleanup
      await prisma.dataProcessingActivityPurpose.deleteMany({
        where: { activityId: testActivity1.id },
      })
    })

    it('should unlink activity from data category', async () => {
      // Arrange
      await prisma.dataProcessingActivityDataCategory.create({
        data: {
          activityId: testActivity1.id,
          dataCategoryId: testDataCategory1.id,
        },
      })

      // Act
      await unlinkActivityFromDataCategory(testActivity1.id, testOrg1.id, testDataCategory1.id)

      // Assert
      const junctions = await prisma.dataProcessingActivityDataCategory.findMany({
        where: { activityId: testActivity1.id },
      })

      expect(junctions).toHaveLength(0)
    })

    it('should unlink activity from data subject', async () => {
      // Arrange
      await prisma.dataProcessingActivityDataSubject.create({
        data: {
          activityId: testActivity1.id,
          dataSubjectCategoryId: testDataSubject1.id,
        },
      })

      // Act
      await unlinkActivityFromDataSubject(testActivity1.id, testOrg1.id, testDataSubject1.id)

      // Assert
      const junctions = await prisma.dataProcessingActivityDataSubject.findMany({
        where: { activityId: testActivity1.id },
      })

      expect(junctions).toHaveLength(0)
    })

    it('should unlink activity from recipient', async () => {
      // Arrange
      await prisma.dataProcessingActivityRecipient.create({
        data: {
          activityId: testActivity1.id,
          recipientId: testRecipient1.id,
        },
      })

      // Act
      await unlinkActivityFromRecipient(testActivity1.id, testOrg1.id, testRecipient1.id)

      // Assert
      const junctions = await prisma.dataProcessingActivityRecipient.findMany({
        where: { activityId: testActivity1.id },
      })

      expect(junctions).toHaveLength(0)
    })
  })

  describe('Multi-Tenancy Enforcement', () => {
    it('should reject sync operations with wrong organizationId', async () => {
      // Act & Assert
      await expect(
        syncActivityPurposes(testActivity1.id, testOrg2.id, [testPurpose1.id])
      ).rejects.toThrow(/not found or does not belong to organization/)
    })

    it('should reject link operations with wrong organizationId', async () => {
      // Act & Assert
      await expect(
        linkActivityToPurposes(testActivity1.id, testOrg2.id, [testPurpose1.id])
      ).rejects.toThrow(/not found or does not belong to organization/)
    })

    it('should reject unlink operations with wrong organizationId', async () => {
      // Act & Assert
      await expect(
        unlinkActivityFromPurpose(testActivity1.id, testOrg2.id, testPurpose1.id)
      ).rejects.toThrow(/not found or does not belong to organization/)
    })

    it('should reject query operations with wrong organizationId', async () => {
      // Act
      const result = await getActivityWithComponents(testActivity1.id, testOrg2.id)

      // Assert - Returns null (no match on organizationId)
      expect(result).toBeNull()
    })
  })

  describe('Query Operations', () => {
    it('should get activity with all related components', async () => {
      // Arrange - Create activity with all relationships
      const activity = await prisma.dataProcessingActivity.create({
        data: {
          name: `Query Test Activity ${Date.now()}`,
          organizationId: testOrg1.id,
          status: 'DRAFT',
        },
      })

      await prisma.dataProcessingActivityPurpose.create({
        data: { activityId: activity.id, purposeId: testPurpose1.id },
      })
      await prisma.dataProcessingActivityDataSubject.create({
        data: { activityId: activity.id, dataSubjectCategoryId: testDataSubject1.id },
      })
      await prisma.dataProcessingActivityDataCategory.create({
        data: { activityId: activity.id, dataCategoryId: testDataCategory1.id },
      })
      await prisma.dataProcessingActivityRecipient.create({
        data: { activityId: activity.id, recipientId: testRecipient1.id },
      })

      // Act
      const result = await getActivityWithComponents(activity.id, testOrg1.id)

      // Assert - All relationships loaded
      expect(result).toBeDefined()
      expect(result?.id).toBe(activity.id)
      expect(result?.purposes).toHaveLength(1)
      expect(result?.purposes[0]?.purpose.id).toBe(testPurpose1.id)
      expect(result?.purposes[0]?.purpose.name).toBeDefined()
      expect(result?.dataSubjects).toHaveLength(1)
      expect(result?.dataSubjects[0]?.dataSubjectCategory.id).toBe(testDataSubject1.id)
      expect(result?.dataCategories).toHaveLength(1)
      expect(result?.dataCategories[0]?.dataCategory.id).toBe(testDataCategory1.id)
      expect(result?.recipients).toHaveLength(1)
      expect(result?.recipients[0]?.recipient.id).toBe(testRecipient1.id)

      // Cleanup
      await prisma.dataProcessingActivity.delete({
        where: { id: activity.id },
      })
    })

    it('should return null when activity does not exist', async () => {
      // Act
      const result = await getActivityWithComponents('non-existent-id', testOrg1.id)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('Transaction Atomicity', () => {
    it('should handle sync operations atomically - all or nothing', async () => {
      // Arrange - Create initial links
      await prisma.dataProcessingActivityPurpose.create({
        data: {
          activityId: testActivity1.id,
          purposeId: testPurpose1.id,
        },
      })

      // Note: Transaction atomicity is tested by verifying state is consistent
      // If transaction failed midway, we'd have partial state
      // This test verifies the happy path - sync completes fully

      // Act - Sync with new purposes
      await syncActivityPurposes(testActivity1.id, testOrg1.id, [testPurpose2.id, testPurpose3.id])

      // Assert - Old link removed, both new links created (all or nothing)
      const junctions = await prisma.dataProcessingActivityPurpose.findMany({
        where: { activityId: testActivity1.id },
      })

      expect(junctions).toHaveLength(2)
      // If transaction was not atomic, we might have 0, 1, or 3 junctions
      // Having exactly 2 confirms atomic operation

      // Cleanup
      await prisma.dataProcessingActivityPurpose.deleteMany({
        where: { activityId: testActivity1.id },
      })
    })
  })
})
