import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getCountriesByGdprStatus,
  getCountryById,
  getCountryByIsoCode,
  listCountries,
} from '../../../src/dal/countries'
// Import the mocked prisma instance
import { prisma } from '../../../src/index'
import type { Country } from '.prisma/client'

// Mock the prisma client
vi.mock('../../../src/index', () => ({
  prisma: {
    country: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

describe('Countries DAL - Unit Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('listCountries', () => {
    it('should return all active countries ordered by name', async () => {
      // Arrange
      const mockCountries: Country[] = [
        {
          id: '1',
          name: 'Belgium',
          isoCode: 'BE',
          isoCode3: 'BEL',
          gdprStatus: ['EU', 'EEA'],
          description: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'France',
          isoCode: 'FR',
          isoCode3: 'FRA',
          gdprStatus: ['EU', 'EEA'],
          description: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.country.findMany).mockResolvedValue(mockCountries)

      // Act
      const result = await listCountries()

      // Assert
      expect(result).toEqual(mockCountries)
      expect(prisma.country.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })
      expect(prisma.country.findMany).toHaveBeenCalledOnce()
    })

    it('should return empty array when no countries exist', async () => {
      // Arrange
      vi.mocked(prisma.country.findMany).mockResolvedValue([])

      // Act
      const result = await listCountries()

      // Assert
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })
  })

  describe('getCountryById', () => {
    it('should return country when ID exists', async () => {
      // Arrange
      const mockCountry: Country = {
        id: '1',
        name: 'France',
        isoCode: 'FR',
        isoCode3: 'FRA',
        gdprStatus: ['EU', 'EEA'],
        description: 'French Republic',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.country.findUnique).mockResolvedValue(mockCountry)

      // Act
      const result = await getCountryById('1')

      // Assert
      expect(result).toEqual(mockCountry)
      expect(prisma.country.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })

    it('should return null when ID does not exist', async () => {
      // Arrange
      vi.mocked(prisma.country.findUnique).mockResolvedValue(null)

      // Act
      const result = await getCountryById('non-existent-id')

      // Assert
      expect(result).toBeNull()
      expect(prisma.country.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      })
    })
  })

  describe('getCountryByIsoCode', () => {
    it('should return country when ISO code exists', async () => {
      // Arrange
      const mockCountry: Country = {
        id: '1',
        name: 'Germany',
        isoCode: 'DE',
        isoCode3: 'DEU',
        gdprStatus: ['EU', 'EEA'],
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.country.findUnique).mockResolvedValue(mockCountry)

      // Act
      const result = await getCountryByIsoCode('DE')

      // Assert
      expect(result).toEqual(mockCountry)
      expect(prisma.country.findUnique).toHaveBeenCalledWith({
        where: { isoCode: 'DE' },
      })
    })

    it('should return null when ISO code does not exist', async () => {
      // Arrange
      vi.mocked(prisma.country.findUnique).mockResolvedValue(null)

      // Act
      const result = await getCountryByIsoCode('ZZ')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getCountriesByGdprStatus', () => {
    it('should filter countries by GDPR status correctly', async () => {
      // Arrange
      const mockCountries: Country[] = [
        {
          id: '1',
          name: 'France',
          isoCode: 'FR',
          isoCode3: 'FRA',
          gdprStatus: ['EU', 'EEA'],
          description: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Switzerland',
          isoCode: 'CH',
          isoCode3: 'CHE',
          gdprStatus: ['EFTA', 'Adequate'],
          description: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          name: 'United States',
          isoCode: 'US',
          isoCode3: 'USA',
          gdprStatus: ['Third Country'],
          description: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.country.findMany).mockResolvedValue(mockCountries)

      // Act
      const result = await getCountriesByGdprStatus('EU')

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('France')
      expect(prisma.country.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })
    })

    it('should return empty array when no countries match GDPR status', async () => {
      // Arrange
      const mockCountries: Country[] = [
        {
          id: '1',
          name: 'United States',
          isoCode: 'US',
          isoCode3: 'USA',
          gdprStatus: ['Third Country'],
          description: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.country.findMany).mockResolvedValue(mockCountries)

      // Act
      const result = await getCountriesByGdprStatus('EU')

      // Assert
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })
  })
})
