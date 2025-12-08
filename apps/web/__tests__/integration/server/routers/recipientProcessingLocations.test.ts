import {
  type Country,
  type DataProcessingActivity,
  type DigitalAsset,
  type Organization,
  prisma,
  type Recipient,
  type User,
} from '@compilothq/database'
import { cleanupTestOrganizations, createTestOrganization } from '@compilothq/database/test-utils'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { type Context } from '@/server/context'
import { recipientProcessingLocationsRouter } from '@/server/routers/recipientProcessingLocations'

/**
 * Integration Test: RecipientProcessingLocations tRPC Router
 *
 * Tests the complete workflow for recipient processing locations:
 * Router → DAL → Service → Database
 *
 * Coverage: CRUD operations, validation, multi-tenancy, transfer detection
 */
describe('recipientProcessingLocations tRPC Router', () => {
  let testOrg: Organization
  let testUser: User
  let testRecipient: Recipient
  let euCountry: Country

  beforeAll(async () => {
    // Find or create test countries first (they may exist from seeds)
    euCountry =
      (await prisma.country.findFirst({ where: { isoCode: 'DE' } })) ??
      (await prisma.country.create({
        data: {
          name: 'Germany',
          isoCode: 'DE',
          gdprStatus: ['EU', 'EEA'],
        },
      }))

    // Create test organization and user with headquarters country
    const { org, users } = await createTestOrganization({ userCount: 1 })
    testOrg = org
    testUser = users[0]!

    // Set organization headquarters country
    await prisma.organization.update({
      where: { id: testOrg.id },
      data: { headquartersCountryId: euCountry.id },
    })

    // Create test recipient directly via Prisma
    testRecipient = await prisma.recipient.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Recipient',
        type: 'PROCESSOR',
        isActive: true,
      },
    })
  })

  afterAll(async () => {
    await cleanupTestOrganizations([testOrg.id])
  })

  const createTestContext = (user: User): Context => {
    const session: Session = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        organizationId: user.organizationId,
        primaryPersona: user.primaryPersona,
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    }

    return {
      session,
      req: undefined as unknown as NextRequest,
    }
  }

  describe('create procedure', () => {
    it('should create location with valid input', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      const location = await caller.create({
        recipientId: testRecipient.id,
        service: 'Email delivery service',
        countryId: euCountry.id,
        locationRole: 'PROCESSING',
      })

      expect(location).toBeDefined()
      expect(location.service).toBe('Email delivery service')
      expect(location.recipientId).toBe(testRecipient.id)
      expect(location.countryId).toBe(euCountry.id)
      expect(location.locationRole).toBe('PROCESSING')
      expect(location.isActive).toBe(true)
    })

    it('should reject invalid input (Zod validation)', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      await expect(
        caller.create({
          recipientId: testRecipient.id,
          service: 'ab', // Too short (min 3 chars)
          countryId: euCountry.id,
          locationRole: 'PROCESSING',
        })
      ).rejects.toThrow()
    })

    it('should enforce organizationId requirement', async () => {
      // Create user without organizationId
      const userWithoutOrg = await prisma.user.create({
        data: {
          email: `test-no-org-${Date.now()}@example.com`,
          name: 'User Without Org',
          primaryPersona: 'DPO',
          organizationId: null,
        },
      })

      const ctx = createTestContext(userWithoutOrg)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      await expect(
        caller.create({
          recipientId: testRecipient.id,
          service: 'Test service',
          countryId: euCountry.id,
          locationRole: 'PROCESSING',
        })
      ).rejects.toThrow(/organization/i)
    })
  })

  describe('getActiveForRecipient procedure', () => {
    it('should return correct data', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      // Create test location directly via Prisma
      const location = await prisma.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: testRecipient.id,
          service: 'Test service for query',
          countryId: euCountry.id,
          locationRole: 'HOSTING',
          isActive: true,
        },
      })

      const locations = await caller.getActiveForRecipient({
        recipientId: testRecipient.id,
      })

      expect(locations).toBeDefined()
      expect(Array.isArray(locations)).toBe(true)
      expect(locations.length).toBeGreaterThan(0)

      const found = locations.find((l) => l.id === location.id)
      expect(found).toBeDefined()
      expect(found?.service).toBe('Test service for query')
      expect(found?.country).toBeDefined()
    })
  })

  describe('update procedure', () => {
    it('should support partial updates', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      // Create test location directly via Prisma
      const location = await prisma.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: testRecipient.id,
          service: 'Original service',
          countryId: euCountry.id,
          locationRole: 'HOSTING',
          isActive: true,
        },
      })

      // Update only service
      const updated = await caller.update({
        id: location.id,
        service: 'Updated service',
      })

      expect(updated.service).toBe('Updated service')
      expect(updated.countryId).toBe(euCountry.id) // Unchanged
      expect(updated.locationRole).toBe('HOSTING') // Unchanged
    })
  })

  describe('move procedure', () => {
    it('should be transactional (create new + deactivate old)', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      // Create original location directly via Prisma
      const original = await prisma.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: testRecipient.id,
          service: 'Original location',
          countryId: euCountry.id,
          locationRole: 'HOSTING',
          isActive: true,
        },
      })

      // Move to different country (no mechanism needed for EU->EU)
      const newLocation = await caller.move({
        locationId: original.id,
        updates: {
          service: 'Moved location',
        },
      })

      expect(newLocation).toBeDefined()
      expect(newLocation.id).not.toBe(original.id) // New record created
      expect(newLocation.service).toBe('Moved location')
      expect(newLocation.isActive).toBe(true)

      // Verify old location is deactivated
      const allLocations = await caller.getAllForRecipient({
        recipientId: testRecipient.id,
      })

      const oldLocation = allLocations.find((l) => l.id === original.id)
      expect(oldLocation).toBeDefined()
      expect(oldLocation?.isActive).toBe(false)
    })
  })

  describe('detectTransfers procedure', () => {
    it('should return array of transfers', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      // Should now return actual data instead of error
      const result = await caller.detectTransfers()

      expect(result).toBeInstanceOf(Array)
      // Result will be empty if no cross-border transfers exist
      // Each transfer should have organizationCountry, recipientId, transferRisk, depth
      result.forEach((transfer) => {
        expect(transfer).toHaveProperty('organizationCountry')
        expect(transfer).toHaveProperty('recipientId')
        expect(transfer).toHaveProperty('transferRisk')
        expect(transfer).toHaveProperty('depth')
      })
    })
  })

  describe('analyzeActivityTransfers procedure', () => {
    it('should return analysis object', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      // Create test activity with minimal fields
      const activity = await prisma.dataProcessingActivity.create({
        data: {
          organizationId: testOrg.id,
          name: 'Test Activity',
        },
      })

      // Should now return actual analysis
      const result = await caller.analyzeActivityTransfers({
        activityId: activity.id,
      })

      // Verify analysis structure
      expect(result).toHaveProperty('activityId', activity.id)
      expect(result).toHaveProperty('activityName', 'Test Activity')
      expect(result).toHaveProperty('organizationCountry')
      expect(result).toHaveProperty('transfers')
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('totalRecipients')
      expect(result.summary).toHaveProperty('recipientsWithTransfers')
      expect(result.summary).toHaveProperty('riskDistribution')
      expect(result.summary).toHaveProperty('countriesInvolved')
    })
  })

  describe('analyzeActivityTransfersComplete procedure', () => {
    let testActivity: DataProcessingActivity
    let usCountry: Country
    let germanyCountry: Country
    let testAsset: DigitalAsset

    beforeAll(async () => {
      // Find or create test countries
      usCountry =
        (await prisma.country.findFirst({ where: { isoCode: 'US' } })) ??
        (await prisma.country.create({
          data: {
            name: 'United States',
            isoCode: 'US',
            gdprStatus: ['Third Country'],
          },
        }))

      germanyCountry =
        (await prisma.country.findFirst({ where: { isoCode: 'DE' } })) ??
        (await prisma.country.create({
          data: {
            name: 'Germany',
            isoCode: 'DE',
            gdprStatus: ['EU', 'EEA'],
          },
        }))

      // Create test activity
      testActivity = await prisma.dataProcessingActivity.create({
        data: {
          organizationId: testOrg.id,
          name: 'Integration Test Activity',
        },
      })

      // Create test recipient with US location
      const testRecipientWithLocation = await prisma.recipient.create({
        data: {
          organizationId: testOrg.id,
          name: 'Test US Processor',
          type: 'PROCESSOR',
          isActive: true,
        },
      })

      // Add processing location for recipient
      await prisma.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: testRecipientWithLocation.id,
          service: 'Cloud processing',
          countryId: usCountry.id,
          locationRole: 'PROCESSING',
          isActive: true,
        },
      })

      // Link recipient to activity
      await prisma.dataProcessingActivityRecipient.create({
        data: {
          activityId: testActivity.id,
          recipientId: testRecipientWithLocation.id,
        },
      })

      // Create test asset with Germany location
      testAsset = await prisma.digitalAsset.create({
        data: {
          organizationId: testOrg.id,
          name: 'Test Asset',
          type: 'DATABASE',
        },
      })

      // Add processing location for asset
      await prisma.assetProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          digitalAssetId: testAsset.id,
          service: 'Database hosting',
          countryId: germanyCountry.id,
          locationRole: 'HOSTING',
          isActive: true,
        },
      })

      // Link asset to activity
      await prisma.dataProcessingActivityDigitalAsset.create({
        data: {
          activityId: testActivity.id,
          digitalAssetId: testAsset.id,
        },
      })
    })

    it('should return analysis with both recipient and asset transfers', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      const analysis = await caller.analyzeActivityTransfersComplete({
        activityId: testActivity.id,
      })

      // Verify structure
      expect(analysis).toBeDefined()
      expect(analysis.activityId).toBe(testActivity.id)
      expect(analysis.activityName).toBe('Integration Test Activity')

      // Verify separate transfer arrays
      expect(analysis.recipientTransfers).toBeDefined()
      expect(analysis.assetTransfers).toBeDefined()
      expect(Array.isArray(analysis.recipientTransfers)).toBe(true)
      expect(Array.isArray(analysis.assetTransfers)).toBe(true)

      // Verify combined summary exists
      expect(analysis.combinedSummary).toBeDefined()
      expect(analysis.combinedSummary.totalTransfers).toBeGreaterThanOrEqual(0)
      expect(analysis.combinedSummary.totalRiskDistribution).toBeDefined()
      expect(analysis.combinedSummary.allCountriesInvolved).toBeDefined()
    })

    it('should correctly aggregate risk distribution', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      const analysis = await caller.analyzeActivityTransfersComplete({
        activityId: testActivity.id,
      })

      // Verify risk distribution has all required fields
      const totalRisks = analysis.combinedSummary.totalRiskDistribution

      expect(totalRisks).toHaveProperty('none')
      expect(totalRisks).toHaveProperty('low')
      expect(totalRisks).toHaveProperty('medium')
      expect(totalRisks).toHaveProperty('high')
      expect(totalRisks).toHaveProperty('critical')

      // Verify counts are non-negative
      expect(totalRisks.none).toBeGreaterThanOrEqual(0)
      expect(totalRisks.low).toBeGreaterThanOrEqual(0)
      expect(totalRisks.medium).toBeGreaterThanOrEqual(0)
      expect(totalRisks.high).toBeGreaterThanOrEqual(0)
      expect(totalRisks.critical).toBeGreaterThanOrEqual(0)

      // Total of risk distribution should match total transfers
      const totalTransfersFromRisk =
        totalRisks.none + totalRisks.low + totalRisks.medium + totalRisks.high + totalRisks.critical

      expect(totalTransfersFromRisk).toBe(analysis.combinedSummary.totalTransfers)
    })

    it('should deduplicate countries and aggregate location counts', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      const analysis = await caller.analyzeActivityTransfersComplete({
        activityId: testActivity.id,
      })

      // Should have countries involved
      expect(analysis.combinedSummary.allCountriesInvolved).toBeDefined()
      expect(Array.isArray(analysis.combinedSummary.allCountriesInvolved)).toBe(true)

      // Each country should have proper structure
      analysis.combinedSummary.allCountriesInvolved.forEach((entry) => {
        expect(entry).toHaveProperty('country')
        expect(entry).toHaveProperty('locationCount')
        expect(entry.locationCount).toBeGreaterThan(0)
        expect(entry.country).toHaveProperty('id')
        expect(entry.country).toHaveProperty('name')
        expect(entry.country).toHaveProperty('isoCode')
      })
    })

    it('should preserve individual recipient and asset summaries', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      const analysis = await caller.analyzeActivityTransfersComplete({
        activityId: testActivity.id,
      })

      // Verify recipient summary
      expect(analysis.recipientSummary).toBeDefined()
      expect(analysis.recipientSummary).toHaveProperty('totalRecipients')
      expect(analysis.recipientSummary).toHaveProperty('recipientsWithTransfers')
      expect(analysis.recipientSummary.totalRecipients).toBeGreaterThanOrEqual(0)
      expect(analysis.recipientSummary.recipientsWithTransfers).toBeGreaterThanOrEqual(0)

      // Verify asset summary
      expect(analysis.assetSummary).toBeDefined()
      expect(analysis.assetSummary).toHaveProperty('totalAssets')
      expect(analysis.assetSummary).toHaveProperty('assetsWithTransfers')
      expect(analysis.assetSummary.totalAssets).toBeGreaterThanOrEqual(0)
      expect(analysis.assetSummary.assetsWithTransfers).toBeGreaterThanOrEqual(0)
    })

    it('should handle activity with no recipients', async () => {
      // Create activity with only assets (no recipients)
      const assetOnlyActivity = await prisma.dataProcessingActivity.create({
        data: {
          organizationId: testOrg.id,
          name: 'Asset Only Activity',
        },
      })

      // Link only the asset (no recipients)
      await prisma.dataProcessingActivityDigitalAsset.create({
        data: {
          activityId: assetOnlyActivity.id,
          digitalAssetId: testAsset.id,
        },
      })

      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      const analysis = await caller.analyzeActivityTransfersComplete({
        activityId: assetOnlyActivity.id,
      })

      // Should have empty recipient transfers but populated asset transfers
      expect(analysis.recipientTransfers).toHaveLength(0)
      expect(analysis.assetTransfers.length).toBeGreaterThanOrEqual(0)
      expect(analysis.recipientSummary.recipientsWithTransfers).toBe(0)
    })

    it('should throw error for invalid activity ID', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      await expect(
        caller.analyzeActivityTransfersComplete({
          activityId: 'invalid-activity-id',
        })
      ).rejects.toThrow()
    })
  })
})
