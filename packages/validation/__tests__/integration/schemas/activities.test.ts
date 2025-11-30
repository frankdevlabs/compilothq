import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import {
  ActivityCreateSchema,
  ActivityFiltersSchema,
  ActivityUpdateSchema,
} from '../../../src/schemas/activities'

describe('Activity Validation Schemas - Integration Tests', () => {
  describe('ActivityCreateSchema', () => {
    it('should validate valid activity data', () => {
      // Arrange
      const validData = {
        name: 'Customer Data Processing',
        description: 'Processing customer personal data for service delivery',
      }

      // Act
      const result = ActivityCreateSchema.parse(validData)

      // Assert
      expect(result.name).toBe('Customer Data Processing')
      expect(result.description).toBe('Processing customer personal data for service delivery')
    })

    it('should validate minimal activity data without optional fields', () => {
      // Arrange
      const minimalData = {
        name: 'Email Marketing Campaign',
      }

      // Act
      const result = ActivityCreateSchema.parse(minimalData)

      // Assert
      expect(result.name).toBe('Email Marketing Campaign')
      expect(result.description).toBeUndefined()
    })

    it('should fail validation when name is missing', () => {
      // Arrange
      const invalidData = {
        description: 'Some description',
      }

      // Act & Assert
      expect(() => ActivityCreateSchema.parse(invalidData)).toThrow(ZodError)

      try {
        ActivityCreateSchema.parse(invalidData)
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError)
        const zodError = error as ZodError
        expect(zodError.errors).toHaveLength(1)
        expect(zodError.errors[0]?.path).toEqual(['name'])
        expect(zodError.errors[0]?.message).toBe('Required')
      }
    })

    it('should fail validation when name is empty string', () => {
      // Arrange
      const invalidData = {
        name: '',
        description: 'Some description',
      }

      // Act & Assert
      expect(() => ActivityCreateSchema.parse(invalidData)).toThrow(ZodError)

      try {
        ActivityCreateSchema.parse(invalidData)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.errors[0]?.path).toEqual(['name'])
        expect(zodError.errors[0]?.message).toBe('Activity name is required')
      }
    })

    it('should allow null description', () => {
      // Arrange
      const validData = {
        name: 'Test Activity',
        description: null,
      }

      // Act
      const result = ActivityCreateSchema.parse(validData)

      // Assert
      expect(result.name).toBe('Test Activity')
      expect(result.description).toBeNull()
    })
  })

  describe('ActivityUpdateSchema', () => {
    it('should validate partial updates', () => {
      // Arrange
      const partialUpdate = {
        description: 'Updated description',
      }

      // Act
      const result = ActivityUpdateSchema.parse(partialUpdate)

      // Assert
      expect(result.description).toBe('Updated description')
      expect(result.name).toBeUndefined()
    })

    it('should allow updating only name', () => {
      // Arrange
      const partialUpdate = {
        name: 'Updated Activity Name',
      }

      // Act
      const result = ActivityUpdateSchema.parse(partialUpdate)

      // Assert
      expect(result.name).toBe('Updated Activity Name')
    })

    it('should allow empty update object', () => {
      // Arrange
      const emptyUpdate = {}

      // Act
      const result = ActivityUpdateSchema.parse(emptyUpdate)

      // Assert
      expect(result).toEqual({})
    })

    it('should still enforce validation rules on provided fields', () => {
      // Arrange
      const invalidUpdate = {
        name: '', // Should not be empty
      }

      // Act & Assert
      expect(() => ActivityUpdateSchema.parse(invalidUpdate)).toThrow(ZodError)

      try {
        ActivityUpdateSchema.parse(invalidUpdate)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.errors[0]?.path).toEqual(['name'])
        expect(zodError.errors[0]?.message).toBe('Activity name is required')
      }
    })
  })

  describe('ActivityFiltersSchema', () => {
    it('should validate filters with all fields', () => {
      // Arrange
      const filters = {
        status: 'ACTIVE' as const,
        limit: 25,
        cursor: 'cursor-id-123',
      }

      // Act
      const result = ActivityFiltersSchema.parse(filters)

      // Assert
      expect(result.status).toBe('ACTIVE')
      expect(result.limit).toBe(25)
      expect(result.cursor).toBe('cursor-id-123')
    })

    it('should apply default limit when not provided', () => {
      // Arrange
      const filters = {
        status: 'DRAFT' as const,
      }

      // Act
      const result = ActivityFiltersSchema.parse(filters)

      // Assert
      expect(result.limit).toBe(50) // Default value
      expect(result.status).toBe('DRAFT')
    })

    it('should validate with only cursor provided', () => {
      // Arrange
      const filters = {
        cursor: 'next-page-cursor',
      }

      // Act
      const result = ActivityFiltersSchema.parse(filters)

      // Assert
      expect(result.cursor).toBe('next-page-cursor')
      expect(result.limit).toBe(50)
    })

    it('should fail validation with invalid status', () => {
      // Arrange
      const invalidFilters = {
        status: 'INVALID_STATUS',
      }

      // Act & Assert
      expect(() => ActivityFiltersSchema.parse(invalidFilters)).toThrow(ZodError)

      try {
        ActivityFiltersSchema.parse(invalidFilters)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.errors[0]?.path).toEqual(['status'])
        expect(zodError.errors[0]?.message).toBe('Status must be one of: DRAFT, ACTIVE, ARCHIVED')
      }
    })

    it('should fail validation with limit exceeding maximum', () => {
      // Arrange
      const invalidFilters = {
        limit: 150, // Exceeds max of 100
      }

      // Act & Assert
      expect(() => ActivityFiltersSchema.parse(invalidFilters)).toThrow(ZodError)
    })

    it('should fail validation with negative limit', () => {
      // Arrange
      const invalidFilters = {
        limit: -10,
      }

      // Act & Assert
      expect(() => ActivityFiltersSchema.parse(invalidFilters)).toThrow(ZodError)
    })
  })
})
