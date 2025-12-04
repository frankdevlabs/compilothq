import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { DataProcessingActivity, Organization } from '../../../src/index'
import { prisma } from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils/factories'

/**
 * DataProcessingActivity Junction Tables - Integration Tests
 *
 * Tests the junction table models linking DataProcessingActivity to:
 * - Purpose (DataProcessingActivityPurpose)
 * - DataSubjectCategory (DataProcessingActivityDataSubject)
 * - DataCategory (DataProcessingActivityDataCategory)
 * - Recipient (DataProcessingActivityRecipient)
 *
 * Coverage:
 * - Schema structure and constraints
 * - Unique constraints prevent duplicate relationships
 * - Bidirectional FK relationships work correctly
 * - Cascade deletion on activity side
 * - Restrict deletion on component side
 */
describe('DataProcessingActivity Junction Tables - Schema Tests', () => {
  let testOrg1: Organization
  let testOrg2: Organization
  let testActivity: DataProcessingActivity
  let testPurposeId: string
  let testDataSubjectId: string
  let testDataCategoryId: string
  let testRecipientId: string

  beforeAll(async () => {
    // Create test organizations
    const { org: org1 } = await createTestOrganization({
      slug: `dpa-junction-test-org-1-${Date.now()}`,
      userCount: 0,
    })
    const { org: org2 } = await createTestOrganization({
      slug: `dpa-junction-test-org-2-${Date.now()}`,
      userCount: 0,
    })
    testOrg1 = org1
    testOrg2 = org2

    // Create test DataProcessingActivity
    testActivity = await prisma.dataProcessingActivity.create({
      data: {
        name: `Test Activity ${Date.now()}`,
        description: 'Test activity for junction tests',
        organizationId: testOrg1.id,
        status: 'DRAFT',
      },
    })

    // Create test Purpose
    const testPurpose = await prisma.purpose.create({
      data: {
        name: `Test Purpose ${Date.now()}`,
        description: 'Test purpose for junction tests',
        category: 'PRODUCT_DELIVERY',
        scope: 'INTERNAL',
        organizationId: testOrg1.id,
      },
    })
    testPurposeId = testPurpose.id

    // Create test DataSubjectCategory
    const testDataSubject = await prisma.dataSubjectCategory.create({
      data: {
        code: `TEST_DS_${Date.now()}`,
        name: `Test Data Subject ${Date.now()}`,
        organizationId: testOrg1.id,
      },
    })
    testDataSubjectId = testDataSubject.id

    // Create test DataCategory
    const testDataCategory = await prisma.dataCategory.create({
      data: {
        name: `Test Data Category ${Date.now()}`,
        organizationId: testOrg1.id,
        sensitivity: 'INTERNAL',
        isSpecialCategory: false,
      },
    })
    testDataCategoryId = testDataCategory.id

    // Create test Recipient
    const testRecipient = await prisma.recipient.create({
      data: {
        name: `Test Recipient ${Date.now()}`,
        type: 'SERVICE_PROVIDER',
        organizationId: testOrg1.id,
      },
    })
    testRecipientId = testRecipient.id
  })

  afterAll(async () => {
    await cleanupTestOrganizations([testOrg1.id, testOrg2.id])
  })

  describe('Junction Table Structure', () => {
    it('should create DataProcessingActivityPurpose junction record', async () => {
      // Arrange & Act
      const junction = await prisma.dataProcessingActivityPurpose.create({
        data: {
          activityId: testActivity.id,
          purposeId: testPurposeId,
        },
      })

      // Assert
      expect(junction.id).toBeDefined()
      expect(junction.activityId).toBe(testActivity.id)
      expect(junction.purposeId).toBe(testPurposeId)
      expect(junction.createdAt).toBeInstanceOf(Date)
    })

    it('should create DataProcessingActivityDataSubject junction record', async () => {
      // Arrange & Act
      const junction = await prisma.dataProcessingActivityDataSubject.create({
        data: {
          activityId: testActivity.id,
          dataSubjectCategoryId: testDataSubjectId,
        },
      })

      // Assert
      expect(junction.id).toBeDefined()
      expect(junction.activityId).toBe(testActivity.id)
      expect(junction.dataSubjectCategoryId).toBe(testDataSubjectId)
      expect(junction.createdAt).toBeInstanceOf(Date)
    })

    it('should create DataProcessingActivityDataCategory junction record', async () => {
      // Arrange & Act
      const junction = await prisma.dataProcessingActivityDataCategory.create({
        data: {
          activityId: testActivity.id,
          dataCategoryId: testDataCategoryId,
        },
      })

      // Assert
      expect(junction.id).toBeDefined()
      expect(junction.activityId).toBe(testActivity.id)
      expect(junction.dataCategoryId).toBe(testDataCategoryId)
      expect(junction.createdAt).toBeInstanceOf(Date)
    })

    it('should create DataProcessingActivityRecipient junction record', async () => {
      // Arrange & Act
      const junction = await prisma.dataProcessingActivityRecipient.create({
        data: {
          activityId: testActivity.id,
          recipientId: testRecipientId,
        },
      })

      // Assert
      expect(junction.id).toBeDefined()
      expect(junction.activityId).toBe(testActivity.id)
      expect(junction.recipientId).toBe(testRecipientId)
      expect(junction.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('Unique Constraint Enforcement', () => {
    it('should prevent duplicate DataProcessingActivityPurpose relationships', async () => {
      // NOTE: First junction already created in "Junction Table Structure" tests
      // Act & Assert - Attempt duplicate should fail
      await expect(
        prisma.dataProcessingActivityPurpose.create({
          data: {
            activityId: testActivity.id,
            purposeId: testPurposeId,
          },
        })
      ).rejects.toThrow(/unique constraint/i)
    })

    it('should prevent duplicate DataProcessingActivityDataCategory relationships', async () => {
      // NOTE: First junction already created in "Junction Table Structure" tests
      // Act & Assert - Attempt duplicate should fail
      await expect(
        prisma.dataProcessingActivityDataCategory.create({
          data: {
            activityId: testActivity.id,
            dataCategoryId: testDataCategoryId,
          },
        })
      ).rejects.toThrow(/unique constraint/i)
    })
  })

  describe('Cascade Deletion Behavior', () => {
    it('should cascade delete junction records when activity is deleted', async () => {
      // Arrange - Create activity with linked components
      const activity = await prisma.dataProcessingActivity.create({
        data: {
          name: `Cascade Test Activity ${Date.now()}`,
          organizationId: testOrg1.id,
          status: 'DRAFT',
        },
      })

      await prisma.dataProcessingActivityPurpose.create({
        data: {
          activityId: activity.id,
          purposeId: testPurposeId,
        },
      })

      await prisma.dataProcessingActivityDataCategory.create({
        data: {
          activityId: activity.id,
          dataCategoryId: testDataCategoryId,
        },
      })

      // Act - Delete activity
      await prisma.dataProcessingActivity.delete({
        where: { id: activity.id },
      })

      // Assert - Junction records should be deleted
      const purposeJunctions = await prisma.dataProcessingActivityPurpose.findMany({
        where: { activityId: activity.id },
      })
      const dataCategoryJunctions = await prisma.dataProcessingActivityDataCategory.findMany({
        where: { activityId: activity.id },
      })

      expect(purposeJunctions).toHaveLength(0)
      expect(dataCategoryJunctions).toHaveLength(0)
    })
  })

  describe('Restrict Deletion Behavior', () => {
    it('should prevent deletion of Purpose when linked to activity', async () => {
      // Arrange - Create activity with linked purpose
      const activity = await prisma.dataProcessingActivity.create({
        data: {
          name: `Restrict Test Activity ${Date.now()}`,
          organizationId: testOrg1.id,
          status: 'DRAFT',
        },
      })

      const purpose = await prisma.purpose.create({
        data: {
          name: `Restrict Test Purpose ${Date.now()}`,
          category: 'ANALYTICS',
          scope: 'INTERNAL',
          organizationId: testOrg1.id,
        },
      })

      await prisma.dataProcessingActivityPurpose.create({
        data: {
          activityId: activity.id,
          purposeId: purpose.id,
        },
      })

      // Act & Assert - Should fail to delete purpose
      await expect(
        prisma.purpose.delete({
          where: { id: purpose.id },
        })
      ).rejects.toThrow(/foreign key constraint/i)

      // Cleanup - Remove junction then delete purpose
      await prisma.dataProcessingActivityPurpose.deleteMany({
        where: { purposeId: purpose.id },
      })
      await prisma.purpose.delete({
        where: { id: purpose.id },
      })
      await prisma.dataProcessingActivity.delete({
        where: { id: activity.id },
      })
    })

    it('should prevent deletion of DataCategory when linked to activity', async () => {
      // Arrange - Create activity with linked data category
      const activity = await prisma.dataProcessingActivity.create({
        data: {
          name: `Restrict Test Activity ${Date.now()}`,
          organizationId: testOrg1.id,
          status: 'DRAFT',
        },
      })

      const dataCategory = await prisma.dataCategory.create({
        data: {
          name: `Restrict Test DataCategory ${Date.now()}`,
          organizationId: testOrg1.id,
          sensitivity: 'CONFIDENTIAL',
          isSpecialCategory: false,
        },
      })

      await prisma.dataProcessingActivityDataCategory.create({
        data: {
          activityId: activity.id,
          dataCategoryId: dataCategory.id,
        },
      })

      // Act & Assert - Should fail to delete data category
      await expect(
        prisma.dataCategory.delete({
          where: { id: dataCategory.id },
        })
      ).rejects.toThrow(/foreign key constraint/i)

      // Cleanup
      await prisma.dataProcessingActivityDataCategory.deleteMany({
        where: { dataCategoryId: dataCategory.id },
      })
      await prisma.dataCategory.delete({
        where: { id: dataCategory.id },
      })
      await prisma.dataProcessingActivity.delete({
        where: { id: activity.id },
      })
    })
  })

  describe('Bidirectional Relationships', () => {
    it('should query activity with all related components via include', async () => {
      // Arrange - Create activity with all relationships
      const activity = await prisma.dataProcessingActivity.create({
        data: {
          name: `Relationships Test Activity ${Date.now()}`,
          organizationId: testOrg1.id,
          status: 'DRAFT',
        },
      })

      await prisma.dataProcessingActivityPurpose.create({
        data: { activityId: activity.id, purposeId: testPurposeId },
      })
      await prisma.dataProcessingActivityDataSubject.create({
        data: { activityId: activity.id, dataSubjectCategoryId: testDataSubjectId },
      })
      await prisma.dataProcessingActivityDataCategory.create({
        data: { activityId: activity.id, dataCategoryId: testDataCategoryId },
      })
      await prisma.dataProcessingActivityRecipient.create({
        data: { activityId: activity.id, recipientId: testRecipientId },
      })

      // Act - Query with all includes
      const result = await prisma.dataProcessingActivity.findUnique({
        where: { id: activity.id },
        include: {
          purposes: {
            include: {
              purpose: true,
            },
          },
          dataSubjects: {
            include: {
              dataSubjectCategory: true,
            },
          },
          dataCategories: {
            include: {
              dataCategory: true,
            },
          },
          recipients: {
            include: {
              recipient: true,
            },
          },
        },
      })

      // Assert - All relationships loaded
      expect(result).toBeDefined()
      expect(result?.purposes).toHaveLength(1)
      expect(result?.purposes[0]?.purpose.id).toBe(testPurposeId)
      expect(result?.dataSubjects).toHaveLength(1)
      expect(result?.dataSubjects[0]?.dataSubjectCategory.id).toBe(testDataSubjectId)
      expect(result?.dataCategories).toHaveLength(1)
      expect(result?.dataCategories[0]?.dataCategory.id).toBe(testDataCategoryId)
      expect(result?.recipients).toHaveLength(1)
      expect(result?.recipients[0]?.recipient.id).toBe(testRecipientId)

      // Cleanup
      await prisma.dataProcessingActivity.delete({
        where: { id: activity.id },
      })
    })
  })
})
