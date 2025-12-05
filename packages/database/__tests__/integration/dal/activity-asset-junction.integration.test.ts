import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { DataProcessingActivity, DigitalAsset, Organization } from '../../../src'
import { prisma } from '../../../src'
import {
  getActivitiesForAsset,
  getAssetsForActivity,
  linkAssetToActivity,
  syncActivityAssets,
  unlinkAssetFromActivity,
} from '../../../src/dal/dataProcessingActivityJunctions'

/**
 * Integration tests for DataProcessingActivityDigitalAsset junction operations
 *
 * Tests verify:
 * - linkAssetToActivity() creates junction with duplicate prevention
 * - unlinkAssetFromActivity() removes junction
 * - syncActivityAssets() performs atomic bulk sync
 * - getAssetsForActivity() retrieves linked assets
 * - getActivitiesForAsset() retrieves activities using asset
 * - Multi-tenancy isolation enforced
 * - Transaction atomicity for sync operations
 */

describe('Activity-Asset Junction Operations', () => {
  let testOrg: Organization
  let otherOrg: Organization
  let activity1: DataProcessingActivity
  let activity2: DataProcessingActivity
  let asset1: DigitalAsset
  let asset2: DigitalAsset
  let asset3: DigitalAsset
  let otherOrgActivity: DataProcessingActivity

  beforeAll(async () => {
    // Create test organizations
    testOrg = await prisma.organization.create({
      data: {
        name: `Test Org ${Date.now()}`,
        slug: `test-org-${Date.now()}`,
        status: 'ACTIVE',
      },
    })

    otherOrg = await prisma.organization.create({
      data: {
        name: `Other Org ${Date.now()}`,
        slug: `other-org-${Date.now()}`,
        status: 'ACTIVE',
      },
    })

    // Create test activities
    activity1 = await prisma.dataProcessingActivity.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Activity 1',
        description: 'Activity for junction testing',
      },
    })

    activity2 = await prisma.dataProcessingActivity.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Activity 2',
        description: 'Second activity for junction testing',
      },
    })

    otherOrgActivity = await prisma.dataProcessingActivity.create({
      data: {
        organizationId: otherOrg.id,
        name: 'Other Org Activity',
        description: 'Activity in different organization',
      },
    })

    // Create test digital assets
    asset1 = await prisma.digitalAsset.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Asset 1',
        type: 'DATABASE',
        containsPersonalData: true,
      },
    })

    asset2 = await prisma.digitalAsset.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Asset 2',
        type: 'CLOUD_SERVICE',
        containsPersonalData: true,
      },
    })

    asset3 = await prisma.digitalAsset.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Asset 3',
        type: 'APPLICATION',
        containsPersonalData: false,
      },
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.dataProcessingActivityDigitalAsset.deleteMany({
      where: {
        OR: [
          { activityId: activity1.id },
          { activityId: activity2.id },
          { activityId: otherOrgActivity.id },
        ],
      },
    })

    await prisma.digitalAsset.deleteMany({
      where: { organizationId: { in: [testOrg.id, otherOrg.id] } },
    })

    await prisma.dataProcessingActivity.deleteMany({
      where: { organizationId: { in: [testOrg.id, otherOrg.id] } },
    })

    await prisma.organization.deleteMany({
      where: { id: { in: [testOrg.id, otherOrg.id] } },
    })
  })

  describe('linkAssetToActivity()', () => {
    it('should create junction record linking asset to activity', async () => {
      // Act - Link asset to activity
      await linkAssetToActivity(activity1.id, testOrg.id, asset1.id)

      // Assert - Verify junction created
      const junction = await prisma.dataProcessingActivityDigitalAsset.findFirst({
        where: {
          activityId: activity1.id,
          digitalAssetId: asset1.id,
        },
      })

      expect(junction).toBeDefined()
      expect(junction?.activityId).toBe(activity1.id)
      expect(junction?.digitalAssetId).toBe(asset1.id)
    })

    it('should prevent duplicate links (idempotent operation)', async () => {
      // Arrange - First link already created in previous test
      const countBefore = await prisma.dataProcessingActivityDigitalAsset.count({
        where: {
          activityId: activity1.id,
          digitalAssetId: asset1.id,
        },
      })

      expect(countBefore).toBe(1)

      // Act - Attempt to link again (should silently succeed)
      await linkAssetToActivity(activity1.id, testOrg.id, asset1.id)

      // Assert - Still only one junction (idempotent check prevented duplicate)
      const countAfter = await prisma.dataProcessingActivityDigitalAsset.count({
        where: {
          activityId: activity1.id,
          digitalAssetId: asset1.id,
        },
      })

      expect(countAfter).toBe(1)
    })

    it('should throw error if activity not found or wrong organization', async () => {
      // Act & Assert - Attempt to link with wrong organization
      await expect(linkAssetToActivity(activity1.id, otherOrg.id, asset2.id)).rejects.toThrow(
        'not found or does not belong to organization'
      )

      // Verify junction was NOT created
      const junction = await prisma.dataProcessingActivityDigitalAsset.findFirst({
        where: {
          activityId: activity1.id,
          digitalAssetId: asset2.id,
        },
      })

      expect(junction).toBeNull()
    })
  })

  describe('unlinkAssetFromActivity()', () => {
    it('should remove junction record', async () => {
      // Arrange - Create junction
      await linkAssetToActivity(activity2.id, testOrg.id, asset2.id)

      // Verify junction exists
      const junctionBefore = await prisma.dataProcessingActivityDigitalAsset.findFirst({
        where: {
          activityId: activity2.id,
          digitalAssetId: asset2.id,
        },
      })
      expect(junctionBefore).toBeDefined()

      // Act - Unlink asset from activity
      await unlinkAssetFromActivity(activity2.id, testOrg.id, asset2.id)

      // Assert - Verify junction removed
      const junctionAfter = await prisma.dataProcessingActivityDigitalAsset.findFirst({
        where: {
          activityId: activity2.id,
          digitalAssetId: asset2.id,
        },
      })

      expect(junctionAfter).toBeNull()
    })

    it('should be idempotent (no error if junction does not exist)', async () => {
      // Arrange - Ensure junction does not exist
      await prisma.dataProcessingActivityDigitalAsset.deleteMany({
        where: {
          activityId: activity2.id,
          digitalAssetId: asset3.id,
        },
      })

      // Act & Assert - Should not throw error
      await expect(
        unlinkAssetFromActivity(activity2.id, testOrg.id, asset3.id)
      ).resolves.not.toThrow()
    })

    it('should throw error if activity not found or wrong organization', async () => {
      // Act & Assert - Attempt to unlink with wrong organization
      await expect(unlinkAssetFromActivity(activity1.id, otherOrg.id, asset1.id)).rejects.toThrow(
        'not found or does not belong to organization'
      )
    })
  })

  describe('syncActivityAssets()', () => {
    it('should replace all asset links atomically', async () => {
      // Arrange - Create initial links
      await linkAssetToActivity(activity2.id, testOrg.id, asset1.id)
      await linkAssetToActivity(activity2.id, testOrg.id, asset2.id)

      // Verify initial state (2 assets)
      const beforeCount = await prisma.dataProcessingActivityDigitalAsset.count({
        where: { activityId: activity2.id },
      })
      expect(beforeCount).toBe(2)

      // Act - Sync to new set (asset2 and asset3)
      await syncActivityAssets(activity2.id, testOrg.id, [asset2.id, asset3.id])

      // Assert - Verify only synced assets remain
      const afterJunctions = await prisma.dataProcessingActivityDigitalAsset.findMany({
        where: { activityId: activity2.id },
      })

      expect(afterJunctions).toHaveLength(2)
      expect(afterJunctions.map((j) => j.digitalAssetId).sort()).toEqual(
        [asset2.id, asset3.id].sort()
      )
    })

    it('should support empty array (remove all links)', async () => {
      // Arrange - Create links
      await linkAssetToActivity(activity1.id, testOrg.id, asset2.id)
      await linkAssetToActivity(activity1.id, testOrg.id, asset3.id)

      // Verify initial state
      const beforeCount = await prisma.dataProcessingActivityDigitalAsset.count({
        where: { activityId: activity1.id },
      })
      expect(beforeCount).toBeGreaterThan(0)

      // Act - Sync with empty array
      await syncActivityAssets(activity1.id, testOrg.id, [])

      // Assert - All links removed
      const afterCount = await prisma.dataProcessingActivityDigitalAsset.count({
        where: { activityId: activity1.id },
      })
      expect(afterCount).toBe(0)
    })

    it('should be atomic (transaction rolls back on failure)', async () => {
      // Arrange - Create initial link
      await linkAssetToActivity(activity2.id, testOrg.id, asset1.id)

      // Verify initial state
      const beforeJunctions = await prisma.dataProcessingActivityDigitalAsset.findMany({
        where: { activityId: activity2.id },
      })
      const beforeCount = beforeJunctions.length

      // Act & Assert - Attempt sync with invalid asset ID (should fail)
      await expect(
        syncActivityAssets(activity2.id, testOrg.id, [asset1.id, 'invalid-asset-id'])
      ).rejects.toThrow()

      // Verify rollback - original links preserved
      const afterJunctions = await prisma.dataProcessingActivityDigitalAsset.findMany({
        where: { activityId: activity2.id },
      })

      expect(afterJunctions).toHaveLength(beforeCount)
      expect(afterJunctions.map((j) => j.digitalAssetId)).toContain(asset1.id)
    })
  })

  describe('getAssetsForActivity()', () => {
    it('should retrieve all assets linked to activity', async () => {
      // Arrange - Create links
      await syncActivityAssets(activity1.id, testOrg.id, [asset1.id, asset2.id])

      // Act - Retrieve assets
      const assets = await getAssetsForActivity(activity1.id, testOrg.id)

      // Assert - Verify correct assets returned
      expect(assets).toHaveLength(2)
      expect(assets.map((a) => a.id).sort()).toEqual([asset1.id, asset2.id].sort())
      expect(assets[0]?.name).toBeDefined()
      expect(assets[0]?.type).toBeDefined()
    })

    it('should return empty array if no assets linked', async () => {
      // Arrange - Clear all links
      await syncActivityAssets(activity1.id, testOrg.id, [])

      // Act - Retrieve assets
      const assets = await getAssetsForActivity(activity1.id, testOrg.id)

      // Assert - Empty array
      expect(assets).toEqual([])
    })

    it('should throw error if activity not found or wrong organization', async () => {
      // Act & Assert - Attempt to get assets with wrong organization
      await expect(getAssetsForActivity(activity1.id, otherOrg.id)).rejects.toThrow(
        'not found or does not belong to organization'
      )
    })
  })

  describe('getActivitiesForAsset()', () => {
    it('should retrieve all activities using an asset', async () => {
      // Arrange - Link asset to multiple activities
      await linkAssetToActivity(activity1.id, testOrg.id, asset1.id)
      await linkAssetToActivity(activity2.id, testOrg.id, asset1.id)

      // Act - Retrieve activities
      const activities = await getActivitiesForAsset(asset1.id)

      // Assert - Verify correct activities returned
      expect(activities).toHaveLength(2)
      expect(activities.map((a) => a.id).sort()).toEqual([activity1.id, activity2.id].sort())
      expect(activities[0]?.name).toBeDefined()
      expect(activities[0]?.organizationId).toBe(testOrg.id)
    })

    it('should return empty array if no activities linked', async () => {
      // Arrange - Ensure asset3 has no links
      await prisma.dataProcessingActivityDigitalAsset.deleteMany({
        where: { digitalAssetId: asset3.id },
      })

      // Act - Retrieve activities
      const activities = await getActivitiesForAsset(asset3.id)

      // Assert - Empty array
      expect(activities).toEqual([])
    })

    it('should include full activity data', async () => {
      // Arrange - Ensure link exists
      await linkAssetToActivity(activity1.id, testOrg.id, asset2.id)

      // Act - Retrieve activities
      const activities = await getActivitiesForAsset(asset2.id)

      // Assert - Verify full activity data
      const activity = activities.find((a) => a.id === activity1.id)
      expect(activity).toBeDefined()
      expect(activity?.name).toBe('Test Activity 1')
      expect(activity?.description).toBe('Activity for junction testing')
      expect(activity?.organizationId).toBe(testOrg.id)
    })
  })
})
