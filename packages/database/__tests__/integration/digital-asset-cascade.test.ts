import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createDigitalAsset } from '../../src/dal/digitalAssets'
import type { DigitalAsset, Organization } from '../../src/index'
import { prisma } from '../../src/index'
import { createTestOrganization } from '../../src/test-utils/factories'

/**
 * Digital Asset Cascade Delete Tests
 *
 * Strategic tests verifying cascade delete behavior:
 * 1. Organization deletion cascades to all assets
 * 2. Asset deletion cascades to all processing locations
 * 3. Cascade chain: Organization → Assets → Locations
 *
 * These tests verify the cascading delete rules defined in the schema
 * are working correctly to maintain referential integrity.
 */
describe('Digital Asset Cascade Delete Behavior', () => {
  let testCountryId: string

  beforeAll(async () => {
    // Get a valid country for testing
    const country = await prisma.country.findFirst()
    if (!country) {
      throw new Error('No countries found in database')
    }
    testCountryId = country.id
  })

  describe('Organization Cascade Delete', () => {
    it('should cascade delete all assets when organization is deleted', async () => {
      // Arrange - Create organization with multiple assets
      const { org } = await createTestOrganization({
        slug: `cascade-org-assets-${Date.now()}`,
      })

      const { asset: asset1 } = await createDigitalAsset({
        organizationId: org.id,
        name: 'Asset 1 for Cascade',
        type: 'DATABASE' as const,
        containsPersonalData: true,
      })

      const { asset: asset2 } = await createDigitalAsset({
        organizationId: org.id,
        name: 'Asset 2 for Cascade',
        type: 'CLOUD_SERVICE' as const,
        containsPersonalData: false,
      })

      // Verify assets exist
      const assetsBefore = await prisma.digitalAsset.count({
        where: { organizationId: org.id },
      })
      expect(assetsBefore).toBe(2)

      // Act - Delete organization
      await prisma.organization.delete({
        where: { id: org.id },
      })

      // Assert - All assets should be cascade deleted
      const assetsAfter = await prisma.digitalAsset.count({
        where: { id: { in: [asset1.id, asset2.id] } },
      })
      expect(assetsAfter).toBe(0)

      // Verify specific assets are gone
      const asset1After = await prisma.digitalAsset.findUnique({ where: { id: asset1.id } })
      const asset2After = await prisma.digitalAsset.findUnique({ where: { id: asset2.id } })

      expect(asset1After).toBeNull()
      expect(asset2After).toBeNull()
    })

    it('should cascade delete through full chain: Organization → Assets → Locations', async () => {
      // Arrange - Create organization with asset containing locations
      const { org } = await createTestOrganization({
        slug: `cascade-org-chain-${Date.now()}`,
      })

      const { asset, locations } = await createDigitalAsset({
        organizationId: org.id,
        name: 'Asset with Locations',
        type: 'APPLICATION' as const,
        containsPersonalData: true,
        locations: [
          {
            service: 'Location 1',
            countryId: testCountryId,
            locationRole: 'HOSTING' as const,
            purposeText: 'Purpose 1',
          },
          {
            service: 'Location 2',
            countryId: testCountryId,
            locationRole: 'PROCESSING' as const,
            purposeText: 'Purpose 2',
          },
        ],
      })

      // Verify full data structure exists
      expect(locations).toHaveLength(2)
      const locationIds = locations.map((loc) => loc.id)

      const assetExists = await prisma.digitalAsset.findUnique({ where: { id: asset.id } })
      const locationsExist = await prisma.assetProcessingLocation.count({
        where: { id: { in: locationIds } },
      })

      expect(assetExists).not.toBeNull()
      expect(locationsExist).toBe(2)

      // Act - Delete organization (should cascade through entire chain)
      await prisma.organization.delete({
        where: { id: org.id },
      })

      // Assert - Verify full cascade: Org → Asset → Locations
      const assetAfter = await prisma.digitalAsset.findUnique({ where: { id: asset.id } })
      const locationsAfter = await prisma.assetProcessingLocation.count({
        where: { id: { in: locationIds } },
      })

      expect(assetAfter).toBeNull()
      expect(locationsAfter).toBe(0)
    })
  })

  describe('Asset Cascade Delete to Locations', () => {
    let testOrg: Organization

    beforeAll(async () => {
      const { org } = await createTestOrganization({
        slug: `cascade-asset-locations-${Date.now()}`,
      })
      testOrg = org
    })

    afterAll(async () => {
      // Cleanup organization (will cascade delete remaining assets)
      await prisma.organization.delete({
        where: { id: testOrg.id },
      })
    })

    it('should cascade delete all processing locations when asset is deleted', async () => {
      // Arrange - Create asset with multiple locations
      const { asset, locations } = await createDigitalAsset({
        organizationId: testOrg.id,
        name: 'Asset to Delete with Locations',
        type: 'CRM' as const,
        containsPersonalData: true,
        locations: [
          {
            service: 'Location A',
            countryId: testCountryId,
            locationRole: 'HOSTING' as const,
            purposeText: 'Purpose A',
          },
          {
            service: 'Location B',
            countryId: testCountryId,
            locationRole: 'PROCESSING' as const,
            purposeText: 'Purpose B',
          },
          {
            service: 'Location C',
            countryId: testCountryId,
            locationRole: 'BOTH' as const,
            purposeText: 'Purpose C',
          },
        ],
      })

      expect(locations).toHaveLength(3)
      const locationIds = locations.map((loc) => loc.id)

      // Verify locations exist
      const locationsBefore = await prisma.assetProcessingLocation.count({
        where: { digitalAssetId: asset.id },
      })
      expect(locationsBefore).toBe(3)

      // Act - Delete asset (not linked to any activities, so deletion is allowed)
      await prisma.digitalAsset.delete({
        where: { id: asset.id },
      })

      // Assert - All locations should be cascade deleted
      const locationsAfter = await prisma.assetProcessingLocation.count({
        where: { id: { in: locationIds } },
      })
      expect(locationsAfter).toBe(0)

      // Verify specific locations are gone
      const locationAAfter = await prisma.assetProcessingLocation.findUnique({
        where: { id: locationIds[0] },
      })
      expect(locationAAfter).toBeNull()
    })

    it('should preserve active and inactive locations until asset deletion', async () => {
      // Arrange - Create asset with both active and inactive locations
      const { asset, locations } = await createDigitalAsset({
        organizationId: testOrg.id,
        name: 'Asset with Mixed Status Locations',
        type: 'API' as const,
        containsPersonalData: false,
        locations: [
          {
            service: 'Active location',
            countryId: testCountryId,
            locationRole: 'HOSTING' as const,
            purposeText: 'Active purpose',
            isActive: true,
          },
          {
            service: 'Inactive location',
            countryId: testCountryId,
            locationRole: 'PROCESSING' as const,
            purposeText: 'Old purpose',
            isActive: false,
          },
        ],
      })

      expect(locations).toHaveLength(2)

      // Verify both active and inactive exist
      const allLocations = await prisma.assetProcessingLocation.findMany({
        where: { digitalAssetId: asset.id },
      })
      expect(allLocations).toHaveLength(2)
      expect(allLocations.some((loc) => loc.isActive)).toBe(true)
      expect(allLocations.some((loc) => !loc.isActive)).toBe(true)

      // Act - Delete asset
      await prisma.digitalAsset.delete({
        where: { id: asset.id },
      })

      // Assert - Both active AND inactive locations deleted (no orphans)
      const locationsAfter = await prisma.assetProcessingLocation.count({
        where: { digitalAssetId: asset.id },
      })
      expect(locationsAfter).toBe(0)
    })
  })

  describe('Cascade Rules Do Not Affect Other Organizations', () => {
    let orgA: Organization
    let orgB: Organization
    let assetOrgB: DigitalAsset

    beforeAll(async () => {
      const { org: org1 } = await createTestOrganization({
        slug: `cascade-isolation-a-${Date.now()}`,
      })
      const { org: org2 } = await createTestOrganization({
        slug: `cascade-isolation-b-${Date.now()}`,
      })

      orgA = org1
      orgB = org2

      // Create asset in Org B
      const { asset } = await createDigitalAsset({
        organizationId: orgB.id,
        name: 'Org B Asset',
        type: 'ERP' as const,
        containsPersonalData: true,
        locations: [
          {
            service: 'Org B Service',
            countryId: testCountryId,
            locationRole: 'BOTH' as const,
            purposeText: 'Org B Purpose',
          },
        ],
      })
      assetOrgB = asset
    })

    afterAll(async () => {
      // Cleanup both organizations
      await prisma.organization.deleteMany({
        where: { id: { in: [orgA.id, orgB.id] } },
      })
    })

    it('should not cascade delete org B assets when org A is deleted', async () => {
      // Arrange - Create asset in Org A
      const { asset: assetOrgA } = await createDigitalAsset({
        organizationId: orgA.id,
        name: 'Org A Asset',
        type: 'MARKETING_TOOL' as const,
        containsPersonalData: true,
      })

      // Verify both assets exist
      const orgAAsset = await prisma.digitalAsset.findUnique({ where: { id: assetOrgA.id } })
      const orgBAsset = await prisma.digitalAsset.findUnique({ where: { id: assetOrgB.id } })

      expect(orgAAsset).not.toBeNull()
      expect(orgBAsset).not.toBeNull()

      // Act - Delete Org A
      await prisma.organization.delete({
        where: { id: orgA.id },
      })

      // Assert - Org A asset deleted
      const orgAAssetAfter = await prisma.digitalAsset.findUnique({ where: { id: assetOrgA.id } })
      expect(orgAAssetAfter).toBeNull()

      // Assert - Org B asset still exists (tenant isolation preserved)
      const orgBAssetAfter = await prisma.digitalAsset.findUnique({ where: { id: assetOrgB.id } })
      expect(orgBAssetAfter).not.toBeNull()
      expect(orgBAssetAfter?.organizationId).toBe(orgB.id)

      // Verify Org B locations still exist
      const orgBLocations = await prisma.assetProcessingLocation.count({
        where: { digitalAssetId: assetOrgB.id },
      })
      expect(orgBLocations).toBe(1)
    })
  })
})
