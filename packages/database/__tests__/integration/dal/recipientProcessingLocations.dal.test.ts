import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createRecipientProcessingLocation,
  deactivateRecipientProcessingLocation,
  getActiveLocationsForRecipient,
  getAllLocationsForRecipient,
  getLocationsWithParentChain,
  moveRecipientProcessingLocation,
  updateRecipientProcessingLocation,
} from '../../../src/dal/recipientProcessingLocations'
import { prisma } from '../../../src/index'
import { createTestOrganization } from '../../../src/test-utils/factories/organizationFactory'

/**
 * Integration tests for RecipientProcessingLocation DAL operations
 * Tests DAL functions including CRUD operations, validation, soft delete,
 * transactions, and hierarchy traversal.
 *
 * Limited to 8 tests maximum covering critical DAL behaviors.
 */
describe('RecipientProcessingLocation DAL Operations', () => {
  const testOrgIds: string[] = []
  const testRecipientIds: string[] = []
  const testCountryIds: string[] = []
  const testPurposeIds: string[] = []
  const testMechanismIds: string[] = []

  let testOrgId: string
  let euCountryId: string
  let usCountryId: string
  let testRecipientId: string
  let transferMechanismId: string

  beforeAll(async () => {
    // Create test organization with EU country
    let euCountry = await prisma.country.findFirst({
      where: { isoCode: 'FR' },
    })

    if (!euCountry) {
      euCountry = await prisma.country.create({
        data: {
          name: 'France',
          isoCode: 'FR',
          isoCode3: 'FRA',
          gdprStatus: ['EU', 'EEA'],
          isActive: true,
        },
      })
      testCountryIds.push(euCountry.id)
    }

    euCountryId = euCountry.id

    // Create US (third country) for testing transfer mechanisms
    let usCountry = await prisma.country.findFirst({
      where: { isoCode: 'US' },
    })

    if (!usCountry) {
      usCountry = await prisma.country.create({
        data: {
          name: 'United States',
          isoCode: 'US',
          isoCode3: 'USA',
          gdprStatus: ['Third Country'],
          isActive: true,
        },
      })
      testCountryIds.push(usCountry.id)
    }

    usCountryId = usCountry.id

    // Create test organization with headquarters country
    const { org } = await createTestOrganization({
      slug: `test-rpl-dal-${Date.now()}`,
    })
    testOrgId = org.id
    testOrgIds.push(org.id)

    // Set organization headquarters country
    await prisma.organization.update({
      where: { id: org.id },
      data: { headquartersCountryId: euCountryId },
    })

    // Create test recipient
    const recipient = await prisma.recipient.create({
      data: {
        organizationId: testOrgId,
        name: 'Test Recipient DAL',
        type: 'PROCESSOR',
        isActive: true,
      },
    })
    testRecipientId = recipient.id
    testRecipientIds.push(recipient.id)

    // Create test transfer mechanism
    let mechanism = await prisma.transferMechanism.findFirst({
      where: { code: 'SCC' },
    })

    if (!mechanism) {
      mechanism = await prisma.transferMechanism.create({
        data: {
          name: 'Standard Contractual Clauses',
          code: 'SCC',
          category: 'SAFEGUARD',
          description: 'EU Standard Contractual Clauses',
          typicalUseCase: 'Third-country transfers with appropriate safeguards',
          gdprArticle: 'Article 46(2)(c)',
          isDerogation: false,
          requiresAdequacy: false,
          requiresDocumentation: true,
          isActive: true,
        },
      })
      testMechanismIds.push(mechanism.id)
    }

    transferMechanismId = mechanism.id
  })

  afterAll(async () => {
    // Clean up test recipients (cascade will delete processing locations)
    await prisma.recipient.deleteMany({
      where: { id: { in: testRecipientIds } },
    })

    // Clean up test purposes
    if (testPurposeIds.length > 0) {
      await prisma.purpose.deleteMany({
        where: { id: { in: testPurposeIds } },
      })
    }

    // Clean up test organizations
    await prisma.organization.deleteMany({
      where: { id: { in: testOrgIds } },
    })

    // Clean up test countries
    if (testCountryIds.length > 0) {
      await prisma.country.deleteMany({
        where: { id: { in: testCountryIds } },
      })
    }

    // Clean up test transfer mechanisms
    if (testMechanismIds.length > 0) {
      await prisma.transferMechanism.deleteMany({
        where: { id: { in: testMechanismIds } },
      })
    }
  })

  it('should create RecipientProcessingLocation with valid data', async () => {
    // Act - Create location with DAL function
    const location = await createRecipientProcessingLocation({
      organizationId: testOrgId,
      recipientId: testRecipientId,
      service: 'Email processing service',
      countryId: euCountryId,
      locationRole: 'PROCESSING',
    })

    // Assert
    expect(location).toBeDefined()
    expect(location.organizationId).toBe(testOrgId)
    expect(location.recipientId).toBe(testRecipientId)
    expect(location.service).toBe('Email processing service')
    expect(location.countryId).toBe(euCountryId)
    expect(location.locationRole).toBe('PROCESSING')
    expect(location.isActive).toBe(true)
  })

  it('should enforce transfer mechanism for EU→US transfer', async () => {
    // Act & Assert - Creating US location without mechanism should fail
    await expect(
      createRecipientProcessingLocation({
        organizationId: testOrgId,
        recipientId: testRecipientId,
        service: 'US data center without mechanism',
        countryId: usCountryId,
        locationRole: 'HOSTING',
      })
    ).rejects.toThrow(/transfer mechanism required/i)
  })

  it('should allow transferMechanismId for any location', async () => {
    // Act - Create US location with mechanism
    const location = await createRecipientProcessingLocation({
      organizationId: testOrgId,
      recipientId: testRecipientId,
      service: 'US data center with SCC',
      countryId: usCountryId,
      locationRole: 'HOSTING',
      transferMechanismId,
    })

    // Assert
    expect(location).toBeDefined()
    expect(location.countryId).toBe(usCountryId)
    expect(location.transferMechanismId).toBe(transferMechanismId)
    expect(location.isActive).toBe(true)
  })

  it('should filter active locations in getActiveLocationsForRecipient', async () => {
    // Arrange - Create active and inactive locations
    const activeLocation = await createRecipientProcessingLocation({
      organizationId: testOrgId,
      recipientId: testRecipientId,
      service: 'Active service',
      countryId: euCountryId,
      locationRole: 'PROCESSING',
    })

    const inactiveLocation = await prisma.recipientProcessingLocation.create({
      data: {
        organizationId: testOrgId,
        recipientId: testRecipientId,
        service: 'Inactive service',
        countryId: euCountryId,
        locationRole: 'HOSTING',
        isActive: false,
      },
    })

    // Act - Get active locations
    const activeLocations = await getActiveLocationsForRecipient(testRecipientId)

    // Assert - Only active location returned
    const locationIds = activeLocations.map((l) => l.id)
    expect(locationIds).toContain(activeLocation.id)
    expect(locationIds).not.toContain(inactiveLocation.id)
  })

  it('should allow country change in updateRecipientProcessingLocation', async () => {
    // Arrange - Create EU location
    const location = await createRecipientProcessingLocation({
      organizationId: testOrgId,
      recipientId: testRecipientId,
      service: 'Original EU service',
      countryId: euCountryId,
      locationRole: 'PROCESSING',
    })

    // Act - Update to US (validation disabled, so no mechanism required)
    const updated = await updateRecipientProcessingLocation(location.id, {
      countryId: usCountryId,
      transferMechanismId,
    })

    // Assert
    expect(updated.countryId).toBe(usCountryId)
    expect(updated.transferMechanismId).toBe(transferMechanismId)
  })

  it('should soft delete in deactivateRecipientProcessingLocation', async () => {
    // Arrange - Create location
    const location = await createRecipientProcessingLocation({
      organizationId: testOrgId,
      recipientId: testRecipientId,
      service: 'Service to deactivate',
      countryId: euCountryId,
      locationRole: 'BOTH',
    })

    // Act - Deactivate
    const deactivated = await deactivateRecipientProcessingLocation(location.id)

    // Assert - Location still exists but isActive false
    expect(deactivated.isActive).toBe(false)
    expect(deactivated.id).toBe(location.id)

    // Verify it's excluded from active queries
    const activeLocations = await getActiveLocationsForRecipient(testRecipientId)
    const activeIds = activeLocations.map((l) => l.id)
    expect(activeIds).not.toContain(location.id)

    // Verify it's included in all locations query
    const allLocations = await getAllLocationsForRecipient(testRecipientId)
    const allIds = allLocations.map((l) => l.id)
    expect(allIds).toContain(location.id)
  })

  it('should atomically create new and deactivate old in moveRecipientProcessingLocation', async () => {
    // Arrange - Create original location
    const original = await createRecipientProcessingLocation({
      organizationId: testOrgId,
      recipientId: testRecipientId,
      service: 'Original location service',
      countryId: euCountryId,
      locationRole: 'HOSTING',
    })

    // Act - Move to US with mechanism
    const moved = await moveRecipientProcessingLocation(original.id, {
      countryId: usCountryId,
      transferMechanismId,
      service: 'Moved to US service',
    })

    // Assert - New location created
    expect(moved.id).not.toBe(original.id)
    expect(moved.countryId).toBe(usCountryId)
    expect(moved.service).toBe('Moved to US service')
    expect(moved.transferMechanismId).toBe(transferMechanismId)
    expect(moved.isActive).toBe(true)

    // Assert - Old location deactivated
    const oldLocation = await prisma.recipientProcessingLocation.findUnique({
      where: { id: original.id },
    })
    expect(oldLocation?.isActive).toBe(false)
  })

  it('should traverse hierarchy in getLocationsWithParentChain', async () => {
    // Arrange - Create processor hierarchy
    const processor = await prisma.recipient.create({
      data: {
        organizationId: testOrgId,
        name: 'Parent Processor',
        type: 'PROCESSOR',
        isActive: true,
      },
    })
    testRecipientIds.push(processor.id)

    const processorLocation = await createRecipientProcessingLocation({
      organizationId: testOrgId,
      recipientId: processor.id,
      service: 'Parent processor service',
      countryId: euCountryId,
      locationRole: 'PROCESSING',
    })

    // Create sub-processor with parent
    const subProcessor = await prisma.recipient.create({
      data: {
        organizationId: testOrgId,
        name: 'Sub Processor',
        type: 'SUB_PROCESSOR',
        parentRecipientId: processor.id,
        hierarchyType: 'PROCESSOR_CHAIN',
        isActive: true,
      },
    })
    testRecipientIds.push(subProcessor.id)

    const subProcessorLocation = await createRecipientProcessingLocation({
      organizationId: testOrgId,
      recipientId: subProcessor.id,
      service: 'Sub-processor service',
      countryId: usCountryId,
      locationRole: 'PROCESSING',
      transferMechanismId,
    })

    // Act - Get locations with parent chain
    const result = await getLocationsWithParentChain(subProcessor.id, testOrgId)

    // Assert - Both sub-processor and parent locations included
    expect(result).toHaveLength(2)

    // Sub-processor (depth 0)
    const subProcessorResult = result.find((r) => r.recipientId === subProcessor.id)
    expect(subProcessorResult).toBeDefined()
    expect(subProcessorResult?.depth).toBe(0)
    expect(subProcessorResult?.locations).toHaveLength(1)
    expect(subProcessorResult?.locations[0].id).toBe(subProcessorLocation.id)

    // Parent processor (depth 1)
    const processorResult = result.find((r) => r.recipientId === processor.id)
    expect(processorResult).toBeDefined()
    expect(processorResult?.depth).toBe(1)
    expect(processorResult?.locations).toHaveLength(1)
    expect(processorResult?.locations[0].id).toBe(processorLocation.id)
  })
})
