/**
 * Integration tests for ExternalOrganization DAL functions
 *
 * Tests core CRUD operations for the tenant-bound ExternalOrganization entity.
 * ExternalOrganization represents external legal entities (vendors, partners, authorities)
 * and is scoped to organizations (multi-tenancy).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Country, Organization } from '../../../src/index'
import {
  createExternalOrganization,
  deleteExternalOrganization,
  getExternalOrganizationById,
  listExternalOrganizations,
  prisma,
  updateExternalOrganization,
} from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils'

describe('ExternalOrganization DAL', () => {
  let testCountry: Country
  let testOrg: Organization
  let testOrg2: Organization // For multi-tenancy tests

  beforeAll(async () => {
    // Create test organizations
    const { org: org1 } = await createTestOrganization({
      name: 'Test Org 1',
      slug: `test-org-1-${Date.now()}`,
    })
    testOrg = org1

    const { org: org2 } = await createTestOrganization({
      name: 'Test Org 2',
      slug: `test-org-2-${Date.now()}`,
    })
    testOrg2 = org2

    // Create a test country for FK relationships
    testCountry = await prisma.country.create({
      data: {
        name: 'Test Country',
        isoCode: `TC-${Date.now()}`,
        gdprStatus: ['Third Country'],
        isActive: true,
      },
    })
  })

  afterAll(async () => {
    // Clean up test organizations (cascade deletes external orgs)
    await cleanupTestOrganizations([testOrg.id, testOrg2.id])

    // Clean up test country
    await prisma.country.delete({
      where: {
        id: testCountry.id,
      },
    })
  })

  describe('createExternalOrganization', () => {
    it('should create external organization with required fields only', async () => {
      const legalName = `Test Corp ${Date.now()}`

      const result = await createExternalOrganization({
        organizationId: testOrg.id,
        legalName,
      })

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.organizationId).toBe(testOrg.id)
      expect(result.legalName).toBe(legalName)
      expect(result.tradingName).toBeNull()
      expect(result.isPublicAuthority).toBe(false)
      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it('should create external organization with all optional fields', async () => {
      const legalName = `Full Test Corp ${Date.now()}`
      const tradingName = 'Full Test'

      const result = await createExternalOrganization({
        organizationId: testOrg.id,
        legalName,
        tradingName,
        jurisdiction: 'NL',
        registrationNumber: '12345678',
        vatNumber: 'NL123456789B01',
        headquartersCountryId: testCountry.id,
        operatingCountries: ['NL', 'DE', 'FR'],
        website: 'https://example.com',
        contactEmail: 'contact@example.com',
        contactPhone: '+31201234567',
        isPublicAuthority: true,
        sector: 'Technology',
        notes: 'Test notes',
        metadata: { custom: 'data' },
      })

      expect(result).toBeDefined()
      expect(result.organizationId).toBe(testOrg.id)
      expect(result.legalName).toBe(legalName)
      expect(result.tradingName).toBe(tradingName)
      expect(result.jurisdiction).toBe('NL')
      expect(result.registrationNumber).toBe('12345678')
      expect(result.vatNumber).toBe('NL123456789B01')
      expect(result.headquartersCountryId).toBe(testCountry.id)
      expect(result.operatingCountries).toEqual(['NL', 'DE', 'FR'])
      expect(result.website).toBe('https://example.com')
      expect(result.contactEmail).toBe('contact@example.com')
      expect(result.contactPhone).toBe('+31201234567')
      expect(result.isPublicAuthority).toBe(true)
      expect(result.sector).toBe('Technology')
      expect(result.notes).toBe('Test notes')
      expect(result.metadata).toEqual({ custom: 'data' })
    })
  })

  describe('getExternalOrganizationById', () => {
    it('should retrieve external organization by ID with correct organizationId', async () => {
      // Arrange - Create test organization
      const org = await createExternalOrganization({
        organizationId: testOrg.id,
        legalName: `Get Test Corp ${Date.now()}`,
        headquartersCountryId: testCountry.id,
      })

      // Act
      const result = await getExternalOrganizationById(org.id, testOrg.id)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(org.id)
      expect(result?.organizationId).toBe(testOrg.id)
      expect(result?.legalName).toBe(org.legalName)
    })

    it('should return null for non-existent ID', async () => {
      const result = await getExternalOrganizationById('non-existent-id', testOrg.id)

      expect(result).toBeNull()
    })

    it('should return null when accessing with wrong organizationId (multi-tenancy)', async () => {
      // Arrange - Create external org for testOrg
      const org = await createExternalOrganization({
        organizationId: testOrg.id,
        legalName: `Tenant Test Corp ${Date.now()}`,
      })

      // Act - Try to access with testOrg2's ID
      const result = await getExternalOrganizationById(org.id, testOrg2.id)

      // Assert - Should return null (access denied)
      expect(result).toBeNull()
    })
  })

  describe('listExternalOrganizations', () => {
    beforeAll(async () => {
      // Create test data for list operations
      const baseTime = Date.now()
      for (let i = 0; i < 3; i++) {
        await createExternalOrganization({
          organizationId: testOrg.id,
          legalName: `List Test Corp ${baseTime}-${i}`,
          isPublicAuthority: i === 0, // First one is public authority
          headquartersCountryId: i === 1 ? testCountry.id : undefined,
        })
      }

      // Create one for testOrg2 for isolation testing
      await createExternalOrganization({
        organizationId: testOrg2.id,
        legalName: `Org2 Corp ${baseTime}`,
      })
    })

    it('should list external organizations for specific organization', async () => {
      const result = await listExternalOrganizations(testOrg.id, {})

      expect(result).toBeDefined()
      expect(result.items).toBeInstanceOf(Array)
      expect(result.items.length).toBeGreaterThan(0)
      expect(result.nextCursor).toBeDefined()

      // Verify all results belong to testOrg
      result.items.forEach((item) => {
        expect(item.organizationId).toBe(testOrg.id)
      })
    })

    it('should not return external organizations from other organizations (multi-tenancy)', async () => {
      const org1Result = await listExternalOrganizations(testOrg.id, {})
      const org2Result = await listExternalOrganizations(testOrg2.id, {})

      // Verify no overlap
      const org1Ids = org1Result.items.map((item) => item.id)
      const org2Ids = org2Result.items.map((item) => item.id)

      org1Ids.forEach((id) => {
        expect(org2Ids).not.toContain(id)
      })
    })

    it('should paginate results with cursor', async () => {
      const firstPage = await listExternalOrganizations(testOrg.id, { limit: 2 })

      expect(firstPage.items).toHaveLength(2)
      expect(firstPage.nextCursor).not.toBeNull()

      // Get second page using cursor
      const secondPage = await listExternalOrganizations(testOrg.id, {
        limit: 2,
        cursor: firstPage.nextCursor!,
      })

      expect(secondPage.items).toBeDefined()
      expect(secondPage.items.length).toBeGreaterThan(0)
      // Ensure no overlap
      expect(secondPage.items[0]?.id).not.toBe(firstPage.items[0]?.id)
    })

    it('should filter by legalName', async () => {
      const searchName = `Unique Corp ${Date.now()}`
      await createExternalOrganization({
        organizationId: testOrg.id,
        legalName: searchName,
      })

      const result = await listExternalOrganizations(testOrg.id, {
        legalName: searchName,
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0]?.legalName).toBe(searchName)
    })

    it('should filter by isPublicAuthority', async () => {
      const result = await listExternalOrganizations(testOrg.id, {
        isPublicAuthority: true,
      })

      expect(result.items.length).toBeGreaterThan(0)
      result.items.forEach((org) => {
        expect(org.isPublicAuthority).toBe(true)
        expect(org.organizationId).toBe(testOrg.id)
      })
    })
  })

  describe('updateExternalOrganization', () => {
    it('should update external organization fields', async () => {
      // Arrange
      const org = await createExternalOrganization({
        organizationId: testOrg.id,
        legalName: `Update Test Corp ${Date.now()}`,
      })

      // Act
      const updated = await updateExternalOrganization(org.id, testOrg.id, {
        tradingName: 'Updated Trading Name',
        website: 'https://updated.example.com',
      })

      // Assert
      expect(updated.id).toBe(org.id)
      expect(updated.organizationId).toBe(testOrg.id)
      expect(updated.legalName).toBe(org.legalName) // Unchanged
      expect(updated.tradingName).toBe('Updated Trading Name')
      expect(updated.website).toBe('https://updated.example.com')
    })

    it('should handle explicit null for optional fields', async () => {
      // Arrange
      const org = await createExternalOrganization({
        organizationId: testOrg.id,
        legalName: `Null Test Corp ${Date.now()}`,
        tradingName: 'Original Trading Name',
        website: 'https://original.example.com',
      })

      // Act - Clear optional fields
      const updated = await updateExternalOrganization(org.id, testOrg.id, {
        tradingName: null,
        website: null,
      })

      // Assert
      expect(updated.tradingName).toBeNull()
      expect(updated.website).toBeNull()
    })

    it('should throw error when updating with wrong organizationId (multi-tenancy)', async () => {
      // Arrange - Create external org for testOrg
      const org = await createExternalOrganization({
        organizationId: testOrg.id,
        legalName: `Protected Corp ${Date.now()}`,
      })

      // Act & Assert - Try to update with testOrg2's ID
      await expect(
        updateExternalOrganization(org.id, testOrg2.id, {
          tradingName: 'Hacked Name',
        })
      ).rejects.toThrow('ExternalOrganization not found or does not belong to organization')
    })
  })

  describe('deleteExternalOrganization', () => {
    it('should delete external organization', async () => {
      // Arrange
      const org = await createExternalOrganization({
        organizationId: testOrg.id,
        legalName: `Delete Test Corp ${Date.now()}`,
      })

      // Act
      const deleted = await deleteExternalOrganization(org.id, testOrg.id)

      // Assert
      expect(deleted.id).toBe(org.id)

      // Verify deletion
      const found = await getExternalOrganizationById(org.id, testOrg.id)
      expect(found).toBeNull()
    })

    it('should throw error when deleting with wrong organizationId (multi-tenancy)', async () => {
      // Arrange - Create external org for testOrg
      const org = await createExternalOrganization({
        organizationId: testOrg.id,
        legalName: `Protected Delete Corp ${Date.now()}`,
      })

      // Act & Assert - Try to delete with testOrg2's ID
      await expect(deleteExternalOrganization(org.id, testOrg2.id)).rejects.toThrow(
        'ExternalOrganization not found or does not belong to organization'
      )

      // Verify it still exists
      const found = await getExternalOrganizationById(org.id, testOrg.id)
      expect(found).not.toBeNull()
    })
  })
})
