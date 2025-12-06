import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '../../../src/index'
import { createTestOrganization } from '../../../src/test-utils/factories/organizationFactory'

/**
 * Integration tests for RecipientProcessingLocation model
 * Tests basic model creation with required fields, foreign key constraints,
 * optional fields, defaults, timestamps, and metadata JSON field.
 *
 * Limited to 6-8 tests maximum covering critical model behaviors.
 */
describe('RecipientProcessingLocation Model', () => {
  const testOrgIds: string[] = []
  const testRecipientIds: string[] = []
  const testCountryIds: string[] = []
  let testCountryId: string
  let testOrgId: string

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

    // Create test organization
    const { org } = await createTestOrganization({
      slug: `test-rpl-model-${Date.now()}`,
    })
    testOrgId = org.id
    testOrgIds.push(org.id)
  })

  afterAll(async () => {
    // Clean up test recipients (cascade will delete processing locations)
    await prisma.recipient.deleteMany({
      where: { id: { in: testRecipientIds } },
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

  it('should create RecipientProcessingLocation with required fields', async () => {
    // Arrange - Create recipient
    const recipient = await prisma.recipient.create({
      data: {
        organizationId: testOrgId,
        name: 'Test Recipient',
        type: 'PROCESSOR',
        isActive: true,
      },
    })
    testRecipientIds.push(recipient.id)

    // Act - Create processing location with required fields only
    const location = await prisma.recipientProcessingLocation.create({
      data: {
        organizationId: testOrgId,
        recipientId: recipient.id,
        service: 'Email processing service',
        countryId: testCountryId,
        locationRole: 'PROCESSING',
      },
    })

    // Assert - Required fields set correctly
    expect(location.id).toBeDefined()
    expect(location.organizationId).toBe(testOrgId)
    expect(location.recipientId).toBe(recipient.id)
    expect(location.service).toBe('Email processing service')
    expect(location.countryId).toBe(testCountryId)
    expect(location.locationRole).toBe('PROCESSING')
  })

  it('should enforce foreign key constraint for organizationId', async () => {
    // Arrange - Create recipient
    const recipient = await prisma.recipient.create({
      data: {
        organizationId: testOrgId,
        name: 'Test Recipient FK',
        type: 'PROCESSOR',
        isActive: true,
      },
    })
    testRecipientIds.push(recipient.id)

    // Act & Assert - Invalid organizationId should throw
    await expect(
      prisma.recipientProcessingLocation.create({
        data: {
          organizationId: 'invalid-org-id',
          recipientId: recipient.id,
          service: 'Test service',
          countryId: testCountryId,
          locationRole: 'HOSTING',
        },
      })
    ).rejects.toThrow()
  })

  it('should enforce foreign key constraint for recipientId', async () => {
    // Act & Assert - Invalid recipientId should throw
    await expect(
      prisma.recipientProcessingLocation.create({
        data: {
          organizationId: testOrgId,
          recipientId: 'invalid-recipient-id',
          service: 'Test service',
          countryId: testCountryId,
          locationRole: 'HOSTING',
        },
      })
    ).rejects.toThrow()
  })

  it('should enforce foreign key constraint for countryId', async () => {
    // Arrange - Create recipient
    const recipient = await prisma.recipient.create({
      data: {
        organizationId: testOrgId,
        name: 'Test Recipient Country FK',
        type: 'PROCESSOR',
        isActive: true,
      },
    })
    testRecipientIds.push(recipient.id)

    // Act & Assert - Invalid countryId should throw
    await expect(
      prisma.recipientProcessingLocation.create({
        data: {
          organizationId: testOrgId,
          recipientId: recipient.id,
          service: 'Test service',
          countryId: 'invalid-country-id',
          locationRole: 'HOSTING',
        },
      })
    ).rejects.toThrow()
  })

  it('should support optional fields (purposeId, transferMechanismId)', async () => {
    // Arrange - Create recipient and purpose
    const recipient = await prisma.recipient.create({
      data: {
        organizationId: testOrgId,
        name: 'Test Recipient Optional',
        type: 'PROCESSOR',
        isActive: true,
      },
    })
    testRecipientIds.push(recipient.id)

    const purpose = await prisma.purpose.create({
      data: {
        organizationId: testOrgId,
        name: 'Test Purpose',
        category: 'ANALYTICS',
        scope: 'INTERNAL',
      },
    })

    // Act - Create location with optional fields
    const location = await prisma.recipientProcessingLocation.create({
      data: {
        organizationId: testOrgId,
        recipientId: recipient.id,
        service: 'Analytics service',
        countryId: testCountryId,
        locationRole: 'BOTH',
        purposeId: purpose.id,
        purposeText: 'Fallback purpose text',
        transferMechanismId: null, // Explicitly null
      },
    })

    // Assert - Optional fields set correctly
    expect(location.purposeId).toBe(purpose.id)
    expect(location.purposeText).toBe('Fallback purpose text')
    expect(location.transferMechanismId).toBeNull()

    // Cleanup purpose
    await prisma.purpose.delete({ where: { id: purpose.id } })
  })

  it('should set isActive default to true and track timestamps', async () => {
    // Arrange - Create recipient
    const recipient = await prisma.recipient.create({
      data: {
        organizationId: testOrgId,
        name: 'Test Recipient Defaults',
        type: 'PROCESSOR',
        isActive: true,
      },
    })
    testRecipientIds.push(recipient.id)

    // Act - Create location without specifying isActive
    const location = await prisma.recipientProcessingLocation.create({
      data: {
        organizationId: testOrgId,
        recipientId: recipient.id,
        service: 'Default test service',
        countryId: testCountryId,
        locationRole: 'HOSTING',
      },
    })

    // Assert - Defaults and timestamps
    expect(location.isActive).toBe(true) // Default value
    expect(location.createdAt).toBeInstanceOf(Date)
    expect(location.updatedAt).toBeInstanceOf(Date)
    expect(location.createdAt.getTime()).toBeLessThanOrEqual(location.updatedAt.getTime())
  })

  it('should support metadata JSON field', async () => {
    // Arrange - Create recipient
    const recipient = await prisma.recipient.create({
      data: {
        organizationId: testOrgId,
        name: 'Test Recipient Metadata',
        type: 'PROCESSOR',
        isActive: true,
      },
    })
    testRecipientIds.push(recipient.id)

    // Act - Create location with metadata
    const metadata = {
      customField: 'value',
      nestedData: {
        key: 'nested value',
      },
      arrayData: [1, 2, 3],
    }

    const location = await prisma.recipientProcessingLocation.create({
      data: {
        organizationId: testOrgId,
        recipientId: recipient.id,
        service: 'Metadata test service',
        countryId: testCountryId,
        locationRole: 'PROCESSING',
        metadata,
      },
    })

    // Assert - Metadata stored and retrieved correctly
    expect(location.metadata).toEqual(metadata)

    // Retrieve and verify
    const retrieved = await prisma.recipientProcessingLocation.findUnique({
      where: { id: location.id },
    })
    expect(retrieved?.metadata).toEqual(metadata)
  })

  it('should cascade delete when recipient is deleted', async () => {
    // Arrange - Create recipient with location
    const recipient = await prisma.recipient.create({
      data: {
        organizationId: testOrgId,
        name: 'Test Recipient Cascade',
        type: 'PROCESSOR',
        isActive: true,
      },
    })

    const location = await prisma.recipientProcessingLocation.create({
      data: {
        organizationId: testOrgId,
        recipientId: recipient.id,
        service: 'Cascade test service',
        countryId: testCountryId,
        locationRole: 'HOSTING',
      },
    })

    // Act - Delete recipient (should cascade to location)
    await prisma.recipient.delete({
      where: { id: recipient.id },
    })

    // Assert - Location should be deleted
    const locationExists = await prisma.recipientProcessingLocation.findUnique({
      where: { id: location.id },
    })
    expect(locationExists).toBeNull()
  })
})
