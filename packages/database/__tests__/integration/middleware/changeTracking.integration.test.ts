import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Organization, User } from '../../../generated/client/client'
import { prisma } from '../../../src'
import { createPrismaWithTracking } from '../../../src/middleware/changeTracking'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils'

// Create the extended client for tests
const prismaWithTracking = createPrismaWithTracking(prisma)

describe('Change Tracking Extension', () => {
  let testOrg: Organization
  let testUser: User

  beforeAll(async () => {
    const { org, users } = await createTestOrganization({
      name: `ChangeTrack-${Date.now()}`,
      slug: `change-track-${Date.now()}`,
      userCount: 1,
    })
    testOrg = org
    testUser = users[0]!
  })

  afterAll(async () => {
    await cleanupTestOrganizations([testOrg.id])
  })

  it('should detect tracked field changes in AssetProcessingLocation', async () => {
    // Create a digital asset first
    const digitalAsset = await prisma.digitalAsset.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Asset',
        type: 'DATABASE',
        containsPersonalData: true,
      },
    })

    // Get a country for the location
    const country = await prisma.country.findFirst({
      where: { isoCode: 'US' },
    })
    expect(country).toBeDefined()

    // Create an AssetProcessingLocation using the extended client
    const location = await prismaWithTracking.assetProcessingLocation.create({
      data: {
        organizationId: testOrg.id,
        digitalAssetId: digitalAsset.id,
        service: 'Test Service',
        countryId: country!.id,
        locationRole: 'HOSTING',
        isActive: true,
      },
    })

    // Update a tracked field (countryId) - this should create a change log
    const franceCountry = await prisma.country.findFirst({
      where: { isoCode: 'FR' },
    })
    expect(franceCountry).toBeDefined()

    await prismaWithTracking.assetProcessingLocation.update({
      where: { id: location.id },
      data: { countryId: franceCountry!.id },
    })

    // Verify change log was created
    const changeLogs = await prisma.componentChangeLog.findMany({
      where: {
        organizationId: testOrg.id,
        componentType: 'AssetProcessingLocation',
        componentId: location.id,
      },
    })

    expect(changeLogs.length).toBeGreaterThanOrEqual(1)
    const lastChangeLog = changeLogs[changeLogs.length - 1]!
    expect(lastChangeLog.changeType).toBe('UPDATED')
    expect(lastChangeLog.fieldChanged).toBe('countryId')
    expect(lastChangeLog.oldValue).toBeDefined()
    expect(lastChangeLog.newValue).toBeDefined()
  })

  it('should track DigitalAsset changes for tracked fields', async () => {
    const trackedClient = createPrismaWithTracking(prisma)

    const asset = await trackedClient.digitalAsset.create({
      data: {
        organizationId: testOrg.id,
        name: 'Tracked Asset',
        type: 'DATABASE',
        containsPersonalData: true,
      },
    })

    await trackedClient.digitalAsset.update({
      where: { id: asset.id },
      data: {
        containsPersonalData: false,
        primaryHostingCountryId: null,
      },
    })

    const changeLogs = await prisma.componentChangeLog.findMany({
      where: {
        organizationId: testOrg.id,
        componentType: 'DigitalAsset',
        componentId: asset.id,
      },
    })

    expect(changeLogs.length).toBeGreaterThan(0)
    const fields = changeLogs.map((log) => log.fieldChanged)
    expect(fields).toContain('containsPersonalData')
  })

  it('should ignore non-tracked field changes', async () => {
    // Create a digital asset
    const digitalAsset = await prisma.digitalAsset.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Asset 2',
        type: 'DATABASE',
        containsPersonalData: true,
      },
    })

    const country = await prisma.country.findFirst({
      where: { isoCode: 'US' },
    })

    // Create location
    const location = await prismaWithTracking.assetProcessingLocation.create({
      data: {
        organizationId: testOrg.id,
        digitalAssetId: digitalAsset.id,
        service: 'Test Service',
        countryId: country!.id,
        locationRole: 'HOSTING',
        isActive: true,
      },
    })

    // Count existing logs
    const logsBefore = await prisma.componentChangeLog.count({
      where: {
        organizationId: testOrg.id,
        componentType: 'AssetProcessingLocation',
        componentId: location.id,
      },
    })

    // Update a NON-tracked field (service text)
    await prismaWithTracking.assetProcessingLocation.update({
      where: { id: location.id },
      data: { service: 'Updated Service Name' },
    })

    // Verify no new change log was created
    const logsAfter = await prisma.componentChangeLog.count({
      where: {
        organizationId: testOrg.id,
        componentType: 'AssetProcessingLocation',
        componentId: location.id,
      },
    })

    expect(logsAfter).toBe(logsBefore)
  })

  it('should create ComponentChangeLog with flattened snapshots for locations', async () => {
    // Create digital asset and location
    const digitalAsset = await prisma.digitalAsset.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Asset 3',
        type: 'DATABASE',
        containsPersonalData: true,
      },
    })

    const country = await prisma.country.findFirst({
      where: { isoCode: 'US' },
    })

    const transferMechanism = await prisma.transferMechanism.findFirst({
      where: { code: 'SCC' },
    })

    const location = await prismaWithTracking.assetProcessingLocation.create({
      data: {
        organizationId: testOrg.id,
        digitalAssetId: digitalAsset.id,
        service: 'Test Service',
        countryId: country!.id,
        locationRole: 'HOSTING',
        transferMechanismId: transferMechanism?.id,
        isActive: true,
      },
    })

    // Update locationRole
    await prismaWithTracking.assetProcessingLocation.update({
      where: { id: location.id },
      data: { locationRole: 'PROCESSING' },
    })

    // Get the change log
    const changeLog = await prisma.componentChangeLog.findFirst({
      where: {
        organizationId: testOrg.id,
        componentType: 'AssetProcessingLocation',
        componentId: location.id,
        fieldChanged: 'locationRole',
      },
    })

    expect(changeLog).toBeDefined()
    expect(changeLog!.oldValue).toBeDefined()
    expect(changeLog!.newValue).toBeDefined()

    // Verify snapshot includes flattened country data
    const oldSnapshot = changeLog!.oldValue as Record<string, unknown>
    const newSnapshot = changeLog!.newValue as Record<string, unknown>

    expect(oldSnapshot).toHaveProperty('country')
    expect(newSnapshot).toHaveProperty('country')

    const oldCountry = oldSnapshot.country as Record<string, unknown>
    expect(oldCountry).toHaveProperty('id')
    expect(oldCountry).toHaveProperty('name')
    expect(oldCountry).toHaveProperty('isoCode')
    expect(oldCountry).toHaveProperty('gdprStatus')

    // Verify snapshot includes transfer mechanism if present
    if (transferMechanism) {
      expect(oldSnapshot).toHaveProperty('transferMechanism')
      const oldMechanism = oldSnapshot.transferMechanism as Record<string, unknown>
      expect(oldMechanism).toHaveProperty('id')
      expect(oldMechanism).toHaveProperty('name')
      expect(oldMechanism).toHaveProperty('code')
      expect(oldMechanism).toHaveProperty('gdprArticle')
    }
  })

  it('should respect DISABLE_CHANGE_TRACKING environment variable', async () => {
    // Set environment variable
    const originalValue = process.env['DISABLE_CHANGE_TRACKING']
    process.env['DISABLE_CHANGE_TRACKING'] = 'true'

    try {
      // Create digital asset and location
      const digitalAsset = await prisma.digitalAsset.create({
        data: {
          organizationId: testOrg.id,
          name: 'Test Asset Disabled',
          type: 'DATABASE',
          containsPersonalData: true,
        },
      })

      const country = await prisma.country.findFirst({
        where: { isoCode: 'US' },
      })

      const location = await prismaWithTracking.assetProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          digitalAssetId: digitalAsset.id,
          service: 'Test Service',
          countryId: country!.id,
          locationRole: 'HOSTING',
          isActive: true,
        },
      })

      // Update a tracked field
      await prismaWithTracking.assetProcessingLocation.update({
        where: { id: location.id },
        data: { locationRole: 'PROCESSING' },
      })

      // Verify NO change log was created
      const changeLogs = await prisma.componentChangeLog.findMany({
        where: {
          organizationId: testOrg.id,
          componentType: 'AssetProcessingLocation',
          componentId: location.id,
        },
      })

      expect(changeLogs.length).toBe(0)
    } finally {
      // Restore environment variable
      if (originalValue === undefined) {
        delete process.env['DISABLE_CHANGE_TRACKING']
      } else {
        process.env['DISABLE_CHANGE_TRACKING'] = originalValue
      }
    }
  })

  it('should handle optional context (userId, changeReason)', async () => {
    // This test verifies the context interface works
    // In actual usage, context would be passed via a wrapper function
    // For now, we'll verify the ComponentChangeLog model accepts these fields

    const digitalAsset = await prisma.digitalAsset.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Asset Context',
        type: 'DATABASE',
        containsPersonalData: true,
      },
    })

    const _country = await prisma.country.findFirst({
      where: { isoCode: 'US' },
    })

    // Create a change log manually with context to test the schema
    const changeLog = await prisma.componentChangeLog.create({
      data: {
        organizationId: testOrg.id,
        componentType: 'AssetProcessingLocation',
        componentId: digitalAsset.id,
        changeType: 'CREATED',
        changedByUserId: testUser.id,
        changeReason: 'Manual test of context handling',
        oldValue: null,
        newValue: { test: 'data' },
      },
    })

    expect(changeLog.changedByUserId).toBe(testUser.id)
    expect(changeLog.changeReason).toBe('Manual test of context handling')
  })

  it('should track RecipientProcessingLocation changes', async () => {
    // Create external org and recipient
    const externalOrg = await prisma.externalOrganization.create({
      data: {
        organizationId: testOrg.id,
        legalName: 'Test External Org',
      },
    })

    const recipient = await prisma.recipient.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Recipient',
        type: 'PROCESSOR',
        externalOrganizationId: externalOrg.id,
        isActive: true,
      },
    })

    const country = await prisma.country.findFirst({
      where: { isoCode: 'US' },
    })

    // Create location
    const location = await prismaWithTracking.recipientProcessingLocation.create({
      data: {
        organizationId: testOrg.id,
        recipientId: recipient.id,
        service: 'Test Service',
        countryId: country!.id,
        locationRole: 'HOSTING',
        isActive: true,
      },
    })

    // Update tracked field
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
  })

  it('should track DataProcessingActivity changes', async () => {
    // Create activity
    const activity = await prismaWithTracking.dataProcessingActivity.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Activity',
        description: 'Test description',
        status: 'DRAFT',
        riskLevel: 'LOW',
        requiresDPIA: false,
      },
    })

    // Update tracked field
    await prismaWithTracking.dataProcessingActivity.update({
      where: { id: activity.id },
      data: { riskLevel: 'HIGH', requiresDPIA: true },
    })

    // Verify change log created
    const changeLogs = await prisma.componentChangeLog.findMany({
      where: {
        organizationId: testOrg.id,
        componentType: 'DataProcessingActivity',
        componentId: activity.id,
      },
    })

    expect(changeLogs.length).toBeGreaterThanOrEqual(1)

    // Should have logs for riskLevel and requiresDPIA changes
    const riskLevelLog = changeLogs.find((log) => log.fieldChanged === 'riskLevel')
    expect(riskLevelLog).toBeDefined()
    expect(riskLevelLog!.changeType).toBe('UPDATED')

    const oldValue = riskLevelLog!.oldValue as Record<string, unknown>
    const newValue = riskLevelLog!.newValue as Record<string, unknown>
    expect(oldValue.riskLevel).toBe('LOW')
    expect(newValue.riskLevel).toBe('HIGH')
  })

  it('should track hostingDetail field changes in DigitalAsset', async () => {
    const trackedClient = createPrismaWithTracking(prisma, {
      userId: testUser.id,
      changeReason: 'Test: hostingDetail tracking',
    })

    const asset = await trackedClient.digitalAsset.create({
      data: {
        organizationId: testOrg.id,
        name: 'Cloud Asset',
        type: 'CLOUD_SERVICE',
        containsPersonalData: true,
        hostingDetail: 'us-east-1',
      },
    })

    await trackedClient.digitalAsset.update({
      where: { id: asset.id },
      data: { hostingDetail: 'eu-west-1' },
    })

    const changeLogs = await prisma.componentChangeLog.findMany({
      where: {
        componentType: 'DigitalAsset',
        componentId: asset.id,
        fieldChanged: 'hostingDetail',
      },
    })

    expect(changeLogs).toHaveLength(1)
    expect(changeLogs[0]?.changeType).toBe('UPDATED')

    const oldSnapshot = changeLogs[0]?.oldValue as Record<string, unknown>
    const newSnapshot = changeLogs[0]?.newValue as Record<string, unknown>
    expect(oldSnapshot.hostingDetail).toBe('us-east-1')
    expect(newSnapshot.hostingDetail).toBe('eu-west-1')
  })

  it('should detect RESTORED changeType when isActive flips from false to true', async () => {
    const trackedClient = createPrismaWithTracking(prisma, {
      userId: testUser.id,
      changeReason: 'Test: restoration detection',
    })

    const digitalAsset = await prisma.digitalAsset.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Asset for Restoration',
        type: 'DATABASE',
        containsPersonalData: true,
      },
    })

    const country = await prisma.country.findFirst({ where: { isoCode: 'US' } })
    expect(country).toBeDefined()

    const location = await trackedClient.assetProcessingLocation.create({
      data: {
        organizationId: testOrg.id,
        digitalAssetId: digitalAsset.id,
        service: 'Test Service',
        countryId: country!.id,
        locationRole: 'HOSTING',
        isActive: true,
      },
    })

    // Soft-delete
    await trackedClient.assetProcessingLocation.update({
      where: { id: location.id },
      data: { isActive: false },
    })

    // Restore - should log RESTORED, not UPDATED
    await trackedClient.assetProcessingLocation.update({
      where: { id: location.id },
      data: { isActive: true },
    })

    const restoredLog = await prisma.componentChangeLog.findFirst({
      where: {
        componentType: 'AssetProcessingLocation',
        componentId: location.id,
        changeType: 'RESTORED',
      },
    })

    expect(restoredLog).toBeDefined()
    expect(restoredLog?.fieldChanged).toBe('isActive')

    const oldSnapshot = restoredLog?.oldValue as Record<string, unknown>
    const newSnapshot = restoredLog?.newValue as Record<string, unknown>
    expect(oldSnapshot.isActive).toBe(false)
    expect(newSnapshot.isActive).toBe(true)

    // Verify no duplicate UPDATED log for the restoration
    const updatedLogs = await prisma.componentChangeLog.findMany({
      where: {
        componentType: 'AssetProcessingLocation',
        componentId: location.id,
        changeType: 'UPDATED',
        fieldChanged: 'isActive',
      },
    })
    expect(updatedLogs).toHaveLength(1) // Only the soft-delete, not the restore
  })
})
