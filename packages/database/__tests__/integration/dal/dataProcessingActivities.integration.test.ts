import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  countDataProcessingActivitiesByOrganization,
  createDataProcessingActivity,
  deleteDataProcessingActivity,
  getDataProcessingActivityById,
  getDataProcessingActivityByIdForOrg,
  listDataProcessingActivitiesByOrganization,
  updateDataProcessingActivity,
} from '../../../src/dal/dataProcessingActivities'
import type { Organization, User } from '../../../src/index'
import { prisma } from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils/factories'

/**
 * DataProcessingActivities DAL - Integration Tests
 *
 * Tests data processing activity data access layer functions against a real test database.
 * Uses shared organizations for testing multi-tenancy isolation.
 *
 * Coverage goals:
 * - CRUD operations with new fields (risk, DPIA, owners, retention, review)
 * - Multi-tenancy isolation
 * - Status and filter queries
 * - Cursor-based pagination
 * - Organization-level access control
 * - Nullable field clearing behavior
 */
describe('DataProcessingActivities DAL - Integration Tests', () => {
  // Shared test organizations and users
  let org1: Organization
  let org2: Organization
  let org1User1: User
  let org1User2: User

  beforeAll(async () => {
    // Create shared test organizations with users
    const { org: testOrg1, users: org1Users } = await createTestOrganization({
      slug: 'dpa-dal-org1',
      userCount: 2,
    })
    const { org: testOrg2 } = await createTestOrganization({
      slug: 'dpa-dal-org2',
      userCount: 1,
    })

    org1 = testOrg1
    org2 = testOrg2
    org1User1 = org1Users[0]!
    org1User2 = org1Users[1]!
  })

  afterAll(async () => {
    // Cleanup shared test data
    await cleanupTestOrganizations([org1.id, org2.id])
  })

  describe('createDataProcessingActivity', () => {
    it('should create activity with required fields and new optional fields', async () => {
      // Arrange
      const activityData = {
        name: 'Customer Data Processing',
        description: 'Processing customer personal data for order fulfillment',
        organizationId: org1.id,
        riskLevel: 'HIGH' as const,
        requiresDPIA: true,
        dpiaStatus: 'IN_PROGRESS' as const,
        businessOwnerId: org1User1.id,
        processingOwnerId: org1User2.id,
        retentionPeriodValue: 7,
        retentionPeriodUnit: 'YEARS' as const,
        retentionJustification: 'Legal requirement for tax records',
        reviewFrequencyMonths: 12,
      }

      // Act
      const result = await createDataProcessingActivity(activityData)

      // Assert
      expect(result).toBeDefined()
      expect(result.name).toBe(activityData.name)
      expect(result.description).toBe(activityData.description)
      expect(result.organizationId).toBe(org1.id)
      expect(result.status).toBe('DRAFT') // Default status
      expect(result.riskLevel).toBe('HIGH')
      expect(result.requiresDPIA).toBe(true)
      expect(result.dpiaStatus).toBe('IN_PROGRESS')
      expect(result.businessOwnerId).toBe(org1User1.id)
      expect(result.processingOwnerId).toBe(org1User2.id)
      expect(result.retentionPeriodValue).toBe(7)
      expect(result.retentionPeriodUnit).toBe('YEARS')
      expect(result.retentionJustification).toBe(activityData.retentionJustification)
      expect(result.reviewFrequencyMonths).toBe(12)
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('should create activity with custom status', async () => {
      // Act
      const result = await createDataProcessingActivity({
        name: 'Active Processing Activity',
        organizationId: org1.id,
        status: 'ACTIVE',
      })

      // Assert
      expect(result.status).toBe('ACTIVE')
    })

    it('should create activity with metadata', async () => {
      // Act
      const result = await createDataProcessingActivity({
        name: 'Activity with Metadata',
        organizationId: org1.id,
        metadata: { customField: 'value', tags: ['important', 'financial'] },
      })

      // Assert
      expect(result.metadata).toEqual({ customField: 'value', tags: ['important', 'financial'] })
    })
  })

  describe('getDataProcessingActivityById', () => {
    it('should retrieve activity by ID or return null', async () => {
      // Arrange
      const activity = await createDataProcessingActivity({
        name: 'Test Activity',
        description: 'Test description',
        organizationId: org1.id,
        riskLevel: 'MEDIUM',
      })

      // Act - Found
      const result = await getDataProcessingActivityById(activity.id)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(activity.id)
      expect(result?.name).toBe('Test Activity')
      expect(result?.description).toBe('Test description')
      expect(result?.riskLevel).toBe('MEDIUM')

      // Act - Not found
      const notFound = await getDataProcessingActivityById('non-existent-id')

      // Assert
      expect(notFound).toBeNull()
    })
  })

  describe('getDataProcessingActivityByIdForOrg', () => {
    it('should enforce organization ownership', async () => {
      // Arrange - Create activity for org1
      const org1Activity = await createDataProcessingActivity({
        name: 'Org1 Activity',
        organizationId: org1.id,
      })

      // Act - Correct org
      const result = await getDataProcessingActivityByIdForOrg(org1Activity.id, org1.id)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(org1Activity.id)

      // Act - Wrong org (org2 trying to access org1's activity)
      const wrongOrgResult = await getDataProcessingActivityByIdForOrg(org1Activity.id, org2.id)

      // Assert - Should return null for wrong organization
      expect(wrongOrgResult).toBeNull()
    })
  })

  describe('listDataProcessingActivitiesByOrganization', () => {
    it('should list activities with pagination and filters', async () => {
      // Arrange - Create activities with different properties
      const draftActivity = await createDataProcessingActivity({
        name: 'Draft Activity',
        organizationId: org1.id,
        status: 'DRAFT',
        riskLevel: 'LOW',
        requiresDPIA: false,
      })

      const activeHighRisk = await createDataProcessingActivity({
        name: 'Active High Risk',
        organizationId: org1.id,
        status: 'ACTIVE',
        riskLevel: 'HIGH',
        requiresDPIA: true,
        dpiaStatus: 'APPROVED',
      })

      const underReview = await createDataProcessingActivity({
        name: 'Under Review',
        organizationId: org1.id,
        status: 'UNDER_REVIEW',
        riskLevel: 'MEDIUM',
        requiresDPIA: true,
        dpiaStatus: 'IN_PROGRESS',
        businessOwnerId: org1User1.id,
      })

      // Create activity for org2 (should not appear in org1 results)
      await createDataProcessingActivity({
        name: 'Org2 Activity',
        organizationId: org2.id,
      })

      // Act & Assert - No filters (all org1 activities)
      const allOrg1 = await listDataProcessingActivitiesByOrganization(org1.id)
      expect(allOrg1.items.length).toBeGreaterThanOrEqual(3)
      expect(allOrg1.items.every((a) => a.organizationId === org1.id)).toBe(true)

      // Act & Assert - Filter by status
      const draftOnly = await listDataProcessingActivitiesByOrganization(org1.id, {
        status: 'DRAFT',
      })
      expect(draftOnly.items.every((a) => a.status === 'DRAFT')).toBe(true)
      expect(draftOnly.items.some((a) => a.id === draftActivity.id)).toBe(true)

      // Act & Assert - Filter by riskLevel
      const highRiskOnly = await listDataProcessingActivitiesByOrganization(org1.id, {
        riskLevel: 'HIGH',
      })
      expect(highRiskOnly.items.every((a) => a.riskLevel === 'HIGH')).toBe(true)
      expect(highRiskOnly.items.some((a) => a.id === activeHighRisk.id)).toBe(true)

      // Act & Assert - Filter by requiresDPIA
      const dpiaRequired = await listDataProcessingActivitiesByOrganization(org1.id, {
        requiresDPIA: true,
      })
      expect(dpiaRequired.items.every((a) => a.requiresDPIA === true)).toBe(true)
      expect(dpiaRequired.items.some((a) => a.id === activeHighRisk.id)).toBe(true)
      expect(dpiaRequired.items.some((a) => a.id === draftActivity.id)).toBe(false)

      // Act & Assert - Filter by dpiaStatus
      const dpiaApproved = await listDataProcessingActivitiesByOrganization(org1.id, {
        dpiaStatus: 'APPROVED',
      })
      expect(dpiaApproved.items.every((a) => a.dpiaStatus === 'APPROVED')).toBe(true)
      expect(dpiaApproved.items.some((a) => a.id === activeHighRisk.id)).toBe(true)

      // Act & Assert - Filter by businessOwnerId
      const ownedByUser1 = await listDataProcessingActivitiesByOrganization(org1.id, {
        businessOwnerId: org1User1.id,
      })
      expect(ownedByUser1.items.every((a) => a.businessOwnerId === org1User1.id)).toBe(true)
      expect(ownedByUser1.items.some((a) => a.id === underReview.id)).toBe(true)

      // Act & Assert - Pagination with limit
      const limited = await listDataProcessingActivitiesByOrganization(org1.id, {
        limit: 2,
      })
      expect(limited.items.length).toBe(2)
      expect(limited.nextCursor).toBeDefined()

      // Act & Assert - Cursor pagination
      const secondPage = await listDataProcessingActivitiesByOrganization(org1.id, {
        limit: 2,
        cursor: limited.nextCursor!,
      })
      expect(secondPage.items.length).toBeGreaterThan(0)
      // Items should be different from first page
      expect(secondPage.items.some((a) => limited.items.some((b) => b.id === a.id))).toBe(false)
    })

    it('should filter by dueBefore for review scheduling', async () => {
      // Arrange
      const today = new Date()
      const pastDue = new Date(today)
      pastDue.setDate(today.getDate() - 10) // 10 days ago

      const upcomingDue = new Date(today)
      upcomingDue.setDate(today.getDate() + 10) // 10 days from now

      const farFuture = new Date(today)
      farFuture.setDate(today.getDate() + 60) // 60 days from now

      await createDataProcessingActivity({
        name: 'Past Due Activity',
        organizationId: org1.id,
        nextReviewDate: pastDue,
      })

      await createDataProcessingActivity({
        name: 'Upcoming Due Activity',
        organizationId: org1.id,
        nextReviewDate: upcomingDue,
      })

      await createDataProcessingActivity({
        name: 'Far Future Activity',
        organizationId: org1.id,
        nextReviewDate: farFuture,
      })

      // Act - Filter activities due within next 30 days
      const thirtyDaysFromNow = new Date(today)
      thirtyDaysFromNow.setDate(today.getDate() + 30)

      const dueWithinThirtyDays = await listDataProcessingActivitiesByOrganization(org1.id, {
        dueBefore: thirtyDaysFromNow,
      })

      // Assert - Should include past due and upcoming, but not far future
      expect(
        dueWithinThirtyDays.items.every(
          (a) => a.nextReviewDate === null || a.nextReviewDate <= thirtyDaysFromNow
        )
      ).toBe(true)
    })
  })

  describe('updateDataProcessingActivity', () => {
    it('should update activity including nullable field clearing', async () => {
      // Arrange - Create activity with all optional fields populated
      const activity = await createDataProcessingActivity({
        name: 'Original Name',
        description: 'Original description',
        organizationId: org1.id,
        status: 'DRAFT',
        riskLevel: 'HIGH',
        requiresDPIA: true,
        dpiaStatus: 'IN_PROGRESS',
        businessOwnerId: org1User1.id,
        processingOwnerId: org1User2.id,
        retentionPeriodValue: 5,
        retentionPeriodUnit: 'YEARS',
        retentionJustification: 'Original justification',
        lastReviewedAt: new Date(),
        nextReviewDate: new Date(),
        reviewFrequencyMonths: 12,
      })

      // Act - Update with new values
      const updated = await updateDataProcessingActivity(activity.id, {
        name: 'Updated Name',
        description: 'Updated description',
        status: 'ACTIVE',
        riskLevel: 'MEDIUM',
      })

      // Assert - Values updated
      expect(updated.id).toBe(activity.id)
      expect(updated.name).toBe('Updated Name')
      expect(updated.description).toBe('Updated description')
      expect(updated.status).toBe('ACTIVE')
      expect(updated.riskLevel).toBe('MEDIUM')
      expect(updated.updatedAt.getTime()).toBeGreaterThan(activity.updatedAt.getTime())

      // Act - Clear nullable fields explicitly with null
      const cleared = await updateDataProcessingActivity(activity.id, {
        riskLevel: null,
        requiresDPIA: null,
        dpiaStatus: null,
        businessOwnerId: null,
        processingOwnerId: null,
        retentionPeriodValue: null,
        retentionPeriodUnit: null,
        retentionJustification: null,
        lastReviewedAt: null,
        nextReviewDate: null,
        reviewFrequencyMonths: null,
      })

      // Assert - Nullable fields cleared
      expect(cleared.riskLevel).toBeNull()
      expect(cleared.requiresDPIA).toBeNull()
      expect(cleared.dpiaStatus).toBeNull()
      expect(cleared.businessOwnerId).toBeNull()
      expect(cleared.processingOwnerId).toBeNull()
      expect(cleared.retentionPeriodValue).toBeNull()
      expect(cleared.retentionPeriodUnit).toBeNull()
      expect(cleared.retentionJustification).toBeNull()
      expect(cleared.lastReviewedAt).toBeNull()
      expect(cleared.nextReviewDate).toBeNull()
      expect(cleared.reviewFrequencyMonths).toBeNull()
    })
  })

  describe('deleteDataProcessingActivity', () => {
    it('should delete activity', async () => {
      // Arrange
      const activity = await createDataProcessingActivity({
        name: 'Activity to Delete',
        organizationId: org1.id,
      })

      // Act
      const result = await deleteDataProcessingActivity(activity.id)

      // Assert
      expect(result.id).toBe(activity.id)

      // Verify activity is deleted
      const deletedActivity = await getDataProcessingActivityById(activity.id)
      expect(deletedActivity).toBeNull()
    })
  })

  describe('countDataProcessingActivitiesByOrganization', () => {
    it('should count activities with filters', async () => {
      // Create a fresh org for counting to avoid interference from other tests
      const { org: countOrg } = await createTestOrganization({
        slug: `dpa-count-org-${Date.now()}`,
        userCount: 0,
      })

      try {
        // Arrange - Create activities with known counts
        await createDataProcessingActivity({
          name: 'Draft 1',
          organizationId: countOrg.id,
          status: 'DRAFT',
          requiresDPIA: false,
        })

        await createDataProcessingActivity({
          name: 'Draft 2',
          organizationId: countOrg.id,
          status: 'DRAFT',
          requiresDPIA: true,
        })

        await createDataProcessingActivity({
          name: 'Active 1',
          organizationId: countOrg.id,
          status: 'ACTIVE',
          requiresDPIA: true,
        })

        // Act & Assert - Count all
        const totalCount = await countDataProcessingActivitiesByOrganization(countOrg.id)
        expect(totalCount).toBe(3)

        // Act & Assert - Count by status
        const draftCount = await countDataProcessingActivitiesByOrganization(countOrg.id, {
          status: 'DRAFT',
        })
        expect(draftCount).toBe(2)

        const activeCount = await countDataProcessingActivitiesByOrganization(countOrg.id, {
          status: 'ACTIVE',
        })
        expect(activeCount).toBe(1)

        // Act & Assert - Count by requiresDPIA
        const dpiaRequiredCount = await countDataProcessingActivitiesByOrganization(countOrg.id, {
          requiresDPIA: true,
        })
        expect(dpiaRequiredCount).toBe(2)

        const dpiaNotRequiredCount = await countDataProcessingActivitiesByOrganization(
          countOrg.id,
          { requiresDPIA: false }
        )
        expect(dpiaNotRequiredCount).toBe(1)

        // Act & Assert - Count by both status and requiresDPIA
        const draftWithDpia = await countDataProcessingActivitiesByOrganization(countOrg.id, {
          status: 'DRAFT',
          requiresDPIA: true,
        })
        expect(draftWithDpia).toBe(1)
      } finally {
        // Cleanup
        await cleanupTestOrganizations([countOrg.id])
      }
    })
  })

  describe('multi-tenancy isolation', () => {
    it('should not expose org1 activities to org2', async () => {
      // Arrange - Create activity for org1
      const org1Activity = await createDataProcessingActivity({
        name: 'Org1 Secret Activity',
        organizationId: org1.id,
        riskLevel: 'CRITICAL',
      })

      // Act - List org2 activities
      const org2Activities = await listDataProcessingActivitiesByOrganization(org2.id)

      // Assert - org1 activity should not be in org2 list
      expect(org2Activities.items.every((activity) => activity.organizationId === org2.id)).toBe(
        true
      )
      expect(org2Activities.items.some((activity) => activity.id === org1Activity.id)).toBe(false)

      // Act - Try to get org1 activity using org2's organizationId
      const crossOrgAccess = await getDataProcessingActivityByIdForOrg(org1Activity.id, org2.id)

      // Assert - Should return null (access denied)
      expect(crossOrgAccess).toBeNull()
    })
  })

  describe('owner foreign key cascade behavior', () => {
    it('should set owner fields to null when user is deleted (onDelete: SetNull)', async () => {
      // Arrange - Create a temporary user for this test
      const { org: tempOrg, users: tempUsers } = await createTestOrganization({
        slug: `dpa-cascade-org-${Date.now()}`,
        userCount: 2,
      })

      try {
        const businessOwner = tempUsers[0]!
        const processingOwner = tempUsers[1]!

        // Create activity with both owners
        const activity = await createDataProcessingActivity({
          name: 'Activity with Owners',
          organizationId: tempOrg.id,
          businessOwnerId: businessOwner.id,
          processingOwnerId: processingOwner.id,
        })

        // Verify owners are set
        expect(activity.businessOwnerId).toBe(businessOwner.id)
        expect(activity.processingOwnerId).toBe(processingOwner.id)

        // Act - Delete businessOwner user
        await prisma.user.delete({ where: { id: businessOwner.id } })

        // Assert - businessOwnerId should be set to null (cascade behavior)
        const afterBusinessOwnerDelete = await getDataProcessingActivityById(activity.id)
        expect(afterBusinessOwnerDelete?.businessOwnerId).toBeNull()
        expect(afterBusinessOwnerDelete?.processingOwnerId).toBe(processingOwner.id) // Still set

        // Act - Delete processingOwner user
        await prisma.user.delete({ where: { id: processingOwner.id } })

        // Assert - processingOwnerId should be set to null (cascade behavior)
        const afterProcessingOwnerDelete = await getDataProcessingActivityById(activity.id)
        expect(afterProcessingOwnerDelete?.businessOwnerId).toBeNull()
        expect(afterProcessingOwnerDelete?.processingOwnerId).toBeNull()

        // Activity itself should still exist
        expect(afterProcessingOwnerDelete).toBeDefined()
        expect(afterProcessingOwnerDelete?.name).toBe('Activity with Owners')
      } finally {
        // Cleanup
        await cleanupTestOrganizations([tempOrg.id])
      }
    })
  })
})
