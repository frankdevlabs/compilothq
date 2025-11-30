import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createActivity,
  deleteActivity,
  getActivityById,
  listActivitiesByOrganization,
  updateActivity,
} from '../../../src/dal/activities'
import type { Organization } from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils/factories'

/**
 * Activities DAL - Integration Tests
 *
 * Tests activity data access layer functions against a real test database.
 * Uses shared organizations for testing multi-tenancy isolation.
 *
 * Coverage goals:
 * - CRUD operations
 * - Multi-tenancy isolation
 * - Status filtering
 * - Organization-level access control
 */
describe('Activities DAL - Integration Tests', () => {
  // Shared test organizations
  let org1: Organization
  let org2: Organization

  beforeAll(async () => {
    // Create shared test organizations
    const { org: testOrg1 } = await createTestOrganization({
      slug: 'activities-dal-org1',
      userCount: 1,
    })
    const { org: testOrg2 } = await createTestOrganization({
      slug: 'activities-dal-org2',
      userCount: 1,
    })

    org1 = testOrg1
    org2 = testOrg2
  })

  afterAll(async () => {
    // Cleanup shared test data
    await cleanupTestOrganizations([org1.id, org2.id])
  })

  describe('createActivity', () => {
    it('should create activity with required fields', async () => {
      // Arrange
      const activityData = {
        name: 'Customer Data Processing',
        description: 'Processing customer personal data for order fulfillment',
        organizationId: org1.id,
      }

      // Act
      const result = await createActivity(activityData)

      // Assert
      expect(result).toBeDefined()
      expect(result.name).toBe(activityData.name)
      expect(result.description).toBe(activityData.description)
      expect(result.organizationId).toBe(org1.id)
      expect(result.status).toBe('DRAFT') // Default status
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('should create activity with custom status', async () => {
      // Act
      const result = await createActivity({
        name: 'Active Processing Activity',
        organizationId: org1.id,
        status: 'ACTIVE',
      })

      // Assert
      expect(result.status).toBe('ACTIVE')
    })
  })

  describe('listActivitiesByOrganization', () => {
    it('should return only activities for current organization', async () => {
      // Arrange - Create activities for both orgs
      const org1Activity = await createActivity({
        name: 'Org1 Activity',
        organizationId: org1.id,
      })

      await createActivity({
        name: 'Org2 Activity',
        organizationId: org2.id,
      })

      // Act - List org1 activities
      const org1Activities = await listActivitiesByOrganization(org1.id)

      // Assert - Verify multi-tenancy isolation
      expect(org1Activities.length).toBeGreaterThanOrEqual(1)
      expect(org1Activities.every((activity) => activity.organizationId === org1.id)).toBe(true)
      expect(org1Activities.some((activity) => activity.id === org1Activity.id)).toBe(true)
    })

    it('should filter activities by status', async () => {
      // Arrange - Create activities with different statuses
      const draftActivity = await createActivity({
        name: 'Draft Activity',
        organizationId: org1.id,
        status: 'DRAFT',
      })

      const activeActivity = await createActivity({
        name: 'Active Activity',
        organizationId: org1.id,
        status: 'ACTIVE',
      })

      // Act - List only DRAFT activities
      const draftActivities = await listActivitiesByOrganization(org1.id, {
        status: 'DRAFT',
      })

      // Assert
      expect(draftActivities.every((activity) => activity.status === 'DRAFT')).toBe(true)
      expect(draftActivities.some((activity) => activity.id === draftActivity.id)).toBe(true)
      expect(draftActivities.some((activity) => activity.id === activeActivity.id)).toBe(false)
    })

    it('should limit results when limit option is specified', async () => {
      // Act
      const limitedActivities = await listActivitiesByOrganization(org1.id, { limit: 2 })

      // Assert
      expect(limitedActivities.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getActivityById', () => {
    it('should retrieve activity by ID', async () => {
      // Arrange
      const activity = await createActivity({
        name: 'Test Activity',
        description: 'Test description',
        organizationId: org1.id,
      })

      // Act
      const result = await getActivityById(activity.id)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(activity.id)
      expect(result?.name).toBe('Test Activity')
      expect(result?.description).toBe('Test description')
    })

    it('should return null when activity does not exist', async () => {
      // Act
      const result = await getActivityById('non-existent-id')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('updateActivity', () => {
    it('should update activity fields', async () => {
      // Arrange
      const activity = await createActivity({
        name: 'Original Name',
        description: 'Original description',
        organizationId: org1.id,
        status: 'DRAFT',
      })

      // Act
      const result = await updateActivity(activity.id, {
        name: 'Updated Name',
        description: 'Updated description',
        status: 'ACTIVE',
      })

      // Assert
      expect(result.id).toBe(activity.id)
      expect(result.name).toBe('Updated Name')
      expect(result.description).toBe('Updated description')
      expect(result.status).toBe('ACTIVE')
      expect(result.updatedAt.getTime()).toBeGreaterThan(activity.updatedAt.getTime())
    })
  })

  describe('deleteActivity', () => {
    it('should delete activity', async () => {
      // Arrange
      const activity = await createActivity({
        name: 'Activity to Delete',
        organizationId: org1.id,
      })

      // Act
      const result = await deleteActivity(activity.id)

      // Assert
      expect(result.id).toBe(activity.id)

      // Verify activity is deleted
      const deletedActivity = await getActivityById(activity.id)
      expect(deletedActivity).toBeNull()
    })
  })

  describe('multi-tenancy isolation', () => {
    it('should not expose org1 activities to org2', async () => {
      // Arrange - Create activity for org1
      const org1Activity = await createActivity({
        name: 'Org1 Secret Activity',
        organizationId: org1.id,
      })

      // Act - List org2 activities
      const org2Activities = await listActivitiesByOrganization(org2.id)

      // Assert - org1 activity should not be in org2 list
      expect(org2Activities.every((activity) => activity.organizationId === org2.id)).toBe(true)
      expect(org2Activities.some((activity) => activity.id === org1Activity.id)).toBe(false)
    })
  })
})
