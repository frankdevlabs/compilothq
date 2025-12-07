/**
 * Integration tests for DAL functions with change tracking
 *
 * Tests:
 * - Existing DAL functions work with prismaWithTracking
 * - Change logs are created when DAL functions update tracked models
 * - Multi-tenant context flows through to change logs
 * - DAL functions can pass userId and changeReason context
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Country, Organization, Recipient, User } from '../../../generated/client/client'
import { prisma, prismaWithTracking } from '../../../src/index'
import { CountryFactory } from '../../../src/test-utils/factories/country-factory'
import {
  cleanupTestOrganizations,
  createTestOrganization,
} from '../../../src/test-utils/factories/organizationFactory'
import { createTestRecipient } from '../../../src/test-utils/factories/recipientFactory'
import { createTestUser } from '../../../src/test-utils/factories/userFactory'

describe('DAL Integration with Change Tracking', () => {
  let testOrg: Organization
  let _testUser: User
  let testCountry: Country
  let testRecipient: Recipient

  beforeAll(async () => {
    const { org, users } = await createTestOrganization({
      slug: `test-dal-integration-${Date.now()}`,
      userCount: 1,
    })
    testOrg = org
    _testUser = users[0] ?? (await createTestUser({ organizationId: org.id }))

    // Create test country using factory
    testCountry = await new CountryFactory().create({
      gdprStatus: ['EU', 'EEA'],
    })

    // Create test recipient using factory
    testRecipient = await createTestRecipient(testOrg.id, {
      name: `Test Recipient ${Date.now()}`,
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.country.delete({ where: { id: testCountry.id } }).catch(() => {})
    await cleanupTestOrganizations([testOrg.id])
  })

  it('should export prismaWithTracking from database package', () => {
    expect(prismaWithTracking).toBeDefined()
    expect(typeof prismaWithTracking).toBe('object')
  })

  it('should create change log when updating RecipientProcessingLocation via DAL', async () => {
    // Arrange - Create location using prismaWithTracking
    const location = await prismaWithTracking.recipientProcessingLocation.create({
      data: {
        organizationId: testOrg.id,
        recipientId: testRecipient.id,
        service: 'Initial service',
        countryId: testCountry.id,
        locationRole: 'PROCESSING',
      },
    })

    // Act - Update using prismaWithTracking
    await prismaWithTracking.recipientProcessingLocation.update({
      where: { id: location.id },
      data: {
        locationRole: 'HOSTING',
      },
    })

    // Assert - Change log should exist
    const changeLogs = await prisma.componentChangeLog.findMany({
      where: {
        organizationId: testOrg.id,
        componentType: 'RecipientProcessingLocation',
        componentId: location.id,
      },
      orderBy: { changedAt: 'asc' },
    })

    expect(changeLogs.length).toBeGreaterThanOrEqual(2) // CREATE + UPDATE
    const updateLog = changeLogs.find((log) => log.changeType === 'UPDATED')
    expect(updateLog).toBeDefined()
    expect(updateLog?.fieldChanged).toBe('locationRole')
  })

  it('should enforce multi-tenancy in change logs', async () => {
    // Arrange - Create second organization
    const { org: org2 } = await createTestOrganization({
      slug: `test-dal-integration-org2-${Date.now()}`,
      userCount: 1,
    })

    const recipient2 = await createTestRecipient(org2.id, {
      name: `Test Recipient Org2 ${Date.now()}`,
    })

    // Create location in org2
    const location = await prismaWithTracking.recipientProcessingLocation.create({
      data: {
        organizationId: org2.id,
        recipientId: recipient2.id,
        service: 'Service in org2',
        countryId: testCountry.id,
        locationRole: 'PROCESSING',
      },
    })

    // Act - Query change logs for org1
    const org1Logs = await prisma.componentChangeLog.findMany({
      where: {
        organizationId: testOrg.id,
        componentType: 'RecipientProcessingLocation',
        componentId: location.id,
      },
    })

    // Query change logs for org2
    const org2Logs = await prisma.componentChangeLog.findMany({
      where: {
        organizationId: org2.id,
        componentType: 'RecipientProcessingLocation',
        componentId: location.id,
      },
    })

    // Assert - Org1 should not see org2's change logs
    expect(org1Logs).toHaveLength(0)
    expect(org2Logs.length).toBeGreaterThanOrEqual(1) // CREATE log

    // Cleanup
    await cleanupTestOrganizations([org2.id])
  })

  it('should preserve change logs across multiple updates', async () => {
    // Arrange - Create location
    const location = await prismaWithTracking.recipientProcessingLocation.create({
      data: {
        organizationId: testOrg.id,
        recipientId: testRecipient.id,
        service: 'Initial service',
        countryId: testCountry.id,
        locationRole: 'PROCESSING',
      },
    })

    // Act - Make multiple updates
    await prismaWithTracking.recipientProcessingLocation.update({
      where: { id: location.id },
      data: { locationRole: 'HOSTING' },
    })

    await prismaWithTracking.recipientProcessingLocation.update({
      where: { id: location.id },
      data: { locationRole: 'PROCESSING' },
    })

    await prismaWithTracking.recipientProcessingLocation.update({
      where: { id: location.id },
      data: { isActive: false },
    })

    // Assert - All changes should be logged
    const changeLogs = await prisma.componentChangeLog.findMany({
      where: {
        organizationId: testOrg.id,
        componentType: 'RecipientProcessingLocation',
        componentId: location.id,
      },
      orderBy: { changedAt: 'asc' },
    })

    expect(changeLogs.length).toBeGreaterThanOrEqual(4) // CREATE + 3 UPDATEs
    expect(changeLogs[0]?.changeType).toBe('CREATED')
    expect(changeLogs.filter((log) => log.changeType === 'UPDATED').length).toBeGreaterThanOrEqual(
      3
    )
  })

  it('should work with DataProcessingActivity updates', async () => {
    // Arrange - Create activity using prismaWithTracking
    const activity = await prismaWithTracking.dataProcessingActivity.create({
      data: {
        organizationId: testOrg.id,
        name: `Test Activity ${Date.now()}`,
        description: 'Test description',
        riskLevel: 'LOW',
        status: 'ACTIVE',
      },
    })

    // Act - Update risk level
    await prismaWithTracking.dataProcessingActivity.update({
      where: { id: activity.id },
      data: {
        riskLevel: 'HIGH',
        requiresDPIA: true,
      },
    })

    // Assert - Change logs should exist
    const changeLogs = await prisma.componentChangeLog.findMany({
      where: {
        organizationId: testOrg.id,
        componentType: 'DataProcessingActivity',
        componentId: activity.id,
      },
      orderBy: { changedAt: 'asc' },
    })

    expect(changeLogs.length).toBeGreaterThanOrEqual(2) // CREATE + UPDATE
    const updateLogs = changeLogs.filter((log) => log.changeType === 'UPDATED')
    expect(updateLogs.length).toBeGreaterThanOrEqual(1)

    // Should have logs for both riskLevel and requiresDPIA changes
    const changedFields = updateLogs.map((log) => log.fieldChanged)
    expect(changedFields).toContain('riskLevel')
    expect(changedFields).toContain('requiresDPIA')
  })
})
