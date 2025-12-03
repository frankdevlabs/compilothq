import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createRecipient,
  deleteRecipient,
  getRecipientById,
  getRecipientByIdForOrg,
  listRecipientsByOrganization,
  updateRecipient,
} from '../../../src/dal/recipients'
import type { ExternalOrganization, Organization, RecipientType } from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils/factories'
import {
  cleanupTestExternalOrganizations,
  createTestExternalOrganization,
} from '../../../src/test-utils/factories/externalOrganizationFactory'

/**
 * Recipients DAL - Core CRUD Integration Tests
 *
 * Tests recipient data access layer functions against a real test database.
 * Focuses on CRUD operations and multi-tenancy isolation.
 *
 * Coverage goals:
 * - CRUD operations with organizationId scoping
 * - Multi-tenancy isolation (getRecipientByIdForOrg)
 * - Optional externalOrganizationId (INTERNAL_DEPARTMENT)
 * - Cursor-based pagination
 * - Type and status filtering
 */
describe('Recipients DAL - Core CRUD Integration Tests', () => {
  // Shared test organizations
  let org1: Organization
  let org2: Organization
  let externalOrg1: ExternalOrganization
  let externalOrg2: ExternalOrganization

  beforeAll(async () => {
    // Create shared test organizations
    const { org: testOrg1 } = await createTestOrganization({
      slug: 'recipients-dal-org1',
      userCount: 1,
    })
    const { org: testOrg2 } = await createTestOrganization({
      slug: 'recipients-dal-org2',
      userCount: 1,
    })

    org1 = testOrg1
    org2 = testOrg2

    // Create shared external organizations
    externalOrg1 = await createTestExternalOrganization({
      legalName: 'AWS Cloud Services Inc.',
      tradingName: 'AWS',
    })
    externalOrg2 = await createTestExternalOrganization({
      legalName: 'Google Ireland Limited',
      tradingName: 'Google',
    })
  })

  afterAll(async () => {
    // Cleanup shared test data
    await cleanupTestOrganizations([org1.id, org2.id])
    await cleanupTestExternalOrganizations([externalOrg1.id, externalOrg2.id])
  })

  describe('createRecipient', () => {
    it('should create recipient with required fields and organizationId scoping', async () => {
      // Arrange
      const recipientData = {
        name: 'AWS Cloud Services',
        type: 'PROCESSOR' as RecipientType,
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        description: 'Cloud infrastructure provider',
        purpose: 'Data hosting and processing',
      }

      // Act
      const result = await createRecipient(recipientData)

      // Assert
      expect(result).toBeDefined()
      expect(result.name).toBe(recipientData.name)
      expect(result.type).toBe(recipientData.type)
      expect(result.organizationId).toBe(org1.id)
      expect(result.externalOrganizationId).toBe(externalOrg1.id)
      expect(result.description).toBe(recipientData.description)
      expect(result.purpose).toBe(recipientData.purpose)
      expect(result.isActive).toBe(true) // Default value
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('should create INTERNAL_DEPARTMENT without externalOrganizationId', async () => {
      // Act
      const result = await createRecipient({
        name: 'HR Department',
        type: 'INTERNAL_DEPARTMENT',
        organizationId: org1.id,
        description: 'Internal human resources',
      })

      // Assert
      expect(result.type).toBe('INTERNAL_DEPARTMENT')
      expect(result.externalOrganizationId).toBeNull()
      expect(result.organizationId).toBe(org1.id)
    })

    it('should create recipient with optional hierarchy fields', async () => {
      // Arrange - Create parent recipient first
      const parent = await createRecipient({
        name: 'Parent Processor',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      // Act - Create sub-processor with parent
      const result = await createRecipient({
        name: 'Sub-Processor',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg2.id,
        parentRecipientId: parent.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      // Assert
      expect(result.parentRecipientId).toBe(parent.id)
      expect(result.hierarchyType).toBe('PROCESSOR_CHAIN')
    })
  })

  describe('getRecipientById', () => {
    it('should retrieve recipient by ID with relations', async () => {
      // Arrange
      const recipient = await createRecipient({
        name: 'Test Recipient',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        description: 'Test description',
      })

      // Act
      const result = await getRecipientById(recipient.id)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(recipient.id)
      expect(result?.name).toBe('Test Recipient')
      expect(result?.type).toBe('PROCESSOR')
      expect(result?.externalOrganization).toBeDefined()
      expect(result?.externalOrganization?.id).toBe(externalOrg1.id)
    })

    it('should return null when recipient does not exist', async () => {
      // Act
      const result = await getRecipientById('non-existent-id')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getRecipientByIdForOrg', () => {
    it('should retrieve recipient when organizationId matches', async () => {
      // Arrange
      const recipient = await createRecipient({
        name: 'Org1 Recipient',
        type: 'SERVICE_PROVIDER',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      // Act
      const result = await getRecipientByIdForOrg(recipient.id, org1.id)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(recipient.id)
      expect(result?.organizationId).toBe(org1.id)
    })

    it('should return null when organizationId does not match (multi-tenancy enforcement)', async () => {
      // Arrange - Create recipient for org1
      const org1Recipient = await createRecipient({
        name: 'Org1 Exclusive Recipient',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      // Act - Try to access from org2
      const result = await getRecipientByIdForOrg(org1Recipient.id, org2.id)

      // Assert - Should return null (tenant isolation)
      expect(result).toBeNull()
    })

    it('should return null when recipient does not exist', async () => {
      // Act
      const result = await getRecipientByIdForOrg('non-existent-id', org1.id)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('listRecipientsByOrganization', () => {
    it('should return only recipients for current organization', async () => {
      // Arrange - Create recipients for both orgs
      const org1Recipient = await createRecipient({
        name: 'Org1 Recipient',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      await createRecipient({
        name: 'Org2 Recipient',
        type: 'PROCESSOR',
        organizationId: org2.id,
        externalOrganizationId: externalOrg2.id,
      })

      // Act - List org1 recipients
      const { items: org1Recipients } = await listRecipientsByOrganization(org1.id)

      // Assert - Verify multi-tenancy isolation
      expect(org1Recipients.length).toBeGreaterThanOrEqual(1)
      expect(org1Recipients.every((recipient) => recipient.organizationId === org1.id)).toBe(true)
      expect(org1Recipients.some((recipient) => recipient.id === org1Recipient.id)).toBe(true)
    })

    it('should support cursor-based pagination', async () => {
      // Arrange - Create multiple recipients
      await Promise.all([
        createRecipient({
          name: 'Recipient 1',
          type: 'PROCESSOR',
          organizationId: org1.id,
          externalOrganizationId: externalOrg1.id,
        }),
        createRecipient({
          name: 'Recipient 2',
          type: 'PROCESSOR',
          organizationId: org1.id,
          externalOrganizationId: externalOrg1.id,
        }),
        createRecipient({
          name: 'Recipient 3',
          type: 'PROCESSOR',
          organizationId: org1.id,
          externalOrganizationId: externalOrg1.id,
        }),
      ])

      // Act - Get first page with limit 2
      const firstPage = await listRecipientsByOrganization(org1.id, { limit: 2 })

      // Assert - First page should have 2 items and a cursor
      expect(firstPage.items.length).toBe(2)
      expect(firstPage.nextCursor).toBeTruthy()

      // Act - Get second page using cursor
      const secondPage = await listRecipientsByOrganization(org1.id, {
        limit: 2,
        cursor: firstPage.nextCursor!,
      })

      // Assert - Second page should have items and no overlap with first page
      expect(secondPage.items.length).toBeGreaterThanOrEqual(1)
      const firstPageIds = firstPage.items.map((r) => r.id)
      expect(secondPage.items.every((r) => !firstPageIds.includes(r.id))).toBe(true)
    })

    it('should filter recipients by type', async () => {
      // Arrange - Create recipients with different types
      const processor = await createRecipient({
        name: 'Data Processor',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      const serviceProvider = await createRecipient({
        name: 'Service Provider',
        type: 'SERVICE_PROVIDER',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      // Act - List only PROCESSOR types
      const { items: processors } = await listRecipientsByOrganization(org1.id, {
        type: 'PROCESSOR',
      })

      // Assert
      expect(processors.every((recipient) => recipient.type === 'PROCESSOR')).toBe(true)
      expect(processors.some((recipient) => recipient.id === processor.id)).toBe(true)
      expect(processors.some((recipient) => recipient.id === serviceProvider.id)).toBe(false)
    })

    it('should filter recipients by isActive status', async () => {
      // Arrange - Create active and inactive recipients
      const activeRecipient = await createRecipient({
        name: 'Active Recipient',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        isActive: true,
      })

      const inactiveRecipient = await createRecipient({
        name: 'Inactive Recipient',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        isActive: false,
      })

      // Act - List only active recipients
      const { items: activeRecipients } = await listRecipientsByOrganization(org1.id, {
        isActive: true,
      })

      // Assert
      expect(activeRecipients.every((recipient) => recipient.isActive === true)).toBe(true)
      expect(activeRecipients.some((recipient) => recipient.id === activeRecipient.id)).toBe(true)
      expect(activeRecipients.some((recipient) => recipient.id === inactiveRecipient.id)).toBe(
        false
      )
    })
  })

  describe('updateRecipient', () => {
    it('should update recipient fields preserving multi-tenancy', async () => {
      // Arrange
      const recipient = await createRecipient({
        name: 'Original Name',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        description: 'Original description',
        isActive: true,
      })

      // Act
      const result = await updateRecipient(recipient.id, {
        name: 'Updated Name',
        type: 'JOINT_CONTROLLER',
        description: 'Updated description',
        purpose: 'Joint data analysis',
        isActive: false,
      })

      // Assert
      expect(result.id).toBe(recipient.id)
      expect(result.name).toBe('Updated Name')
      expect(result.type).toBe('JOINT_CONTROLLER')
      expect(result.description).toBe('Updated description')
      expect(result.purpose).toBe('Joint data analysis')
      expect(result.isActive).toBe(false)
      expect(result.organizationId).toBe(org1.id) // Should not change
      expect(result.updatedAt.getTime()).toBeGreaterThan(recipient.updatedAt.getTime())
    })

    it('should handle explicit null for optional fields', async () => {
      // Arrange
      const recipient = await createRecipient({
        name: 'Recipient with Data',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        description: 'Some description',
        purpose: 'Some purpose',
      })

      // Act - Clear optional fields
      const result = await updateRecipient(recipient.id, {
        description: null,
        purpose: null,
      })

      // Assert
      expect(result.description).toBeNull()
      expect(result.purpose).toBeNull()
    })
  })

  describe('deleteRecipient', () => {
    it('should delete recipient and cascade to children', async () => {
      // Arrange - Create parent and child
      const parent = await createRecipient({
        name: 'Parent to Delete',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      const child = await createRecipient({
        name: 'Child Recipient',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: parent.id,
      })

      // Act - Delete parent
      const result = await deleteRecipient(parent.id)

      // Assert
      expect(result.id).toBe(parent.id)

      // Verify parent is deleted
      const deletedParent = await getRecipientById(parent.id)
      expect(deletedParent).toBeNull()

      // Verify child's parentRecipientId is set to null (onDelete: SetNull)
      const updatedChild = await getRecipientById(child.id)
      expect(updatedChild).toBeDefined()
      expect(updatedChild?.parentRecipientId).toBeNull()
    })
  })

  describe('multi-tenancy isolation', () => {
    it('should not expose org1 recipients to org2', async () => {
      // Arrange - Create recipient for org1
      const org1Recipient = await createRecipient({
        name: 'Org1 Secret Recipient',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      // Act - List org2 recipients
      const { items: org2Recipients } = await listRecipientsByOrganization(org2.id)

      // Assert - org1 recipient should not be in org2 list
      expect(org2Recipients.every((recipient) => recipient.organizationId === org2.id)).toBe(true)
      expect(org2Recipients.some((recipient) => recipient.id === org1Recipient.id)).toBe(false)
    })
  })
})
