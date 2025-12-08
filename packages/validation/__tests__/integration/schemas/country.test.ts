import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import { CountryCreateSchema, CountryUpdateSchema } from '../../../src/schemas/reference/country'

describe('Country Validation Schemas - Integration Tests', () => {
  describe('CountryCreateSchema', () => {
    it('should validate valid country data', () => {
      // Arrange
      const validData = {
        name: 'France',
        isoCode: 'fr', // Should be transformed to uppercase
        isoCode3: 'fra', // Should be transformed to uppercase
        gdprStatus: ['EU', 'EEA'],
        description: 'French Republic',
        isActive: true,
      }

      // Act
      const result = CountryCreateSchema.parse(validData)

      // Assert
      expect(result.name).toBe('France')
      expect(result.isoCode).toBe('FR') // Transformed to uppercase
      expect(result.isoCode3).toBe('FRA') // Transformed to uppercase
      expect(result.gdprStatus).toEqual(['EU', 'EEA'])
      expect(result.description).toBe('French Republic')
      expect(result.isActive).toBe(true)
    })

    it('should validate minimal country data with defaults', () => {
      // Arrange
      const minimalData = {
        name: 'Germany',
        isoCode: 'de',
        gdprStatus: ['EU'],
      }

      // Act
      const result = CountryCreateSchema.parse(minimalData)

      // Assert
      expect(result.name).toBe('Germany')
      expect(result.isoCode).toBe('DE')
      expect(result.gdprStatus).toEqual(['EU'])
      expect(result.isActive).toBe(true) // Default value
    })

    it('should fail validation when name is missing', () => {
      // Arrange
      const invalidData = {
        isoCode: 'fr',
        gdprStatus: ['EU'],
      }

      // Act & Assert
      expect(() => CountryCreateSchema.parse(invalidData)).toThrow(ZodError)

      try {
        CountryCreateSchema.parse(invalidData)
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError)
        const zodError = error as ZodError
        expect(zodError.issues).toHaveLength(1)
        expect(zodError.issues[0]?.path).toEqual(['name'])
        expect(zodError.issues[0]?.message).toBe(
          'Invalid input: expected string, received undefined'
        )
      }
    })

    it('should fail validation when isoCode is not 2 characters', () => {
      // Arrange
      const invalidData = {
        name: 'France',
        isoCode: 'FRA', // Should be 2 characters, not 3
        gdprStatus: ['EU'],
      }

      // Act & Assert
      expect(() => CountryCreateSchema.parse(invalidData)).toThrow(ZodError)

      try {
        CountryCreateSchema.parse(invalidData)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.issues[0]?.path).toEqual(['isoCode'])
        expect(zodError.issues[0]?.message).toBe('ISO code must be exactly 2 characters')
      }
    })

    it('should fail validation when isoCode3 is not 3 characters', () => {
      // Arrange
      const invalidData = {
        name: 'France',
        isoCode: 'fr',
        isoCode3: 'fr', // Should be 3 characters, not 2
        gdprStatus: ['EU'],
      }

      // Act & Assert
      expect(() => CountryCreateSchema.parse(invalidData)).toThrow(ZodError)

      try {
        CountryCreateSchema.parse(invalidData)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.issues[0]?.path).toEqual(['isoCode3'])
        expect(zodError.issues[0]?.message).toBe('ISO 3-letter code must be exactly 3 characters')
      }
    })

    it('should fail validation when gdprStatus is empty', () => {
      // Arrange
      const invalidData = {
        name: 'France',
        isoCode: 'fr',
        gdprStatus: [],
      }

      // Act & Assert
      expect(() => CountryCreateSchema.parse(invalidData)).toThrow(ZodError)

      try {
        CountryCreateSchema.parse(invalidData)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.issues[0]?.path).toEqual(['gdprStatus'])
        expect(zodError.issues[0]?.message).toBe('At least one GDPR status is required')
      }
    })

    it('should fail validation when gdprStatus contains invalid values', () => {
      // Arrange
      const invalidData = {
        name: 'France',
        isoCode: 'fr',
        gdprStatus: ['INVALID_STATUS'],
      }

      // Act & Assert
      expect(() => CountryCreateSchema.parse(invalidData)).toThrow(ZodError)

      try {
        CountryCreateSchema.parse(invalidData)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.issues[0]?.path).toEqual(['gdprStatus', 0])
        expect(zodError.issues[0]?.message).toBe(
          'GDPR status must be one of: EU, EEA, EFTA, Third Country, Adequate'
        )
      }
    })

    it('should allow multiple valid GDPR statuses', () => {
      // Arrange
      const validData = {
        name: 'Norway',
        isoCode: 'no',
        gdprStatus: ['EEA', 'EFTA'],
      }

      // Act
      const result = CountryCreateSchema.parse(validData)

      // Assert
      expect(result.gdprStatus).toEqual(['EEA', 'EFTA'])
    })

    it('should transform isoCode to uppercase', () => {
      // Arrange
      const data = {
        name: 'France',
        isoCode: 'fr',
        gdprStatus: ['EU'],
      }

      // Act
      const result = CountryCreateSchema.parse(data)

      // Assert
      expect(result.isoCode).toBe('FR')
    })

    it('should transform isoCode3 to uppercase', () => {
      // Arrange
      const data = {
        name: 'France',
        isoCode: 'fr',
        isoCode3: 'fra',
        gdprStatus: ['EU'],
      }

      // Act
      const result = CountryCreateSchema.parse(data)

      // Assert
      expect(result.isoCode3).toBe('FRA')
    })
  })

  describe('CountryUpdateSchema', () => {
    it('should validate partial updates', () => {
      // Arrange
      const partialUpdate = {
        description: 'Updated description',
      }

      // Act
      const result = CountryUpdateSchema.parse(partialUpdate)

      // Assert
      expect(result.description).toBe('Updated description')
    })

    it('should allow updating only gdprStatus', () => {
      // Arrange
      const partialUpdate = {
        gdprStatus: ['EU', 'EEA', 'Adequate'],
      }

      // Act
      const result = CountryUpdateSchema.parse(partialUpdate)

      // Assert
      expect(result.gdprStatus).toEqual(['EU', 'EEA', 'Adequate'])
    })

    it('should allow updating isActive status', () => {
      // Arrange
      const partialUpdate = {
        isActive: false,
      }

      // Act
      const result = CountryUpdateSchema.parse(partialUpdate)

      // Assert
      expect(result.isActive).toBe(false)
    })

    it('should allow empty update object', () => {
      // Arrange
      const emptyUpdate = {}

      // Act
      const result = CountryUpdateSchema.parse(emptyUpdate)

      // Assert
      expect(result).toEqual({})
    })

    it('should still enforce validation rules on provided fields', () => {
      // Arrange
      const invalidUpdate = {
        isoCode: 'FRA', // Should be 2 characters
      }

      // Act & Assert
      expect(() => CountryUpdateSchema.parse(invalidUpdate)).toThrow(ZodError)

      try {
        CountryUpdateSchema.parse(invalidUpdate)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.issues[0]?.path).toEqual(['isoCode'])
        expect(zodError.issues[0]?.message).toBe('ISO code must be exactly 2 characters')
      }
    })
  })
})
