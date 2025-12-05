import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createDigitalAsset,
  type CreateDigitalAssetResult,
  getDigitalAssetById,
  listDigitalAssets,
  updateDigitalAsset,
} from '../../../src/dal/digitalAssets'
import type { DigitalAsset, Organization } from '../../../src/index'
import { AssetType, IntegrationStatus, prisma } from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils/factories'

/**
 * Digital Assets DAL - Integration Tests
 *
 * Tests digital asset data access layer functions against a real test database.
 * Focuses on critical CRUD operations and multi-tenancy isolation.
 *
 * Coverage:
 * - Asset creation (with and without locations)
 * - Asset retrieval with relations
 * - Asset listing with filters
 * - Asset updates (partial)
 * - Multi-tenancy isolation
 */
describe('Digital Assets DAL - Integration Tests', () => {
  // Shared test organizations
  let org1: Organization
  let org2: Organization
  let countryId: string

  beforeAll(async () => {
    // Create shared test organizations
    const { org: testOrg1 } = await createTestOrganization({
      slug: `digital-assets-dal-org1-${Date.now()}`,
      userCount: 1,
    })
    const { org: testOrg2 } = await createTestOrganization({
      slug: `digital-assets-dal-org2-${Date.now()}`,
      userCount: 1,
    })

    org1 = testOrg1
    org2 = testOrg2

    // Get a country for primaryHostingCountryId (use any existing country)
    const country = await prisma.country.findFirst()
    if (!country) {
      throw new Error('No countries found in database - seed data may be missing')
    }
    countryId = country.id
  })

  afterAll(async () => {
    // Cleanup shared test data
    await cleanupTestOrganizations([org1.id, org2.id])
  })

  describe('createDigitalAsset - Basic creation without locations', () => {
    it('should create asset with required fields only', async () => {
      // Arrange
      const assetData = {
        organizationId: org1.id,
        name: 'Google Analytics',
        type: AssetType.ANALYTICS_PLATFORM,
        containsPersonalData: true,
      }

      // Act
      const { asset, locations }: CreateDigitalAssetResult = await createDigitalAsset(assetData)

      // Assert
      expect(asset).toBeDefined()
      expect(asset.name).toBe(assetData.name)
      expect(asset.type).toBe(assetData.type)
      expect(asset.organizationId).toBe(org1.id)
      expect(asset.containsPersonalData).toBe(true)
      expect(asset.integrationStatus).toBe(IntegrationStatus.NOT_INTEGRATED) // Default
      expect(locations).toEqual([]) // No locations provided
      expect(asset.createdAt).toBeInstanceOf(Date)
      expect(asset.updatedAt).toBeInstanceOf(Date)
    })

    it('should create asset with all optional fields', async () => {
      // Act
      const { asset }: CreateDigitalAssetResult = await createDigitalAsset({
        organizationId: org1.id,
        name: 'AWS S3',
        type: AssetType.FILE_STORAGE,
        description: 'Cloud storage for backups',
        primaryHostingCountryId: countryId,
        url: 'https://aws.amazon.com/s3',
        containsPersonalData: false,
        integrationStatus: IntegrationStatus.CONNECTED,
        discoveredVia: 'Manual entry',
      })

      // Assert
      expect(asset.description).toBe('Cloud storage for backups')
      expect(asset.primaryHostingCountryId).toBe(countryId)
      expect(asset.url).toBe('https://aws.amazon.com/s3')
      expect(asset.containsPersonalData).toBe(false)
      expect(asset.integrationStatus).toBe(IntegrationStatus.CONNECTED)
      expect(asset.discoveredVia).toBe('Manual entry')
    })
  })

  describe('createDigitalAsset - Atomic creation with locations', () => {
    it('should create asset and locations atomically in transaction', async () => {
      // Arrange - Need to get purpose for location
      const purpose = await prisma.purpose.findFirst({
        where: { organizationId: org1.id },
      })

      if (!purpose) {
        // Create a purpose for testing
        const newPurpose = await prisma.purpose.create({
          data: {
            organizationId: org1.id,
            name: 'Analytics',
            category: 'ANALYTICS',
            scope: 'INTERNAL',
          },
        })
        const assetData = {
          organizationId: org1.id,
          name: 'BigQuery',
          type: AssetType.DATABASE,
          containsPersonalData: true,
          locations: [
            {
              service: 'BigQuery analytics',
              countryId: countryId,
              locationRole: 'BOTH' as const,
              purposeId: newPurpose.id,
            },
            {
              service: 'BigQuery backup',
              countryId: countryId,
              locationRole: 'HOSTING' as const,
              purposeText: 'Backup and disaster recovery',
            },
          ],
        }

        // Act
        const { asset, locations }: CreateDigitalAssetResult = await createDigitalAsset(assetData)

        // Assert
        expect(asset).toBeDefined()
        expect(asset.name).toBe('BigQuery')
        expect(locations).toHaveLength(2)
        expect(locations[0]?.service).toBe('BigQuery analytics')
        expect(locations[0]?.digitalAssetId).toBe(asset.id)
        expect(locations[0]?.organizationId).toBe(org1.id)
        expect(locations[1]?.service).toBe('BigQuery backup')
        expect(locations[1]?.purposeText).toBe('Backup and disaster recovery')
      } else {
        const assetData = {
          organizationId: org1.id,
          name: 'BigQuery',
          type: AssetType.DATABASE,
          containsPersonalData: true,
          locations: [
            {
              service: 'BigQuery analytics',
              countryId: countryId,
              locationRole: 'BOTH' as const,
              purposeId: purpose.id,
            },
          ],
        }

        // Act
        const { asset, locations }: CreateDigitalAssetResult = await createDigitalAsset(assetData)

        // Assert
        expect(asset).toBeDefined()
        expect(locations).toHaveLength(1)
        expect(locations[0]?.digitalAssetId).toBe(asset.id)
      }
    })
  })

  describe('getDigitalAssetById - Retrieve with relations', () => {
    it('should retrieve asset with processing locations included', async () => {
      // Arrange - Create asset first
      const { asset: createdAsset }: CreateDigitalAssetResult = await createDigitalAsset({
        organizationId: org1.id,
        name: 'Salesforce CRM',
        type: AssetType.CRM,
        containsPersonalData: true,
      })

      // Add a location
      await prisma.assetProcessingLocation.create({
        data: {
          organizationId: org1.id,
          digitalAssetId: createdAsset.id,
          service: 'CRM operations',
          countryId: countryId,
          locationRole: 'BOTH',
          purposeText: 'Customer management',
        },
      })

      // Act
      const result = await getDigitalAssetById(createdAsset.id, {
        includeProcessingLocations: true,
      })

      // Assert
      expect(result).not.toBeNull()
      expect(result?.id).toBe(createdAsset.id)
      expect(result?.processingLocations).toBeDefined()
      expect(result?.processingLocations.length).toBeGreaterThan(0)
    })

    it('should return null for non-existent asset ID', async () => {
      // Act
      const result = await getDigitalAssetById('non-existent-id')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('listDigitalAssets - Filter by organizationId and type', () => {
    it('should return only assets for current organization', async () => {
      // Arrange - Create assets for both orgs
      const { asset: org1Asset }: CreateDigitalAssetResult = await createDigitalAsset({
        organizationId: org1.id,
        name: 'Org1 Database',
        type: AssetType.DATABASE,
        containsPersonalData: true,
      })

      await createDigitalAsset({
        organizationId: org2.id,
        name: 'Org2 Database',
        type: AssetType.DATABASE,
        containsPersonalData: true,
      })

      // Act - Query assets for org1
      const result: DigitalAsset[] = await listDigitalAssets(org1.id)

      // Assert - Should only include org1 assets
      expect(result.length).toBeGreaterThan(0)
      expect(result.some((a) => a.id === org1Asset.id)).toBe(true)
      expect(result.every((a) => a.organizationId === org1.id)).toBe(true)
    })

    it('should filter assets by type', async () => {
      // Arrange - Create assets with different types
      await createDigitalAsset({
        organizationId: org2.id,
        name: 'Marketing Tool',
        type: AssetType.MARKETING_TOOL,
        containsPersonalData: false,
      })

      await createDigitalAsset({
        organizationId: org2.id,
        name: 'Analytics Platform',
        type: AssetType.ANALYTICS_PLATFORM,
        containsPersonalData: true,
      })

      // Act - Query by marketing tool type
      const result: DigitalAsset[] = await listDigitalAssets(org2.id, {
        type: AssetType.MARKETING_TOOL,
      })

      // Assert
      expect(result.every((a) => a.type === AssetType.MARKETING_TOOL)).toBe(true)
    })

    it('should filter assets by containsPersonalData flag', async () => {
      // Arrange - Create assets with personal data flags
      await createDigitalAsset({
        organizationId: org2.id,
        name: 'Customer Database',
        type: AssetType.DATABASE,
        containsPersonalData: true,
      })

      await createDigitalAsset({
        organizationId: org2.id,
        name: 'Static Assets CDN',
        type: AssetType.FILE_STORAGE,
        containsPersonalData: false,
      })

      // Act - Query only personal data inventory
      const result: DigitalAsset[] = await listDigitalAssets(org2.id, {
        containsPersonalData: true,
      })

      // Assert
      expect(result.every((a) => a.containsPersonalData === true)).toBe(true)
    })
  })

  describe('updateDigitalAsset - Partial updates', () => {
    it('should update asset name and description', async () => {
      // Arrange
      const { asset: createdAsset }: CreateDigitalAssetResult = await createDigitalAsset({
        organizationId: org1.id,
        name: 'Original Name',
        type: AssetType.APPLICATION,
        containsPersonalData: false,
      })

      // Act
      const result: DigitalAsset = await updateDigitalAsset(createdAsset.id, {
        name: 'Updated Name',
        description: 'Updated description',
      })

      // Assert
      expect(result.name).toBe('Updated Name')
      expect(result.description).toBe('Updated description')
      expect(result.type).toBe(AssetType.APPLICATION) // Unchanged
    })

    it('should update integration status and lastScannedAt', async () => {
      // Arrange
      const { asset: createdAsset }: CreateDigitalAssetResult = await createDigitalAsset({
        organizationId: org1.id,
        name: 'Scanner Test',
        type: AssetType.API,
        containsPersonalData: true,
      })

      const scanTime = new Date()

      // Act
      const result: DigitalAsset = await updateDigitalAsset(createdAsset.id, {
        integrationStatus: IntegrationStatus.CONNECTED,
        lastScannedAt: scanTime,
      })

      // Assert
      expect(result.integrationStatus).toBe(IntegrationStatus.CONNECTED)
      expect(result.lastScannedAt).toEqual(scanTime)
    })
  })
})
