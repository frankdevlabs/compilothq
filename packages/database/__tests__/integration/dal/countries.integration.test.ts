/* eslint-disable @typescript-eslint/no-explicit-any */
// Type assertions needed due to Prisma JSON field type limitations in test data
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  getCountriesByGdprStatus,
  getCountryById,
  getCountryByIsoCode,
  listCountries,
} from '../../../src/dal/countries'
import { prisma } from '../../../src/index'
import {
  cleanupTestDatabase,
  CountryFactory,
  disconnectTestDatabase,
  setupTestDatabase,
} from '../../../src/test-utils'

describe('Countries DAL - Integration Tests', () => {
  beforeAll(() => {
    // Run migrations once before all tests
    setupTestDatabase()
  })

  beforeEach(async () => {
    // Clean database before each test for isolation
    await cleanupTestDatabase()
    // Note: Not restoring countries here since this test suite creates its own test countries
  })

  afterAll(async () => {
    // Disconnect from database after all tests
    await disconnectTestDatabase()
  })

  describe('listCountries', () => {
    it('should create country and retrieve by ID', async () => {
      // Arrange - Create a country using factory
      const countryData = new CountryFactory().build({
        name: 'France',
        isoCode: 'FR',
        isoCode3: 'FRA',
        gdprStatus: ['EU', 'EEA'],
      })

      const createdCountry = await prisma.country.create({
        data: countryData as any,
      })

      // Act - Retrieve the country by ID
      const result = await getCountryById(createdCountry.id)

      // Assert
      expect(result).not.toBeNull()
      expect(result?.id).toBe(createdCountry.id)
      expect(result?.name).toBe('France')
      expect(result?.isoCode).toBe('FR')
      expect(result?.gdprStatus).toEqual(['EU', 'EEA'])
    })

    it('should list all active countries ordered by name', async () => {
      // Arrange - Create multiple countries
      await prisma.country.create({
        data: new CountryFactory().build({
          name: 'Germany',
          isoCode: 'DE',
          isoCode3: 'DEU',
        }) as any,
      })

      await prisma.country.create({
        data: new CountryFactory().build({
          name: 'Belgium',
          isoCode: 'BE',
          isoCode3: 'BEL',
        }) as any,
      })

      await prisma.country.create({
        data: new CountryFactory().build({
          name: 'Austria',
          isoCode: 'AT',
          isoCode3: 'AUT',
        }) as any,
      })

      // Act
      const result = await listCountries()

      // Assert - Should be ordered alphabetically
      expect(result).toHaveLength(3)
      expect(result[0]!.name).toBe('Austria')
      expect(result[1]!.name).toBe('Belgium')
      expect(result[2]!.name).toBe('Germany')
    })
  })

  describe('Unique constraints', () => {
    it('should enforce unique constraint on isoCode', async () => {
      // Arrange - Create a country with isoCode 'FR'
      await prisma.country.create({
        data: new CountryFactory().build({
          name: 'France',
          isoCode: 'FR',
          isoCode3: 'FRA',
        }) as any,
      })

      // Act & Assert - Attempt to create another country with same isoCode
      await expect(
        prisma.country.create({
          data: new CountryFactory().build({
            name: 'Another France',
            isoCode: 'FR', // Duplicate isoCode
            isoCode3: 'XYZ', // Different isoCode3
          }) as any,
        })
      ).rejects.toThrow()
    })

    it('should enforce unique constraint on isoCode3', async () => {
      // Arrange - Create a country with isoCode3 'FRA'
      await prisma.country.create({
        data: new CountryFactory().build({
          name: 'France',
          isoCode: 'FR',
          isoCode3: 'FRA',
        }) as any,
      })

      // Act & Assert - Attempt to create another country with same isoCode3
      await expect(
        prisma.country.create({
          data: new CountryFactory().build({
            name: 'Another France',
            isoCode: 'XX',
            isoCode3: 'FRA', // Duplicate isoCode3
          }) as any,
        })
      ).rejects.toThrow()
    })
  })

  describe('Update and persistence', () => {
    it('should update country and verify persistence', async () => {
      // Arrange - Create a country
      const country = await prisma.country.create({
        data: new CountryFactory().build({
          name: 'Germany',
          isoCode: 'DE',
          isoCode3: 'DEU',
          description: 'Original description',
        }) as any,
      })

      // Act - Update the country
      await prisma.country.update({
        where: { id: country.id },
        data: {
          description: 'Updated description',
          gdprStatus: ['EU', 'EEA', 'EFTA'],
        },
      })

      // Assert - Retrieve and verify update persisted
      const updatedCountry = await getCountryById(country.id)
      expect(updatedCountry?.description).toBe('Updated description')
      expect(updatedCountry?.gdprStatus).toEqual(['EU', 'EEA', 'EFTA'])
      expect(updatedCountry?.name).toBe('Germany') // Unchanged
    })
  })

  describe('Query by gdprStatus array field', () => {
    it('should filter countries by GDPR status correctly', async () => {
      // Arrange - Create countries with different GDPR statuses
      await prisma.country.create({
        data: new CountryFactory().build({
          name: 'France',
          isoCode: 'FR',
          isoCode3: 'FRA',
          gdprStatus: ['EU', 'EEA'],
        }) as any,
      })

      await prisma.country.create({
        data: new CountryFactory().build({
          name: 'Germany',
          isoCode: 'DE',
          isoCode3: 'DEU',
          gdprStatus: ['EU', 'EEA'],
        }) as any,
      })

      await prisma.country.create({
        data: new CountryFactory().build({
          name: 'Switzerland',
          isoCode: 'CH',
          isoCode3: 'CHE',
          gdprStatus: ['EFTA', 'Adequate'],
        }) as any,
      })

      await prisma.country.create({
        data: new CountryFactory().build({
          name: 'United States',
          isoCode: 'US',
          isoCode3: 'USA',
          gdprStatus: ['Third Country'],
        }) as any,
      })

      // Act - Query by EU status
      const euCountries = await getCountriesByGdprStatus('EU')

      // Assert
      expect(euCountries).toHaveLength(2)
      expect(euCountries.map((c) => c.name).sort()).toEqual(['France', 'Germany'])
    })

    it('should handle multiple GDPR status queries', async () => {
      // Arrange - Create countries
      await prisma.country.create({
        data: new CountryFactory().build({
          name: 'Switzerland',
          isoCode: 'CH',
          isoCode3: 'CHE',
          gdprStatus: ['EFTA', 'Adequate'],
        }) as any,
      })

      await prisma.country.create({
        data: new CountryFactory().build({
          name: 'Norway',
          isoCode: 'NO',
          isoCode3: 'NOR',
          gdprStatus: ['EFTA', 'EEA'],
        }) as any,
      })

      // Act - Query by EFTA status
      const eftaCountries = await getCountriesByGdprStatus('EFTA')

      // Assert
      expect(eftaCountries).toHaveLength(2)
      expect(eftaCountries.map((c) => c.name).sort()).toEqual(['Norway', 'Switzerland'])
    })

    it('should return empty array when no countries match status', async () => {
      // Arrange - Create a non-EU country
      await prisma.country.create({
        data: new CountryFactory().build({
          name: 'United States',
          isoCode: 'US',
          isoCode3: 'USA',
          gdprStatus: ['Third Country'],
        }) as any,
      })

      // Act - Query by EU status
      const euCountries = await getCountriesByGdprStatus('EU')

      // Assert
      expect(euCountries).toEqual([])
    })
  })

  describe('getCountryByIsoCode', () => {
    it('should retrieve country by ISO code', async () => {
      // Arrange
      await prisma.country.create({
        data: new CountryFactory().build({
          name: 'Belgium',
          isoCode: 'BE',
          isoCode3: 'BEL',
        }) as any,
      })

      // Act
      const result = await getCountryByIsoCode('BE')

      // Assert
      expect(result).not.toBeNull()
      expect(result?.name).toBe('Belgium')
      expect(result?.isoCode).toBe('BE')
    })

    it('should return null for non-existent ISO code', async () => {
      // Act
      const result = await getCountryByIsoCode('ZZ')

      // Assert
      expect(result).toBeNull()
    })
  })
})
