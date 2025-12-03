/**
 * Integration tests for ExternalOrganization DAL functions
 *
 * Tests core CRUD operations for the global ExternalOrganization entity.
 * ExternalOrganization represents external legal entities (vendors, partners, authorities)
 * and is not scoped to any organization (global entity).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Country } from '../../../src/index'
import {
  createExternalOrganization,
  deleteExternalOrganization,
  getExternalOrganizationById,
  listExternalOrganizations,
  prisma,
  updateExternalOrganization,
} from '../../../src/index'

describe('ExternalOrganization DAL', () => {
  let testCountry: Country
  const createdExternalOrgIds: string[] = []

  beforeAll(async () => {
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
    // Clean up all created external organizations
    if (createdExternalOrgIds.length > 0) {
      await prisma.externalOrganization.deleteMany({
        where: {
          id: {
            in: createdExternalOrgIds,
          },
        },
      })
    }

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
        legalName,
      })

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.legalName).toBe(legalName)
      expect(result.tradingName).toBeNull()
      expect(result.isPublicAuthority).toBe(false)
      expect(result.createdAt).toBeInstanceOf(Date)

      createdExternalOrgIds.push(result.id)
    })

    it('should create external organization with all optional fields', async () => {
      const legalName = `Full Test Corp ${Date.now()}`
      const tradingName = 'Full Test'

      const result = await createExternalOrganization({
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

      createdExternalOrgIds.push(result.id)
    })
  })

  describe('getExternalOrganizationById', () => {
    it('should retrieve external organization by ID', async () => {
      // Arrange - Create test organization
      const org = await createExternalOrganization({
        legalName: `Get Test Corp ${Date.now()}`,
        headquartersCountryId: testCountry.id,
      })
      createdExternalOrgIds.push(org.id)

      // Act
      const result = await getExternalOrganizationById(org.id)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(org.id)
      expect(result?.legalName).toBe(org.legalName)
    })

    it('should return null for non-existent ID', async () => {
      const result = await getExternalOrganizationById('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('listExternalOrganizations', () => {
    beforeAll(async () => {
      // Create test data for list operations
      const baseTime = Date.now()
      for (let i = 0; i < 3; i++) {
        const org = await createExternalOrganization({
          legalName: `List Test Corp ${baseTime}-${i}`,
          isPublicAuthority: i === 0, // First one is public authority
          headquartersCountryId: i === 1 ? testCountry.id : undefined,
        })
        createdExternalOrgIds.push(org.id)
      }
    })

    it('should list external organizations with default pagination', async () => {
      const result = await listExternalOrganizations({})

      expect(result).toBeDefined()
      expect(result.items).toBeInstanceOf(Array)
      expect(result.items.length).toBeGreaterThan(0)
      expect(result.nextCursor).toBeDefined()
    })

    it('should paginate results with cursor', async () => {
      const firstPage = await listExternalOrganizations({ limit: 2 })

      expect(firstPage.items).toHaveLength(2)
      expect(firstPage.nextCursor).not.toBeNull()

      // Get second page using cursor
      const secondPage = await listExternalOrganizations({
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
      const org = await createExternalOrganization({
        legalName: searchName,
      })
      createdExternalOrgIds.push(org.id)

      const result = await listExternalOrganizations({
        legalName: searchName,
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0]?.legalName).toBe(searchName)
    })

    it('should filter by isPublicAuthority', async () => {
      const result = await listExternalOrganizations({
        isPublicAuthority: true,
      })

      expect(result.items.length).toBeGreaterThan(0)
      result.items.forEach((org) => {
        expect(org.isPublicAuthority).toBe(true)
      })
    })
  })

  describe('updateExternalOrganization', () => {
    it('should update external organization fields', async () => {
      // Arrange
      const org = await createExternalOrganization({
        legalName: `Update Test Corp ${Date.now()}`,
      })
      createdExternalOrgIds.push(org.id)

      // Act
      const updated = await updateExternalOrganization(org.id, {
        tradingName: 'Updated Trading Name',
        website: 'https://updated.example.com',
      })

      // Assert
      expect(updated.id).toBe(org.id)
      expect(updated.legalName).toBe(org.legalName) // Unchanged
      expect(updated.tradingName).toBe('Updated Trading Name')
      expect(updated.website).toBe('https://updated.example.com')
    })

    it('should handle explicit null for optional fields', async () => {
      // Arrange
      const org = await createExternalOrganization({
        legalName: `Null Test Corp ${Date.now()}`,
        tradingName: 'Original Trading Name',
        website: 'https://original.example.com',
      })
      createdExternalOrgIds.push(org.id)

      // Act - Clear optional fields
      const updated = await updateExternalOrganization(org.id, {
        tradingName: null,
        website: null,
      })

      // Assert
      expect(updated.tradingName).toBeNull()
      expect(updated.website).toBeNull()
    })
  })

  describe('deleteExternalOrganization', () => {
    it('should delete external organization', async () => {
      // Arrange
      const org = await createExternalOrganization({
        legalName: `Delete Test Corp ${Date.now()}`,
      })

      // Act
      const deleted = await deleteExternalOrganization(org.id)

      // Assert
      expect(deleted.id).toBe(org.id)

      // Verify deletion
      const found = await getExternalOrganizationById(org.id)
      expect(found).toBeNull()

      // Remove from cleanup list since already deleted
      const index = createdExternalOrgIds.indexOf(org.id)
      if (index > -1) {
        createdExternalOrgIds.splice(index, 1)
      }
    })
  })
})
