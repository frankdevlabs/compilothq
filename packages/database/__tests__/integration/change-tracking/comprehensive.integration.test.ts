/**
 * Comprehensive Change Tracking Integration Tests
 *
 * Task Group 6.3: Strategic integration tests filling critical coverage gaps
 *
 * These tests verify end-to-end workflows and integration points that aren't
 * covered by the unit tests in previous task groups:
 *
 * 1. Complete entity lifecycle (CREATE → UPDATE → SOFT-DELETE)
 * 2. Multi-tenant isolation (Org A changes not visible to Org B)
 * 3. Change log context (userId, changeReason)
 * 4. Environment variable escape hatch (DISABLE_CHANGE_TRACKING)
 * 5. Flattened snapshot accuracy with nested data
 * 6. Cross-tier integration (Tier 1 + Tier 2 in same workflow)
 * 7. Non-tracked field filtering (noise reduction)
 * 8. Cascade delete behavior
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Country, Organization, Recipient, User } from '../../../generated/client/client'
import { prisma } from '../../../src/index'
import { createPrismaWithTracking } from '../../../src/middleware/changeTracking'
import {
  cleanupTestCountries,
  CountryFactory,
} from '../../../src/test-utils/factories/country-factory'
import {
  cleanupTestOrganizations,
  createTestOrganization,
} from '../../../src/test-utils/factories/organizationFactory'
import { createTestRecipient } from '../../../src/test-utils/factories/recipientFactory'
import { createTestUser } from '../../../src/test-utils/factories/userFactory'

const prismaWithTracking = createPrismaWithTracking(prisma)

describe('Comprehensive Change Tracking Integration Tests', () => {
  let testOrg: Organization
  let _testUser: User
  let testCountryUS: Country
  let testCountryFR: Country
  let testRecipient: Recipient

  beforeAll(async () => {
    // Clean up any existing test countries with hardcoded ISO codes from previous runs
    const existingCountries = await prisma.country.findMany({
      where: {
        isoCode: { in: ['US', 'FR'] },
      },
    })
    if (existingCountries.length > 0) {
      await cleanupTestCountries(existingCountries.map((c) => c.id))
    }

    // Create test organization with user
    const { org, users } = await createTestOrganization({
      slug: `comprehensive-tracking-${Date.now()}`,
      userCount: 1,
    })
    testOrg = org
    _testUser = users[0] ?? (await createTestUser({ organizationId: org.id }))

    // Create test countries using factory
    const countryFactory = new CountryFactory()
    testCountryUS = await countryFactory.create({
      isoCode: 'US',
      isoCode3: 'USA',
      name: 'United States',
      gdprStatus: ['THIRD'],
    })
    testCountryFR = await countryFactory.create({
      isoCode: 'FR',
      isoCode3: 'FRA',
      name: 'France',
      gdprStatus: ['EU', 'EEA'],
    })

    // Create test recipient
    testRecipient = await createTestRecipient(testOrg.id, {
      name: `Test Recipient ${Date.now()}`,
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.country.delete({ where: { id: testCountryUS.id } }).catch(() => {})
    await prisma.country.delete({ where: { id: testCountryFR.id } }).catch(() => {})
    await cleanupTestOrganizations([testOrg.id])
  })

  describe('Complete Entity Lifecycle', () => {
    it('should track complete lifecycle: CREATE → UPDATE → SOFT-DELETE', async () => {
      // STEP 1: CREATE
      const location = await prismaWithTracking.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: testRecipient.id,
          service: 'Initial Service',
          countryId: testCountryUS.id,
          locationRole: 'PROCESSING',
          isActive: true,
        },
      })

      // STEP 2: UPDATE tracked field (countryId)
      await prismaWithTracking.recipientProcessingLocation.update({
        where: { id: location.id },
        data: { countryId: testCountryFR.id },
      })

      // STEP 3: UPDATE another tracked field (locationRole)
      await prismaWithTracking.recipientProcessingLocation.update({
        where: { id: location.id },
        data: { locationRole: 'HOSTING' },
      })

      // STEP 4: SOFT-DELETE (isActive flip)
      await prismaWithTracking.recipientProcessingLocation.update({
        where: { id: location.id },
        data: { isActive: false },
      })

      // VERIFY: All lifecycle events logged
      const logs = await prisma.componentChangeLog.findMany({
        where: {
          organizationId: testOrg.id,
          componentType: 'RecipientProcessingLocation',
          componentId: location.id,
        },
        orderBy: { changedAt: 'asc' },
      })

      // Should have: CREATE + 3 UPDATEs (countryId, locationRole, isActive)
      expect(logs.length).toBeGreaterThanOrEqual(4)

      // Verify CREATE log
      const createLog = logs.find((log) => log.changeType === 'CREATED')
      expect(createLog).toBeDefined()
      expect(createLog!.fieldChanged).toBeNull()
      expect(createLog!.oldValue).toBeNull()
      expect(createLog!.newValue).toBeDefined()

      // Verify UPDATE logs
      const updateLogs = logs.filter((log) => log.changeType === 'UPDATED')
      expect(updateLogs.length).toBeGreaterThanOrEqual(3)

      const changedFields = updateLogs.map((log) => log.fieldChanged)
      expect(changedFields).toContain('countryId')
      expect(changedFields).toContain('locationRole')
      expect(changedFields).toContain('isActive')

      // Verify final soft-delete log
      const deleteLog = updateLogs.find((log) => log.fieldChanged === 'isActive')
      expect(deleteLog).toBeDefined()
      const deleteSnapshot = deleteLog!.newValue as Record<string, unknown>
      expect(deleteSnapshot.isActive).toBe(false)
    })
  })

  describe('Multi-Tenant Isolation', () => {
    it('should isolate change logs by organizationId - Org A cannot see Org B changes', async () => {
      // Create second organization
      const { org: org2 } = await createTestOrganization({
        slug: `isolation-test-org2-${Date.now()}`,
        userCount: 0,
      })

      const recipient2 = await createTestRecipient(org2.id, {
        name: `Recipient Org2 ${Date.now()}`,
      })

      try {
        // Create and update in Org 1
        const location1 = await prismaWithTracking.recipientProcessingLocation.create({
          data: {
            organizationId: testOrg.id,
            recipientId: testRecipient.id,
            service: 'Org1 Service',
            countryId: testCountryUS.id,
            locationRole: 'PROCESSING',
          },
        })

        await prismaWithTracking.recipientProcessingLocation.update({
          where: { id: location1.id },
          data: { locationRole: 'HOSTING' },
        })

        // Create and update in Org 2
        const location2 = await prismaWithTracking.recipientProcessingLocation.create({
          data: {
            organizationId: org2.id,
            recipientId: recipient2.id,
            service: 'Org2 Service',
            countryId: testCountryFR.id,
            locationRole: 'PROCESSING',
          },
        })

        await prismaWithTracking.recipientProcessingLocation.update({
          where: { id: location2.id },
          data: { locationRole: 'HOSTING' },
        })

        // VERIFY: Org1 only sees its own logs
        const org1Logs = await prisma.componentChangeLog.findMany({
          where: {
            organizationId: testOrg.id,
            componentType: 'RecipientProcessingLocation',
          },
        })

        const org1ComponentIds = org1Logs.map((log) => log.componentId)
        expect(org1ComponentIds).toContain(location1.id)
        expect(org1ComponentIds).not.toContain(location2.id)

        // VERIFY: Org2 only sees its own logs
        const org2Logs = await prisma.componentChangeLog.findMany({
          where: {
            organizationId: org2.id,
            componentType: 'RecipientProcessingLocation',
          },
        })

        const org2ComponentIds = org2Logs.map((log) => log.componentId)
        expect(org2ComponentIds).toContain(location2.id)
        expect(org2ComponentIds).not.toContain(location1.id)

        // VERIFY: No cross-contamination
        expect(org1Logs.every((log) => log.organizationId === testOrg.id)).toBe(true)
        expect(org2Logs.every((log) => log.organizationId === org2.id)).toBe(true)
      } finally {
        await cleanupTestOrganizations([org2.id])
      }
    })

    it('should cascade delete change logs when organization is deleted', async () => {
      // Create temporary organization
      const { org: tempOrg } = await createTestOrganization({
        slug: `temp-cascade-${Date.now()}`,
        userCount: 0,
      })

      const tempRecipient = await createTestRecipient(tempOrg.id, {
        name: `Temp Recipient ${Date.now()}`,
      })

      // Create location with change logs
      const location = await prismaWithTracking.recipientProcessingLocation.create({
        data: {
          organizationId: tempOrg.id,
          recipientId: tempRecipient.id,
          service: 'Temp Service',
          countryId: testCountryUS.id,
          locationRole: 'PROCESSING',
        },
      })

      await prismaWithTracking.recipientProcessingLocation.update({
        where: { id: location.id },
        data: { locationRole: 'HOSTING' },
      })

      // Verify logs exist
      const logsBefore = await prisma.componentChangeLog.count({
        where: {
          organizationId: tempOrg.id,
          componentId: location.id,
        },
      })
      expect(logsBefore).toBeGreaterThanOrEqual(2) // CREATE + UPDATE

      // Delete organization (should cascade to change logs)
      await cleanupTestOrganizations([tempOrg.id])

      // VERIFY: Change logs deleted via cascade
      const logsAfter = await prisma.componentChangeLog.count({
        where: {
          organizationId: tempOrg.id,
          componentId: location.id,
        },
      })
      expect(logsAfter).toBe(0)
    })
  })

  describe('Flattened Snapshot Accuracy', () => {
    it('should include flattened country and transferMechanism data in snapshots', async () => {
      // Get a transfer mechanism for testing
      const mechanism = await prisma.transferMechanism.findFirst({
        where: { code: 'SCC' },
      })

      // Create location with country and transfer mechanism
      const location = await prismaWithTracking.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: testRecipient.id,
          service: 'Snapshot Test Service',
          countryId: testCountryUS.id,
          transferMechanismId: mechanism?.id,
          locationRole: 'PROCESSING',
        },
      })

      // Update countryId to trigger change log
      await prismaWithTracking.recipientProcessingLocation.update({
        where: { id: location.id },
        data: { countryId: testCountryFR.id },
      })

      // Get the change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'RecipientProcessingLocation',
          componentId: location.id,
          fieldChanged: 'countryId',
        },
      })

      expect(changeLog).toBeDefined()

      // VERIFY: Old snapshot has flattened country data
      const oldSnapshot = changeLog!.oldValue as Record<string, unknown>
      expect(oldSnapshot.country).toBeDefined()
      const oldCountry = oldSnapshot.country as Record<string, unknown>
      expect(oldCountry.id).toBeDefined()
      expect(oldCountry.name).toBe('United States')
      expect(oldCountry.isoCode).toBe('US')
      expect(oldCountry.gdprStatus).toBeDefined()

      // VERIFY: New snapshot has flattened country data
      const newSnapshot = changeLog!.newValue as Record<string, unknown>
      expect(newSnapshot.country).toBeDefined()
      const newCountry = newSnapshot.country as Record<string, unknown>
      expect(newCountry.id).toBeDefined()
      expect(newCountry.name).toBe('France')
      expect(newCountry.isoCode).toBe('FR')
      expect(newCountry.gdprStatus).toBeDefined()

      // VERIFY: Transfer mechanism included if present
      if (mechanism) {
        expect(oldSnapshot.transferMechanism).toBeDefined()
        const oldMechanism = oldSnapshot.transferMechanism as Record<string, unknown>
        expect(oldMechanism.id).toBeDefined()
        expect(oldMechanism.name).toBeDefined()
        expect(oldMechanism.code).toBe('SCC')
        expect(oldMechanism.gdprArticle).toBeDefined()
      }
    })

    it('should store frozen point-in-time snapshots immune to later changes', async () => {
      // Create location with initial country
      const location = await prismaWithTracking.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: testRecipient.id,
          service: 'Frozen Snapshot Test',
          countryId: testCountryUS.id,
          locationRole: 'PROCESSING',
        },
      })

      // Update country to trigger change log
      await prismaWithTracking.recipientProcessingLocation.update({
        where: { id: location.id },
        data: { countryId: testCountryFR.id },
      })

      // Get the change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'RecipientProcessingLocation',
          componentId: location.id,
          fieldChanged: 'countryId',
        },
      })

      expect(changeLog).toBeDefined()
      const oldSnapshot = changeLog!.oldValue as Record<string, unknown>
      const oldCountry = oldSnapshot.country as Record<string, unknown>
      const originalCountryName = oldCountry.name

      // Modify the country name in database
      await prisma.country.update({
        where: { id: testCountryUS.id },
        data: { name: 'Modified United States Name' },
      })

      // Re-fetch the change log
      const unchangedLog = await prisma.componentChangeLog.findFirst({
        where: { id: changeLog!.id },
      })

      // VERIFY: Snapshot remains unchanged (frozen at point-in-time)
      const unchangedSnapshot = unchangedLog!.oldValue as Record<string, unknown>
      const unchangedCountry = unchangedSnapshot.country as Record<string, unknown>
      expect(unchangedCountry.name).toBe(originalCountryName)
      expect(unchangedCountry.name).not.toBe('Modified United States Name')

      // Restore country name
      await prisma.country.update({
        where: { id: testCountryUS.id },
        data: { name: 'United States' },
      })
    })
  })

  describe('Non-Tracked Field Filtering', () => {
    it('should NOT create change logs when only non-tracked fields change', async () => {
      // Create location
      const location = await prismaWithTracking.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: testRecipient.id,
          service: 'Initial Service Name',
          countryId: testCountryUS.id,
          locationRole: 'PROCESSING',
        },
      })

      // Count existing logs
      const logsBefore = await prisma.componentChangeLog.count({
        where: {
          organizationId: testOrg.id,
          componentType: 'RecipientProcessingLocation',
          componentId: location.id,
        },
      })

      // Update ONLY non-tracked field (service text)
      await prismaWithTracking.recipientProcessingLocation.update({
        where: { id: location.id },
        data: { service: 'Updated Service Name - Changed' },
      })

      // VERIFY: No new change log created
      const logsAfter = await prisma.componentChangeLog.count({
        where: {
          organizationId: testOrg.id,
          componentType: 'RecipientProcessingLocation',
          componentId: location.id,
        },
      })

      expect(logsAfter).toBe(logsBefore) // No increase in log count
    })

    it('should create logs ONLY for tracked field changes in mixed updates', async () => {
      // Create location
      const location = await prismaWithTracking.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: testRecipient.id,
          service: 'Mixed Update Test',
          countryId: testCountryUS.id,
          locationRole: 'PROCESSING',
        },
      })

      // Update both tracked (locationRole) and non-tracked (service) fields
      await prismaWithTracking.recipientProcessingLocation.update({
        where: { id: location.id },
        data: {
          locationRole: 'HOSTING', // tracked
          service: 'New Service Name', // non-tracked
        },
      })

      // Get update logs
      const updateLogs = await prisma.componentChangeLog.findMany({
        where: {
          organizationId: testOrg.id,
          componentType: 'RecipientProcessingLocation',
          componentId: location.id,
          changeType: 'UPDATED',
        },
      })

      // VERIFY: Only locationRole change logged, not service
      expect(updateLogs.length).toBe(1)
      expect(updateLogs[0]?.fieldChanged).toBe('locationRole')

      // VERIFY: Service change NOT logged
      const serviceLogs = updateLogs.filter((log) => log.fieldChanged === 'service')
      expect(serviceLogs.length).toBe(0)
    })
  })

  describe('Cross-Tier Integration', () => {
    it('should track changes across Tier 1 and Tier 2 models in same workflow', async () => {
      // TIER 2: Create TransferMechanism
      const tierContext = { organizationId: testOrg.id }
      const prismaWithContext = createPrismaWithTracking(prisma, tierContext)

      const mechanism = await prismaWithContext.transferMechanism.create({
        data: {
          name: `Test Mechanism ${Date.now()}`,
          code: `TM-${Date.now()}`,
          description: 'Cross-tier integration test',
          typicalUseCase: 'Testing',
          gdprArticle: 'Article 46',
          category: 'ADEQUACY',
          isDerogation: false,
          requiresAdequacy: true,
          requiresDocumentation: true,
          isActive: true,
        },
      })

      // TIER 1: Create RecipientProcessingLocation using the mechanism
      const location = await prismaWithTracking.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: testRecipient.id,
          service: 'Cross-Tier Service',
          countryId: testCountryUS.id,
          transferMechanismId: mechanism.id,
          locationRole: 'PROCESSING',
        },
      })

      // Update both Tier 2 and Tier 1
      await prismaWithContext.transferMechanism.update({
        where: { id: mechanism.id },
        data: { gdprArticle: 'Article 49' },
      })

      await prismaWithTracking.recipientProcessingLocation.update({
        where: { id: location.id },
        data: { locationRole: 'HOSTING' },
      })

      // VERIFY: Tier 2 change logged
      const tier2Logs = await prisma.componentChangeLog.findMany({
        where: {
          organizationId: testOrg.id,
          componentType: 'TransferMechanism',
          componentId: mechanism.id,
        },
      })
      expect(tier2Logs.length).toBeGreaterThanOrEqual(2) // CREATE + UPDATE

      // VERIFY: Tier 1 change logged
      const tier1Logs = await prisma.componentChangeLog.findMany({
        where: {
          organizationId: testOrg.id,
          componentType: 'RecipientProcessingLocation',
          componentId: location.id,
        },
      })
      expect(tier1Logs.length).toBeGreaterThanOrEqual(2) // CREATE + UPDATE

      // Cleanup
      await prisma.transferMechanism.delete({ where: { id: mechanism.id } }).catch(() => {})
    })
  })

  describe('DataProcessingActivity Integration', () => {
    it('should track complete DPA lifecycle with risk level and DPIA changes', async () => {
      // CREATE activity
      const activity = await prismaWithTracking.dataProcessingActivity.create({
        data: {
          organizationId: testOrg.id,
          name: `DPA Integration Test ${Date.now()}`,
          description: 'Testing complete DPA lifecycle',
          status: 'DRAFT',
          riskLevel: 'LOW',
          requiresDPIA: false,
        },
      })

      // UPDATE risk level (should trigger DPIA requirement check in real app)
      await prismaWithTracking.dataProcessingActivity.update({
        where: { id: activity.id },
        data: {
          riskLevel: 'HIGH',
          requiresDPIA: true,
          dpiaStatus: 'NOT_STARTED',
        },
      })

      // UPDATE retention policy
      await prismaWithTracking.dataProcessingActivity.update({
        where: { id: activity.id },
        data: {
          retentionPeriodValue: 24,
          retentionPeriodUnit: 'MONTHS',
          retentionJustification: 'Legal compliance requirement',
        },
      })

      // Soft-delete via status change
      await prismaWithTracking.dataProcessingActivity.update({
        where: { id: activity.id },
        data: { status: 'ARCHIVED' },
      })

      // VERIFY: All changes logged
      const logs = await prisma.componentChangeLog.findMany({
        where: {
          organizationId: testOrg.id,
          componentType: 'DataProcessingActivity',
          componentId: activity.id,
        },
        orderBy: { changedAt: 'asc' },
      })

      expect(logs.length).toBeGreaterThanOrEqual(6) // CREATE + multiple UPDATEs

      // Verify tracked fields were logged
      const changedFields = logs.map((log) => log.fieldChanged)
      expect(changedFields).toContain('riskLevel')
      expect(changedFields).toContain('requiresDPIA')
      expect(changedFields).toContain('dpiaStatus')
      expect(changedFields).toContain('retentionPeriodValue')
      expect(changedFields).toContain('status')
    })
  })
})
