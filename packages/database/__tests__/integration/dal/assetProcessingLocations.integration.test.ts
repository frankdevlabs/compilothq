import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  deactivateAssetProcessingLocation,
  getActiveLocationsForAsset,
  getLocationsByCountry,
  updateAssetProcessingLocation,
} from '../../../src/dal/assetProcessingLocations'
import { createDigitalAsset } from '../../../src/dal/digitalAssets'
import { prisma } from '../../../src/index'
import { createTestOrganization } from '../../../src/test-utils/factories/organizationFactory'

describe('Asset Processing Locations DAL', () => {
  const testOrgIds: string[] = []
  const testAssetIds: string[] = []
  const testCountryIds: string[] = []
  let testCountryId: string

  beforeAll(async () => {
    // Get or create a test country
    let country = await prisma.country.findFirst({
      where: { isoCode: 'US' },
    })

    if (!country) {
      // Create test country if seed data doesn't exist
      country = await prisma.country.create({
        data: {
          name: 'United States',
          isoCode: 'US',
          isoCode3: 'USA',
          gdprStatus: ['Third Country'],
          isActive: true,
        },
      })
      testCountryIds.push(country.id)
    }

    testCountryId = country.id
  })

  afterAll(async () => {
    // Clean up test assets (cascade will delete locations)
    await prisma.digitalAsset.deleteMany({
      where: { id: { in: testAssetIds } },
    })

    // Clean up test organizations
    await prisma.organization.deleteMany({
      where: { id: { in: testOrgIds } },
    })

    // Clean up test countries if we created any
    if (testCountryIds.length > 0) {
      await prisma.country.deleteMany({
        where: { id: { in: testCountryIds } },
      })
    }
  })

  describe('getActiveLocationsForAsset', () => {
    it('should retrieve only active processing locations for an asset', async () => {
      // Arrange - Create test org and asset with locations
      const { org } = await createTestOrganization({
        slug: `test-active-locations-${Date.now()}`,
      })
      testOrgIds.push(org.id)

      const { asset } = await createDigitalAsset({
        organizationId: org.id,
        name: 'Test Asset Active Locations',
        type: 'CLOUD_SERVICE',
        containsPersonalData: true,
        locations: [
          {
            service: 'Active location 1',
            countryId: testCountryId,
            locationRole: 'HOSTING',
            purposeText: 'Test purpose',
            isActive: true,
          },
          {
            service: 'Inactive location',
            countryId: testCountryId,
            locationRole: 'PROCESSING',
            purposeText: 'Old purpose',
            isActive: false,
          },
          {
            service: 'Active location 2',
            countryId: testCountryId,
            locationRole: 'BOTH',
            purposeText: 'Another purpose',
            isActive: true,
          },
        ],
      })
      testAssetIds.push(asset.id)

      // Act - Retrieve active locations
      const activeLocations = await getActiveLocationsForAsset(asset.id)

      // Assert - Only active locations returned
      expect(activeLocations).toHaveLength(2)
      expect(activeLocations.every((loc) => loc.isActive)).toBe(true)
      expect(activeLocations.map((loc) => loc.service).sort()).toEqual([
        'Active location 1',
        'Active location 2',
      ])

      // Assert - Includes related data
      expect(activeLocations[0]?.country).toBeDefined()
      expect(activeLocations[0]?.country.isoCode).toBe('US')
    })

    it('should return empty array if no active locations exist', async () => {
      // Arrange - Create asset with no locations
      const { org } = await createTestOrganization({
        slug: `test-no-locations-${Date.now()}`,
      })
      testOrgIds.push(org.id)

      const { asset } = await createDigitalAsset({
        organizationId: org.id,
        name: 'Asset Without Locations',
        type: 'DATABASE',
        containsPersonalData: false,
      })
      testAssetIds.push(asset.id)

      // Act
      const activeLocations = await getActiveLocationsForAsset(asset.id)

      // Assert
      expect(activeLocations).toEqual([])
    })
  })

  describe('updateAssetProcessingLocation', () => {
    it('should update processing location fields', async () => {
      // Arrange - Create asset with location
      const { org } = await createTestOrganization({
        slug: `test-update-location-${Date.now()}`,
      })
      testOrgIds.push(org.id)

      const { asset, locations } = await createDigitalAsset({
        organizationId: org.id,
        name: 'Test Asset Update',
        type: 'APPLICATION',
        containsPersonalData: true,
        locations: [
          {
            service: 'Original service',
            countryId: testCountryId,
            locationRole: 'HOSTING',
            purposeText: 'Original purpose',
          },
        ],
      })
      testAssetIds.push(asset.id)

      const locationId = locations[0]?.id
      if (!locationId) {
        throw new Error('Location not created')
      }

      // Act - Update location
      const updated = await updateAssetProcessingLocation(locationId, {
        service: 'Updated service name',
        locationRole: 'BOTH',
        purposeText: 'Updated purpose',
      })

      // Assert - Fields updated
      expect(updated.service).toBe('Updated service name')
      expect(updated.locationRole).toBe('BOTH')
      expect(updated.purposeText).toBe('Updated purpose')

      // Assert - Other fields unchanged
      expect(updated.countryId).toBe(testCountryId)
      expect(updated.digitalAssetId).toBe(asset.id)
      expect(updated.organizationId).toBe(org.id)
    })
  })

  describe('deactivateAssetProcessingLocation', () => {
    it('should set isActive to false without deleting the record', async () => {
      // Arrange - Create asset with location
      const { org } = await createTestOrganization({
        slug: `test-deactivate-${Date.now()}`,
      })
      testOrgIds.push(org.id)

      const { asset, locations } = await createDigitalAsset({
        organizationId: org.id,
        name: 'Test Asset Deactivate',
        type: 'MARKETING_TOOL',
        containsPersonalData: true,
        locations: [
          {
            service: 'To be deactivated',
            countryId: testCountryId,
            locationRole: 'PROCESSING',
            purposeText: 'Test deactivation',
          },
        ],
      })
      testAssetIds.push(asset.id)

      const locationId = locations[0]?.id
      if (!locationId) {
        throw new Error('Location not created')
      }

      // Act - Deactivate location
      const deactivated = await deactivateAssetProcessingLocation(locationId)

      // Assert - Location deactivated but not deleted
      expect(deactivated.isActive).toBe(false)
      expect(deactivated.id).toBe(locationId)

      // Assert - Record still exists in database
      const recordExists = await prisma.assetProcessingLocation.findUnique({
        where: { id: locationId },
      })
      expect(recordExists).toBeDefined()
      expect(recordExists?.isActive).toBe(false)

      // Assert - Active location query excludes deactivated
      const activeLocations = await getActiveLocationsForAsset(asset.id)
      expect(activeLocations).toHaveLength(0)
    })
  })

  describe('getLocationsByCountry', () => {
    it('should retrieve all processing locations in a specific country for organization', async () => {
      // Arrange - Create multiple assets with locations in same country
      const { org } = await createTestOrganization({
        slug: `test-locations-by-country-${Date.now()}`,
      })
      testOrgIds.push(org.id)

      const { asset: asset1 } = await createDigitalAsset({
        organizationId: org.id,
        name: 'Asset 1 in US',
        type: 'CLOUD_SERVICE',
        containsPersonalData: true,
        locations: [
          {
            service: 'US service 1',
            countryId: testCountryId,
            locationRole: 'HOSTING',
            purposeText: 'Purpose 1',
          },
        ],
      })
      testAssetIds.push(asset1.id)

      const { asset: asset2 } = await createDigitalAsset({
        organizationId: org.id,
        name: 'Asset 2 in US',
        type: 'DATABASE',
        containsPersonalData: true,
        locations: [
          {
            service: 'US service 2',
            countryId: testCountryId,
            locationRole: 'PROCESSING',
            purposeText: 'Purpose 2',
          },
        ],
      })
      testAssetIds.push(asset2.id)

      // Act - Get all locations in US for this org
      const usLocations = await getLocationsByCountry(org.id, testCountryId)

      // Assert - Both locations returned
      expect(usLocations.length).toBeGreaterThanOrEqual(2)

      // Assert - All locations are in correct country and org
      expect(usLocations.every((loc) => loc.countryId === testCountryId)).toBe(true)
      expect(usLocations.every((loc) => loc.organizationId === org.id)).toBe(true)

      // Assert - Includes digital asset context
      expect(usLocations[0]?.digitalAsset).toBeDefined()
      expect(usLocations[0]?.digitalAsset.name).toBeDefined()
    })

    it('should filter by isActive status when specified', async () => {
      // Arrange - Create asset with active and inactive locations
      const { org } = await createTestOrganization({
        slug: `test-active-filter-${Date.now()}`,
      })
      testOrgIds.push(org.id)

      const { asset } = await createDigitalAsset({
        organizationId: org.id,
        name: 'Asset Mixed Status',
        type: 'API',
        containsPersonalData: true,
        locations: [
          {
            service: 'Active US location',
            countryId: testCountryId,
            locationRole: 'BOTH',
            purposeText: 'Active purpose',
            isActive: true,
          },
          {
            service: 'Inactive US location',
            countryId: testCountryId,
            locationRole: 'HOSTING',
            purposeText: 'Old purpose',
            isActive: false,
          },
        ],
      })
      testAssetIds.push(asset.id)

      // Act - Get only active locations
      const activeOnly = await getLocationsByCountry(org.id, testCountryId, { isActive: true })

      // Assert - Only active locations returned
      const orgLocations = activeOnly.filter((loc) => loc.digitalAssetId === asset.id)
      expect(orgLocations.length).toBeGreaterThanOrEqual(1)
      expect(orgLocations.every((loc) => loc.isActive)).toBe(true)

      // Act - Get only inactive locations
      const inactiveOnly = await getLocationsByCountry(org.id, testCountryId, { isActive: false })

      // Assert - Only inactive locations returned
      const orgInactiveLocations = inactiveOnly.filter((loc) => loc.digitalAssetId === asset.id)
      expect(orgInactiveLocations.length).toBeGreaterThanOrEqual(1)
      expect(orgInactiveLocations.every((loc) => !loc.isActive)).toBe(true)
    })

    it('should enforce multi-tenancy - org A cannot see org B locations', async () => {
      // Arrange - Create two orgs with locations in same country
      const { org: orgA } = await createTestOrganization({
        slug: `test-org-a-${Date.now()}`,
      })
      testOrgIds.push(orgA.id)

      const { org: orgB } = await createTestOrganization({
        slug: `test-org-b-${Date.now()}`,
      })
      testOrgIds.push(orgB.id)

      const { asset: assetA } = await createDigitalAsset({
        organizationId: orgA.id,
        name: 'Org A Asset',
        type: 'CRM',
        containsPersonalData: true,
        locations: [
          {
            service: 'Org A service',
            countryId: testCountryId,
            locationRole: 'HOSTING',
            purposeText: 'Org A purpose',
          },
        ],
      })
      testAssetIds.push(assetA.id)

      const { asset: assetB } = await createDigitalAsset({
        organizationId: orgB.id,
        name: 'Org B Asset',
        type: 'ERP',
        containsPersonalData: true,
        locations: [
          {
            service: 'Org B service',
            countryId: testCountryId,
            locationRole: 'PROCESSING',
            purposeText: 'Org B purpose',
          },
        ],
      })
      testAssetIds.push(assetB.id)

      // Act - Query locations for Org A
      const orgALocations = await getLocationsByCountry(orgA.id, testCountryId)

      // Assert - Only Org A locations returned
      expect(orgALocations.every((loc) => loc.organizationId === orgA.id)).toBe(true)
      expect(orgALocations.some((loc) => loc.organizationId === orgB.id)).toBe(false)

      // Act - Query locations for Org B
      const orgBLocations = await getLocationsByCountry(orgB.id, testCountryId)

      // Assert - Only Org B locations returned
      expect(orgBLocations.every((loc) => loc.organizationId === orgB.id)).toBe(true)
      expect(orgBLocations.some((loc) => loc.organizationId === orgA.id)).toBe(false)
    })
  })
})
