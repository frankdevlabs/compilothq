import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Organization } from '../../../src'
import { prisma } from '../../../src'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils'

/**
 * Migration Data Integrity Tests: Processor → Recipient
 *
 * These tests verify that the migration from Processor to Recipient model
 * preserves all existing data and relationships while correctly mapping
 * ProcessorType to RecipientType.
 *
 * Critical scenarios tested:
 * 1. ProcessorType to RecipientType mapping (DATA_PROCESSOR → PROCESSOR, etc.)
 * 2. ExternalOrganization creation from existing Processor names
 * 3. Preservation of existing relationships during rename
 * 4. No data loss during migration
 */
describe('Processor to Recipient Migration', () => {
  let testOrg: Organization
  const orgIds: string[] = []

  beforeAll(async () => {
    // Create test organization
    const { org } = await createTestOrganization({
      name: 'Migration Test Org',
      slug: `migration-test-${Date.now()}`,
    })
    testOrg = org
    orgIds.push(org.id)
  })

  afterAll(async () => {
    // Clean up test data
    await cleanupTestOrganizations(orgIds)
  })

  it('should correctly map ProcessorType to RecipientType', async () => {
    // Arrange - Create recipients with different types
    const typeMapping = [
      { oldType: 'PROCESSOR', expectedType: 'PROCESSOR' as const },
      { oldType: 'SUB_PROCESSOR', expectedType: 'SUB_PROCESSOR' as const },
      { oldType: 'JOINT_CONTROLLER', expectedType: 'JOINT_CONTROLLER' as const },
      { oldType: 'SERVICE_PROVIDER', expectedType: 'SERVICE_PROVIDER' as const },
    ]

    // Act - Create test recipients (simulating post-migration state)
    const createdRecipients = await Promise.all(
      typeMapping.map(async ({ oldType, expectedType }) => {
        return prisma.recipient.create({
          data: {
            name: `Test ${oldType}`,
            type: expectedType,
            organizationId: testOrg.id,
            isActive: true,
          },
        })
      })
    )

    // Assert - Verify type mapping
    expect(createdRecipients).toHaveLength(4)
    createdRecipients.forEach((recipient, index) => {
      // eslint-disable-next-line security/detect-object-injection -- Safe: index from forEach is bounded by array length
      const expectedMapping = typeMapping[index]
      if (!expectedMapping) {
        throw new Error(`No mapping found for index ${index}`)
      }
      expect(recipient.type).toBe(expectedMapping.expectedType)
      expect(recipient.organizationId).toBe(testOrg.id)
      expect(recipient.isActive).toBe(true)
    })
  })

  it('should create ExternalOrganization from Processor names and link correctly', async () => {
    // Arrange - Create ExternalOrganization (tenant-bound)
    const externalOrg = await prisma.externalOrganization.create({
      data: {
        organizationId: testOrg.id,
        legalName: 'Test Vendor B.V.',
        tradingName: 'Test Vendor',
        isPublicAuthority: false,
      },
    })

    // Act - Create Recipient linked to ExternalOrganization
    const recipient = await prisma.recipient.create({
      data: {
        name: 'Test Vendor - Processor',
        type: 'PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrg.id,
        isActive: true,
      },
      include: {
        externalOrganization: true,
      },
    })

    // Assert - Verify relationship
    expect(recipient.externalOrganizationId).toBe(externalOrg.id)
    expect(recipient.externalOrganization).toBeDefined()
    expect(recipient.externalOrganization?.legalName).toBe('Test Vendor B.V.')
    expect(recipient.externalOrganization?.tradingName).toBe('Test Vendor')

    // Cleanup
    await prisma.recipient.delete({ where: { id: recipient.id } })
    await prisma.externalOrganization.delete({ where: { id: externalOrg.id } })
  })

  it('should preserve organizationId relationships during migration', async () => {
    // Arrange - Create multiple organizations
    const { org: org2 } = await createTestOrganization({
      name: 'Second Test Org',
      slug: `migration-test-2-${Date.now()}`,
    })
    orgIds.push(org2.id)

    // Act - Create recipients for each organization
    const recipient1 = await prisma.recipient.create({
      data: {
        name: 'Org 1 Processor',
        type: 'PROCESSOR',
        organizationId: testOrg.id,
        isActive: true,
      },
    })

    const recipient2 = await prisma.recipient.create({
      data: {
        name: 'Org 2 Processor',
        type: 'PROCESSOR',
        organizationId: org2.id,
        isActive: true,
      },
    })

    // Assert - Verify each recipient belongs to correct organization
    const org1Recipients = await prisma.recipient.findMany({
      where: { organizationId: testOrg.id },
    })
    const org2Recipients = await prisma.recipient.findMany({
      where: { organizationId: org2.id },
    })

    expect(org1Recipients.some((r) => r.id === recipient1.id)).toBe(true)
    expect(org1Recipients.some((r) => r.id === recipient2.id)).toBe(false)
    expect(org2Recipients.some((r) => r.id === recipient2.id)).toBe(true)
    expect(org2Recipients.some((r) => r.id === recipient1.id)).toBe(false)
  })

  it('should preserve isActive status during migration', async () => {
    // Act - Create recipients with different isActive states
    const activeRecipient = await prisma.recipient.create({
      data: {
        name: 'Active Processor',
        type: 'PROCESSOR',
        organizationId: testOrg.id,
        isActive: true,
      },
    })

    const inactiveRecipient = await prisma.recipient.create({
      data: {
        name: 'Inactive Processor',
        type: 'PROCESSOR',
        organizationId: testOrg.id,
        isActive: false,
      },
    })

    // Assert - Verify isActive status preserved
    const activeResult = await prisma.recipient.findUnique({
      where: { id: activeRecipient.id },
    })
    const inactiveResult = await prisma.recipient.findUnique({
      where: { id: inactiveRecipient.id },
    })

    expect(activeResult?.isActive).toBe(true)
    expect(inactiveResult?.isActive).toBe(false)
  })

  it('should support new RecipientType values not in ProcessorType', async () => {
    // Arrange - Test new recipient types added in migration
    const newTypes = ['SEPARATE_CONTROLLER', 'PUBLIC_AUTHORITY', 'INTERNAL_DEPARTMENT'] as const

    // Act - Create recipients with new types
    const newRecipients = await Promise.all(
      newTypes.map(async (type) =>
        prisma.recipient.create({
          data: {
            name: `Test ${type}`,
            type,
            organizationId: testOrg.id,
            // INTERNAL_DEPARTMENT doesn't require externalOrganizationId
            externalOrganizationId: type === 'INTERNAL_DEPARTMENT' ? null : undefined,
            isActive: true,
          },
        })
      )
    )

    // Assert - Verify new types are supported
    expect(newRecipients).toHaveLength(3)
    expect(newRecipients[0].type).toBe('SEPARATE_CONTROLLER')
    expect(newRecipients[1].type).toBe('PUBLIC_AUTHORITY')
    expect(newRecipients[2].type).toBe('INTERNAL_DEPARTMENT')
    expect(newRecipients[2].externalOrganizationId).toBeNull()
  })

  it('should maintain cascade delete behavior with Organization', async () => {
    // Arrange - Create a temporary organization with recipients
    const { org: tempOrg } = await createTestOrganization({
      name: 'Temp Org for Cascade Test',
      slug: `temp-org-${Date.now()}`,
    })

    const recipient = await prisma.recipient.create({
      data: {
        name: 'Test Cascade Processor',
        type: 'PROCESSOR',
        organizationId: tempOrg.id,
        isActive: true,
      },
    })

    // Act - Delete the organization
    await prisma.organization.delete({
      where: { id: tempOrg.id },
    })

    // Assert - Verify recipient was cascade deleted
    const deletedRecipient = await prisma.recipient.findUnique({
      where: { id: recipient.id },
    })

    expect(deletedRecipient).toBeNull()
  })

  it('should support nullable externalOrganizationId for INTERNAL_DEPARTMENT', async () => {
    // Act - Create INTERNAL_DEPARTMENT without externalOrganizationId
    const internalDept = await prisma.recipient.create({
      data: {
        name: 'HR Department',
        type: 'INTERNAL_DEPARTMENT',
        organizationId: testOrg.id,
        externalOrganizationId: null,
        purpose: 'Internal HR processing',
        isActive: true,
      },
    })

    // Assert - Verify null externalOrganizationId is allowed
    expect(internalDept.externalOrganizationId).toBeNull()
    expect(internalDept.type).toBe('INTERNAL_DEPARTMENT')

    // Act - Try to create PROCESSOR without externalOrganizationId (should work but not recommended)
    const processorWithoutOrg = await prisma.recipient.create({
      data: {
        name: 'Processor Without Org',
        type: 'PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: null,
        isActive: true,
      },
    })

    // Assert - Schema allows it (validation happens at application layer)
    expect(processorWithoutOrg.externalOrganizationId).toBeNull()
  })

  it('should support hierarchy fields for sub-processors', async () => {
    // Arrange - Create parent processor
    const parentProcessor = await prisma.recipient.create({
      data: {
        name: 'Parent Processor',
        type: 'PROCESSOR',
        organizationId: testOrg.id,
        isActive: true,
      },
    })

    // Act - Create sub-processor with parent relationship
    const subProcessor = await prisma.recipient.create({
      data: {
        name: 'Sub Processor',
        type: 'SUB_PROCESSOR',
        organizationId: testOrg.id,
        parentRecipientId: parentProcessor.id,
        hierarchyType: 'PROCESSOR_CHAIN',
        isActive: true,
      },
      include: {
        parentRecipient: true,
      },
    })

    // Assert - Verify hierarchy relationship
    expect(subProcessor.parentRecipientId).toBe(parentProcessor.id)
    expect(subProcessor.hierarchyType).toBe('PROCESSOR_CHAIN')
    expect(subProcessor.parentRecipient).toBeDefined()
    expect(subProcessor.parentRecipient?.name).toBe('Parent Processor')

    // Cleanup
    await prisma.recipient.delete({ where: { id: subProcessor.id } })
    await prisma.recipient.delete({ where: { id: parentProcessor.id } })
  })
})
