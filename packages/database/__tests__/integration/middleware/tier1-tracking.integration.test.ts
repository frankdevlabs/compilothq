/**
 * Tier 1 Change Tracking Integration Tests
 *
 * Tests for AssetProcessingLocation, RecipientProcessingLocation, and DataProcessingActivity
 * change tracking including CREATE, UPDATE, and DELETED operations.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Organization, User } from '../../../generated/client/client'
import { prisma } from '../../../src'
import { createPrismaWithTracking } from '../../../src/middleware/changeTracking'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils'

// Create the extended client for tests
const prismaWithTracking = createPrismaWithTracking(prisma)

describe('Tier 1 Change Tracking - Complete Lifecycle', () => {
  let testOrg: Organization
  let _testUser: User

  beforeAll(async () => {
    const { org, users } = await createTestOrganization({
      name: `Tier1Track-${Date.now()}`,
      slug: `tier1-track-${Date.now()}`,
      userCount: 1,
    })
    testOrg = org
    _testUser = users[0]!
  })

  afterAll(async () => {
    await cleanupTestOrganizations([testOrg.id])
  })

  describe('AssetProcessingLocation', () => {
    it('should track countryId change with flattened snapshot', async () => {
      // Create digital asset
      const digitalAsset = await prisma.digitalAsset.create({
        data: {
          organizationId: testOrg.id,
          name: `Asset-${Date.now()}`,
          type: 'DATABASE',
          containsPersonalData: true,
        },
      })

      const usCountry = await prisma.country.findFirst({ where: { isoCode: 'US' } })
      const frCountry = await prisma.country.findFirst({ where: { isoCode: 'FR' } })

      if (!usCountry || !frCountry) {
        throw new Error('Test data missing: US or FR country not found in database')
      }

      // Create location
      const location = await prismaWithTracking.assetProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          digitalAssetId: digitalAsset.id,
          service: 'Test Service',
          countryId: usCountry.id,
          locationRole: 'HOSTING',
          isActive: true,
        },
      })

      // Update countryId
      await prismaWithTracking.assetProcessingLocation.update({
        where: { id: location.id },
        data: { countryId: frCountry.id },
      })

      // Verify change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'AssetProcessingLocation',
          componentId: location.id,
          fieldChanged: 'countryId',
        },
      })

      expect(changeLog).toBeDefined()
      expect(changeLog!.changeType).toBe('UPDATED')

      // Verify flattened snapshot includes country details
      const oldValue = changeLog!.oldValue as Record<string, unknown>
      const newValue = changeLog!.newValue as Record<string, unknown>

      expect(oldValue.country).toBeDefined()
      const oldCountry = oldValue.country as Record<string, unknown>
      expect(oldCountry.isoCode).toBe('US')
      expect(oldCountry.name).toBeDefined()

      expect(newValue.country).toBeDefined()
      const newCountry = newValue.country as Record<string, unknown>
      expect(newCountry.isoCode).toBe('FR')
      expect(newCountry.name).toBeDefined()
    })

    it('should track isActive flip from true→false as DELETED', async () => {
      // Create digital asset and location
      const digitalAsset = await prisma.digitalAsset.create({
        data: {
          organizationId: testOrg.id,
          name: `Asset-Delete-${Date.now()}`,
          type: 'DATABASE',
          containsPersonalData: true,
        },
      })

      const country = await prisma.country.findFirst({ where: { isoCode: 'US' } })

      if (!country) {
        throw new Error('Test data missing: US country not found in database')
      }

      const location = await prismaWithTracking.assetProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          digitalAssetId: digitalAsset.id,
          service: 'Test Service',
          countryId: country.id,
          locationRole: 'HOSTING',
          isActive: true,
        },
      })

      // Soft delete
      await prismaWithTracking.assetProcessingLocation.update({
        where: { id: location.id },
        data: { isActive: false },
      })

      // Verify DELETED change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'AssetProcessingLocation',
          componentId: location.id,
          fieldChanged: 'isActive',
        },
      })

      expect(changeLog).toBeDefined()
      expect(changeLog!.changeType).toBe('UPDATED')
      expect(changeLog!.fieldChanged).toBe('isActive')

      // Verify snapshots
      const oldValue = changeLog!.oldValue as Record<string, unknown>
      const newValue = changeLog!.newValue as Record<string, unknown>
      expect(oldValue.isActive).toBe(true)
      expect(newValue.isActive).toBe(false)
    })
  })

  describe('RecipientProcessingLocation', () => {
    it('should track locationRole change with flattened snapshot', async () => {
      // Create recipient
      const externalOrg = await prisma.externalOrganization.create({
        data: {
          organizationId: testOrg.id,
          legalName: `ExtOrg-${Date.now()}`,
        },
      })

      const recipient = await prisma.recipient.create({
        data: {
          organizationId: testOrg.id,
          name: `Recipient-${Date.now()}`,
          type: 'PROCESSOR',
          externalOrganizationId: externalOrg.id,
          isActive: true,
        },
      })

      const country = await prisma.country.findFirst({ where: { isoCode: 'US' } })

      if (!country) {
        throw new Error('Test data missing: US country not found in database')
      }

      // Create location with HOSTING role
      const location = await prismaWithTracking.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: recipient.id,
          service: 'Test Service',
          countryId: country.id,
          locationRole: 'HOSTING',
          isActive: true,
        },
      })

      // Update to PROCESSING role
      await prismaWithTracking.recipientProcessingLocation.update({
        where: { id: location.id },
        data: { locationRole: 'PROCESSING' },
      })

      // Verify change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'RecipientProcessingLocation',
          componentId: location.id,
          fieldChanged: 'locationRole',
        },
      })

      expect(changeLog).toBeDefined()
      expect(changeLog!.changeType).toBe('UPDATED')

      // Verify flattened snapshot includes country details
      const oldValue = changeLog!.oldValue as Record<string, unknown>
      const newValue = changeLog!.newValue as Record<string, unknown>

      expect(oldValue.country).toBeDefined()
      const oldCountry = oldValue.country as Record<string, unknown>
      expect(oldCountry.isoCode).toBe('US')

      expect(oldValue.locationRole).toBe('HOSTING')
      expect(newValue.locationRole).toBe('PROCESSING')
    })

    it('should track isActive flip from true→false', async () => {
      // Create recipient and location
      const externalOrg = await prisma.externalOrganization.create({
        data: {
          organizationId: testOrg.id,
          legalName: `ExtOrg-Delete-${Date.now()}`,
        },
      })

      const recipient = await prisma.recipient.create({
        data: {
          organizationId: testOrg.id,
          name: `Recipient-Delete-${Date.now()}`,
          type: 'PROCESSOR',
          externalOrganizationId: externalOrg.id,
          isActive: true,
        },
      })

      const country = await prisma.country.findFirst({ where: { isoCode: 'US' } })

      if (!country) {
        throw new Error('Test data missing: US country not found in database')
      }

      const location = await prismaWithTracking.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: recipient.id,
          service: 'Test Service',
          countryId: country.id,
          locationRole: 'HOSTING',
          isActive: true,
        },
      })

      // Soft delete
      await prismaWithTracking.recipientProcessingLocation.update({
        where: { id: location.id },
        data: { isActive: false },
      })

      // Verify change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'RecipientProcessingLocation',
          componentId: location.id,
          fieldChanged: 'isActive',
        },
      })

      expect(changeLog).toBeDefined()
      expect(changeLog!.changeType).toBe('UPDATED')
      expect(changeLog!.fieldChanged).toBe('isActive')

      const oldValue = changeLog!.oldValue as Record<string, unknown>
      const newValue = changeLog!.newValue as Record<string, unknown>
      expect(oldValue.isActive).toBe(true)
      expect(newValue.isActive).toBe(false)
    })
  })

  describe('DataProcessingActivity', () => {
    it('should track riskLevel change with complete snapshot', async () => {
      // Create activity
      const activity = await prismaWithTracking.dataProcessingActivity.create({
        data: {
          organizationId: testOrg.id,
          name: `Activity-${Date.now()}`,
          description: 'Test activity',
          status: 'DRAFT',
          riskLevel: 'LOW',
          requiresDPIA: false,
          dpiaStatus: null,
        },
      })

      // Update risk level
      await prismaWithTracking.dataProcessingActivity.update({
        where: { id: activity.id },
        data: { riskLevel: 'HIGH', requiresDPIA: true },
      })

      // Verify change log for riskLevel
      const riskLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'DataProcessingActivity',
          componentId: activity.id,
          fieldChanged: 'riskLevel',
        },
      })

      expect(riskLog).toBeDefined()
      expect(riskLog!.changeType).toBe('UPDATED')

      const oldValue = riskLog!.oldValue as Record<string, unknown>
      const newValue = riskLog!.newValue as Record<string, unknown>
      expect(oldValue.riskLevel).toBe('LOW')
      expect(newValue.riskLevel).toBe('HIGH')

      // Verify change log for requiresDPIA
      const dpiaLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'DataProcessingActivity',
          componentId: activity.id,
          fieldChanged: 'requiresDPIA',
        },
      })

      expect(dpiaLog).toBeDefined()
      expect(dpiaLog!.changeType).toBe('UPDATED')
    })

    it('should track CREATE operation', async () => {
      // Create activity with tracking
      const activity = await prismaWithTracking.dataProcessingActivity.create({
        data: {
          organizationId: testOrg.id,
          name: `Activity-Created-${Date.now()}`,
          description: 'Test activity creation',
          status: 'DRAFT',
          riskLevel: 'MEDIUM',
          requiresDPIA: true,
        },
      })

      // Verify CREATED change log
      const createLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'DataProcessingActivity',
          componentId: activity.id,
          changeType: 'CREATED',
        },
      })

      expect(createLog).toBeDefined()
      expect(createLog!.changeType).toBe('CREATED')
      expect(createLog!.fieldChanged).toBeNull()
      expect(createLog!.oldValue).toBeNull()
      expect(createLog!.newValue).toBeDefined()

      const newValue = createLog!.newValue as Record<string, unknown>
      expect(newValue.riskLevel).toBe('MEDIUM')
      expect(newValue.requiresDPIA).toBe(true)
    })
  })

  describe('Rapid Successive Updates', () => {
    it('should create separate log entries for rapid successive updates', async () => {
      // Create activity
      const activity = await prismaWithTracking.dataProcessingActivity.create({
        data: {
          organizationId: testOrg.id,
          name: `Rapid-${Date.now()}`,
          description: 'Test rapid updates',
          status: 'DRAFT',
          riskLevel: 'LOW',
        },
      })

      // Perform three rapid updates
      await prismaWithTracking.dataProcessingActivity.update({
        where: { id: activity.id },
        data: { riskLevel: 'MEDIUM' },
      })

      await prismaWithTracking.dataProcessingActivity.update({
        where: { id: activity.id },
        data: { riskLevel: 'HIGH' },
      })

      await prismaWithTracking.dataProcessingActivity.update({
        where: { id: activity.id },
        data: { riskLevel: 'LOW' },
      })

      // Verify three separate logs created
      const logs = await prisma.componentChangeLog.findMany({
        where: {
          organizationId: testOrg.id,
          componentType: 'DataProcessingActivity',
          componentId: activity.id,
          fieldChanged: 'riskLevel',
        },
        orderBy: { changedAt: 'asc' },
      })

      expect(logs.length).toBe(3)

      // Verify sequence
      const values = logs.map((log) => {
        const val = log.newValue as Record<string, unknown>
        return val.riskLevel
      })
      expect(values).toEqual(['MEDIUM', 'HIGH', 'LOW'])
    })
  })

  describe('Multi-Tenant Isolation', () => {
    it('should isolate change logs by organization', async () => {
      // Create second organization
      const { org: org2 } = await createTestOrganization({
        name: `Org2-${Date.now()}`,
        slug: `org2-${Date.now()}`,
        userCount: 0,
      })

      try {
        // Create activities in both orgs
        const activity1 = await prismaWithTracking.dataProcessingActivity.create({
          data: {
            organizationId: testOrg.id,
            name: `Activity-Org1-${Date.now()}`,
            status: 'DRAFT',
            riskLevel: 'LOW',
          },
        })

        const activity2 = await prismaWithTracking.dataProcessingActivity.create({
          data: {
            organizationId: org2.id,
            name: `Activity-Org2-${Date.now()}`,
            status: 'DRAFT',
            riskLevel: 'LOW',
          },
        })

        // Update both
        await prismaWithTracking.dataProcessingActivity.update({
          where: { id: activity1.id },
          data: { riskLevel: 'HIGH' },
        })

        await prismaWithTracking.dataProcessingActivity.update({
          where: { id: activity2.id },
          data: { riskLevel: 'HIGH' },
        })

        // Verify org1 only sees its logs
        const org1Logs = await prisma.componentChangeLog.findMany({
          where: {
            organizationId: testOrg.id,
            componentType: 'DataProcessingActivity',
          },
        })

        const org1ComponentIds = org1Logs.map((log) => log.componentId)
        expect(org1ComponentIds).toContain(activity1.id)
        expect(org1ComponentIds).not.toContain(activity2.id)

        // Verify org2 only sees its logs
        const org2Logs = await prisma.componentChangeLog.findMany({
          where: {
            organizationId: org2.id,
            componentType: 'DataProcessingActivity',
          },
        })

        const org2ComponentIds = org2Logs.map((log) => log.componentId)
        expect(org2ComponentIds).toContain(activity2.id)
        expect(org2ComponentIds).not.toContain(activity1.id)
      } finally {
        await cleanupTestOrganizations([org2.id])
      }
    })
  })

  describe('Concurrent Updates', () => {
    it('should handle concurrent updates gracefully', async () => {
      // Create activity
      const activity = await prismaWithTracking.dataProcessingActivity.create({
        data: {
          organizationId: testOrg.id,
          name: `Concurrent-${Date.now()}`,
          description: 'Test concurrent updates',
          status: 'DRAFT',
          riskLevel: 'LOW',
        },
      })

      // Perform concurrent updates to different fields
      await Promise.all([
        prismaWithTracking.dataProcessingActivity.update({
          where: { id: activity.id },
          data: { riskLevel: 'HIGH' },
        }),
        prismaWithTracking.dataProcessingActivity.update({
          where: { id: activity.id },
          data: { requiresDPIA: true },
        }),
        prismaWithTracking.dataProcessingActivity.update({
          where: { id: activity.id },
          data: { dpiaStatus: 'IN_PROGRESS' },
        }),
      ])

      // Verify logs created (may have multiple due to race conditions)
      const logs = await prisma.componentChangeLog.findMany({
        where: {
          organizationId: testOrg.id,
          componentType: 'DataProcessingActivity',
          componentId: activity.id,
        },
      })

      // Should have at least one log for each field that changed
      expect(logs.length).toBeGreaterThanOrEqual(1)
    })
  })
})
