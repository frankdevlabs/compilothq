import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createProcessor,
  deleteProcessor,
  getProcessorById,
  listProcessorsByOrganization,
  updateProcessor,
} from '../../../src/dal/processors'
import type { Organization } from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils/factories'

/**
 * Processors DAL - Integration Tests
 *
 * Tests processor data access layer functions against a real test database.
 * Uses shared organizations for testing multi-tenancy isolation.
 *
 * Coverage goals:
 * - CRUD operations
 * - Multi-tenancy isolation
 * - Cursor-based pagination
 * - Type and status filtering
 */
describe('Processors DAL - Integration Tests', () => {
  // Shared test organizations
  let org1: Organization
  let org2: Organization

  beforeAll(async () => {
    // Create shared test organizations
    const { org: testOrg1 } = await createTestOrganization({
      slug: 'processors-dal-org1',
      userCount: 1,
    })
    const { org: testOrg2 } = await createTestOrganization({
      slug: 'processors-dal-org2',
      userCount: 1,
    })

    org1 = testOrg1
    org2 = testOrg2
  })

  afterAll(async () => {
    // Cleanup shared test data
    await cleanupTestOrganizations([org1.id, org2.id])
  })

  describe('createProcessor', () => {
    it('should create processor with required fields', async () => {
      // Arrange
      const processorData = {
        name: 'AWS Cloud Services',
        type: 'DATA_PROCESSOR' as const,
        description: 'Cloud infrastructure provider',
        organizationId: org1.id,
      }

      // Act
      const result = await createProcessor(processorData)

      // Assert
      expect(result).toBeDefined()
      expect(result.name).toBe(processorData.name)
      expect(result.type).toBe(processorData.type)
      expect(result.description).toBe(processorData.description)
      expect(result.organizationId).toBe(org1.id)
      expect(result.isActive).toBe(true) // Default value
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('should create processor with custom isActive status', async () => {
      // Act
      const result = await createProcessor({
        name: 'Inactive Processor',
        type: 'SERVICE_PROVIDER',
        organizationId: org1.id,
        isActive: false,
      })

      // Assert
      expect(result.isActive).toBe(false)
    })
  })

  describe('listProcessorsByOrganization', () => {
    it('should return only processors for current organization', async () => {
      // Arrange - Create processors for both orgs
      const org1Processor = await createProcessor({
        name: 'Org1 Processor',
        type: 'DATA_PROCESSOR',
        organizationId: org1.id,
      })

      await createProcessor({
        name: 'Org2 Processor',
        type: 'DATA_PROCESSOR',
        organizationId: org2.id,
      })

      // Act - List org1 processors
      const { items: org1Processors } = await listProcessorsByOrganization(org1.id)

      // Assert - Verify multi-tenancy isolation
      expect(org1Processors.length).toBeGreaterThanOrEqual(1)
      expect(org1Processors.every((processor) => processor.organizationId === org1.id)).toBe(true)
      expect(org1Processors.some((processor) => processor.id === org1Processor.id)).toBe(true)
    })

    it('should support cursor-based pagination', async () => {
      // Arrange - Create multiple processors
      await Promise.all([
        createProcessor({
          name: 'Processor 1',
          type: 'DATA_PROCESSOR',
          organizationId: org1.id,
        }),
        createProcessor({
          name: 'Processor 2',
          type: 'DATA_PROCESSOR',
          organizationId: org1.id,
        }),
        createProcessor({
          name: 'Processor 3',
          type: 'DATA_PROCESSOR',
          organizationId: org1.id,
        }),
      ])

      // Act - Get first page with limit 2
      const firstPage = await listProcessorsByOrganization(org1.id, { limit: 2 })

      // Assert - First page should have 2 items and a cursor
      expect(firstPage.items.length).toBe(2)
      expect(firstPage.nextCursor).toBeTruthy()

      // Act - Get second page using cursor
      const secondPage = await listProcessorsByOrganization(org1.id, {
        limit: 2,
        cursor: firstPage.nextCursor!,
      })

      // Assert - Second page should have items and no overlap with first page
      expect(secondPage.items.length).toBeGreaterThanOrEqual(1)
      const firstPageIds = firstPage.items.map((p) => p.id)
      expect(secondPage.items.every((p) => !firstPageIds.includes(p.id))).toBe(true)
    })

    it('should filter processors by type', async () => {
      // Arrange - Create processors with different types
      const dataProcessor = await createProcessor({
        name: 'Data Processor',
        type: 'DATA_PROCESSOR',
        organizationId: org1.id,
      })

      const serviceProvider = await createProcessor({
        name: 'Service Provider',
        type: 'SERVICE_PROVIDER',
        organizationId: org1.id,
      })

      // Act - List only DATA_PROCESSOR types
      const { items: dataProcessors } = await listProcessorsByOrganization(org1.id, {
        type: 'DATA_PROCESSOR',
      })

      // Assert
      expect(dataProcessors.every((processor) => processor.type === 'DATA_PROCESSOR')).toBe(true)
      expect(dataProcessors.some((processor) => processor.id === dataProcessor.id)).toBe(true)
      expect(dataProcessors.some((processor) => processor.id === serviceProvider.id)).toBe(false)
    })

    it('should filter processors by isActive status', async () => {
      // Arrange - Create active and inactive processors
      const activeProcessor = await createProcessor({
        name: 'Active Processor',
        type: 'DATA_PROCESSOR',
        organizationId: org1.id,
        isActive: true,
      })

      const inactiveProcessor = await createProcessor({
        name: 'Inactive Processor',
        type: 'DATA_PROCESSOR',
        organizationId: org1.id,
        isActive: false,
      })

      // Act - List only active processors
      const { items: activeProcessors } = await listProcessorsByOrganization(org1.id, {
        isActive: true,
      })

      // Assert
      expect(activeProcessors.every((processor) => processor.isActive === true)).toBe(true)
      expect(activeProcessors.some((processor) => processor.id === activeProcessor.id)).toBe(true)
      expect(activeProcessors.some((processor) => processor.id === inactiveProcessor.id)).toBe(
        false
      )
    })
  })

  describe('getProcessorById', () => {
    it('should retrieve processor by ID', async () => {
      // Arrange
      const processor = await createProcessor({
        name: 'Test Processor',
        type: 'SUB_PROCESSOR',
        description: 'Test description',
        organizationId: org1.id,
      })

      // Act
      const result = await getProcessorById(processor.id)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(processor.id)
      expect(result?.name).toBe('Test Processor')
      expect(result?.type).toBe('SUB_PROCESSOR')
      expect(result?.description).toBe('Test description')
    })

    it('should return null when processor does not exist', async () => {
      // Act
      const result = await getProcessorById('non-existent-id')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('updateProcessor', () => {
    it('should update processor fields', async () => {
      // Arrange
      const processor = await createProcessor({
        name: 'Original Name',
        type: 'DATA_PROCESSOR',
        description: 'Original description',
        organizationId: org1.id,
        isActive: true,
      })

      // Act
      const result = await updateProcessor(processor.id, {
        name: 'Updated Name',
        type: 'JOINT_CONTROLLER',
        description: 'Updated description',
        isActive: false,
      })

      // Assert
      expect(result.id).toBe(processor.id)
      expect(result.name).toBe('Updated Name')
      expect(result.type).toBe('JOINT_CONTROLLER')
      expect(result.description).toBe('Updated description')
      expect(result.isActive).toBe(false)
      expect(result.updatedAt.getTime()).toBeGreaterThan(processor.updatedAt.getTime())
    })
  })

  describe('deleteProcessor', () => {
    it('should delete processor', async () => {
      // Arrange
      const processor = await createProcessor({
        name: 'Processor to Delete',
        type: 'DATA_PROCESSOR',
        organizationId: org1.id,
      })

      // Act
      const result = await deleteProcessor(processor.id)

      // Assert
      expect(result.id).toBe(processor.id)

      // Verify processor is deleted
      const deletedProcessor = await getProcessorById(processor.id)
      expect(deletedProcessor).toBeNull()
    })
  })

  describe('multi-tenancy isolation', () => {
    it('should not expose org1 processors to org2', async () => {
      // Arrange - Create processor for org1
      const org1Processor = await createProcessor({
        name: 'Org1 Secret Processor',
        type: 'DATA_PROCESSOR',
        organizationId: org1.id,
      })

      // Act - List org2 processors
      const { items: org2Processors } = await listProcessorsByOrganization(org2.id)

      // Assert - org1 processor should not be in org2 list
      expect(org2Processors.every((processor) => processor.organizationId === org2.id)).toBe(true)
      expect(org2Processors.some((processor) => processor.id === org1Processor.id)).toBe(false)
    })
  })
})
