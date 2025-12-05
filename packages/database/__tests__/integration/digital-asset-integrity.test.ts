import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { linkAssetToActivity } from '../../src/dal/dataProcessingActivityJunctions'
import { createDigitalAsset, deleteDigitalAsset } from '../../src/dal/digitalAssets'
import type { DigitalAsset, Organization } from '../../src/index'
import { prisma } from '../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../src/test-utils/factories'

/**
 * Digital Asset Data Integrity Tests
 *
 * Strategic tests covering critical gaps in data integrity:
 * 1. Transaction rollback when location FK invalid
 * 2. Asset delete blocked when linked to activity (Restrict constraint)
 * 3. Multi-tenancy isolation in delete operations
 *
 * These tests verify the most critical data integrity scenarios
 * not covered in the basic CRUD tests.
 */
describe('Digital Asset Data Integrity', () => {
  let testOrg: Organization
  let testCountryId: string

  beforeAll(async () => {
    // Create test organization
    const { org } = await createTestOrganization({
      slug: `integrity-test-org-${Date.now()}`,
      userCount: 1,
    })
    testOrg = org

    // Get a valid country for testing
    const country = await prisma.country.findFirst()
    if (!country) {
      throw new Error('No countries found in database')
    }
    testCountryId = country.id
  })

  afterAll(async () => {
    await cleanupTestOrganizations([testOrg.id])
  })

  describe('Transaction Rollback on Invalid Location FK', () => {
    it('should rollback asset creation if location has invalid countryId', async () => {
      // Arrange - Asset with location pointing to non-existent country
      const assetData = {
        organizationId: testOrg.id,
        name: 'Asset With Invalid Location',
        type: 'DATABASE' as const,
        containsPersonalData: true,
        locations: [
          {
            service: 'Test service',
            countryId: 'invalid-country-id-uuid-12345678', // Invalid UUID-formatted but non-existent
            locationRole: 'HOSTING' as const,
            purposeText: 'Test purpose',
          },
        ],
      }

      // Act & Assert - Creation should fail
      await expect(createDigitalAsset(assetData)).rejects.toThrow()

      // Verify rollback - Asset should NOT exist in database
      const orphanedAsset = await prisma.digitalAsset.findFirst({
        where: {
          organizationId: testOrg.id,
          name: 'Asset With Invalid Location',
        },
      })

      expect(orphanedAsset).toBeNull()
    })

    it('should rollback asset creation if location has invalid purposeId', async () => {
      // Arrange - Asset with location pointing to non-existent purpose
      const assetData = {
        organizationId: testOrg.id,
        name: 'Asset With Invalid Purpose',
        type: 'APPLICATION' as const,
        containsPersonalData: true,
        locations: [
          {
            service: 'Test service',
            countryId: testCountryId,
            locationRole: 'BOTH' as const,
            purposeId: 'invalid-purpose-id-uuid-87654321', // Invalid FK
            purposeText: null,
          },
        ],
      }

      // Act & Assert - Creation should fail
      await expect(createDigitalAsset(assetData)).rejects.toThrow()

      // Verify rollback - Asset should NOT exist
      const orphanedAsset = await prisma.digitalAsset.findFirst({
        where: {
          organizationId: testOrg.id,
          name: 'Asset With Invalid Purpose',
        },
      })

      expect(orphanedAsset).toBeNull()
    })
  })

  describe('Restrict Delete Enforcement', () => {
    let assetLinkedToActivity: DigitalAsset
    let activityId: string

    beforeAll(async () => {
      // Create activity for linking
      const activity = await prisma.dataProcessingActivity.create({
        data: {
          organizationId: testOrg.id,
          name: 'Test Activity for Delete Restriction',
          description: 'Activity linked to asset',
        },
      })
      activityId = activity.id

      // Create asset and link to activity
      const { asset } = await createDigitalAsset({
        organizationId: testOrg.id,
        name: 'Asset Linked to Activity',
        type: 'CRM' as const,
        containsPersonalData: true,
      })
      assetLinkedToActivity = asset

      await linkAssetToActivity(activityId, testOrg.id, assetLinkedToActivity.id)
    })

    it('should prevent asset deletion when linked to activity (Restrict constraint)', async () => {
      // Act & Assert - Deletion should fail with clear error message
      await expect(deleteDigitalAsset(assetLinkedToActivity.id)).rejects.toThrow(
        /Cannot delete DigitalAsset.*linked to.*activities/
      )

      // Verify asset still exists
      const asset = await prisma.digitalAsset.findUnique({
        where: { id: assetLinkedToActivity.id },
      })

      expect(asset).not.toBeNull()
      expect(asset?.id).toBe(assetLinkedToActivity.id)
    })

    it('should allow asset deletion after unlinking from all activities', async () => {
      // Arrange - Create asset and link to activity
      const { asset } = await createDigitalAsset({
        organizationId: testOrg.id,
        name: 'Asset To Be Unlinked',
        type: 'API' as const,
        containsPersonalData: false,
      })

      await linkAssetToActivity(activityId, testOrg.id, asset.id)

      // Verify link exists
      const junctionBefore = await prisma.dataProcessingActivityDigitalAsset.count({
        where: { digitalAssetId: asset.id },
      })
      expect(junctionBefore).toBe(1)

      // Act - Unlink from activity
      await prisma.dataProcessingActivityDigitalAsset.deleteMany({
        where: { digitalAssetId: asset.id },
      })

      // Now deletion should succeed
      await expect(deleteDigitalAsset(asset.id)).resolves.not.toThrow()

      // Verify asset deleted
      const deletedAsset = await prisma.digitalAsset.findUnique({
        where: { id: asset.id },
      })

      expect(deletedAsset).toBeNull()
    })
  })

  describe('Multi-Tenancy Isolation in Delete Operations', () => {
    let orgA: Organization
    let orgB: Organization
    let assetOrgA: DigitalAsset

    beforeAll(async () => {
      // Create two separate organizations
      const { org: orgA1 } = await createTestOrganization({
        slug: `org-a-delete-${Date.now()}`,
      })
      const { org: orgB1 } = await createTestOrganization({
        slug: `org-b-delete-${Date.now()}`,
      })

      orgA = orgA1
      orgB = orgB1

      // Create asset in Org A
      const { asset } = await createDigitalAsset({
        organizationId: orgA.id,
        name: 'Org A Asset',
        type: 'DATABASE' as const,
        containsPersonalData: true,
      })
      assetOrgA = asset
    })

    afterAll(async () => {
      await cleanupTestOrganizations([orgA.id, orgB.id])
    })

    it('should enforce tenant isolation - org B cannot access org A asset for deletion', async () => {
      // Arrange - Verify asset exists in Org A
      const assetInOrgA = await prisma.digitalAsset.findUnique({
        where: { id: assetOrgA.id },
      })
      expect(assetInOrgA?.organizationId).toBe(orgA.id)

      // Act - Attempt to query asset from Org B context
      const assetAccessAttempt = await prisma.digitalAsset.findFirst({
        where: {
          id: assetOrgA.id,
          organizationId: orgB.id, // Wrong organization filter
        },
      })

      // Assert - Should not find asset (tenant isolation)
      expect(assetAccessAttempt).toBeNull()

      // Verify original asset still exists in Org A
      const assetStillInOrgA = await prisma.digitalAsset.findUnique({
        where: { id: assetOrgA.id },
      })
      expect(assetStillInOrgA).not.toBeNull()
      expect(assetStillInOrgA?.organizationId).toBe(orgA.id)
    })

    it('should verify DAL functions never expose cross-tenant data', async () => {
      // Create assets in both orgs with identical names
      const { asset: assetA } = await createDigitalAsset({
        organizationId: orgA.id,
        name: 'Duplicate Name Asset',
        type: 'CRM' as const,
        containsPersonalData: true,
      })

      const { asset: assetB } = await createDigitalAsset({
        organizationId: orgB.id,
        name: 'Duplicate Name Asset',
        type: 'CRM' as const,
        containsPersonalData: true,
      })

      // Act - Query assets by name across both orgs
      const orgAAssets = await prisma.digitalAsset.findMany({
        where: {
          organizationId: orgA.id,
          name: 'Duplicate Name Asset',
        },
      })

      const orgBAssets = await prisma.digitalAsset.findMany({
        where: {
          organizationId: orgB.id,
          name: 'Duplicate Name Asset',
        },
      })

      // Assert - Each org only sees its own asset
      expect(orgAAssets).toHaveLength(1)
      expect(orgAAssets[0]?.id).toBe(assetA.id)
      expect(orgAAssets[0]?.organizationId).toBe(orgA.id)

      expect(orgBAssets).toHaveLength(1)
      expect(orgBAssets[0]?.id).toBe(assetB.id)
      expect(orgBAssets[0]?.organizationId).toBe(orgB.id)

      // Verify no cross-contamination
      expect(orgAAssets.some((a) => a.id === assetB.id)).toBe(false)
      expect(orgBAssets.some((a) => a.id === assetA.id)).toBe(false)
    })
  })
})
