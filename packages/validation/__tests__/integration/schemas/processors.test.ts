import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import {
  ProcessorCreateSchema,
  ProcessorFiltersSchema,
  ProcessorUpdateSchema,
} from '../../../src/schemas/processors'

describe('Processor Validation Schemas - Integration Tests', () => {
  describe('ProcessorCreateSchema', () => {
    it('should validate valid processor data', () => {
      // Arrange
      const validData = {
        name: 'AWS Cloud Services',
        type: 'DATA_PROCESSOR' as const,
        description: 'Cloud hosting and data storage provider',
        isActive: true,
      }

      // Act
      const result = ProcessorCreateSchema.parse(validData)

      // Assert
      expect(result.name).toBe('AWS Cloud Services')
      expect(result.type).toBe('DATA_PROCESSOR')
      expect(result.description).toBe('Cloud hosting and data storage provider')
      expect(result.isActive).toBe(true)
    })

    it('should validate minimal processor data with defaults', () => {
      // Arrange
      const minimalData = {
        name: 'Google Analytics',
        type: 'SERVICE_PROVIDER' as const,
      }

      // Act
      const result = ProcessorCreateSchema.parse(minimalData)

      // Assert
      expect(result.name).toBe('Google Analytics')
      expect(result.type).toBe('SERVICE_PROVIDER')
      expect(result.isActive).toBe(true) // Default value
      expect(result.description).toBeUndefined()
    })

    it('should fail validation when name is missing', () => {
      // Arrange
      const invalidData = {
        type: 'SUB_PROCESSOR' as const,
        description: 'Some description',
      }

      // Act & Assert
      expect(() => ProcessorCreateSchema.parse(invalidData)).toThrow(ZodError)

      try {
        ProcessorCreateSchema.parse(invalidData)
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError)
        const zodError = error as ZodError
        expect(zodError.errors[0]?.path).toEqual(['name'])
        expect(zodError.errors[0]?.message).toBe('Required')
      }
    })

    it('should fail validation when type is missing', () => {
      // Arrange
      const invalidData = {
        name: 'Some Processor',
        description: 'Some description',
      }

      // Act & Assert
      expect(() => ProcessorCreateSchema.parse(invalidData)).toThrow(ZodError)

      try {
        ProcessorCreateSchema.parse(invalidData)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.errors[0]?.path).toEqual(['type'])
        expect(zodError.errors[0]?.message).toBe(
          'Type must be one of: DATA_PROCESSOR, SUB_PROCESSOR, JOINT_CONTROLLER, SERVICE_PROVIDER'
        )
      }
    })

    it('should fail validation with invalid processor type', () => {
      // Arrange
      const invalidData = {
        name: 'Some Processor',
        type: 'INVALID_TYPE',
        description: 'Some description',
      }

      // Act & Assert
      expect(() => ProcessorCreateSchema.parse(invalidData)).toThrow(ZodError)

      try {
        ProcessorCreateSchema.parse(invalidData)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.errors[0]?.path).toEqual(['type'])
        expect(zodError.errors[0]?.message).toBe(
          'Type must be one of: DATA_PROCESSOR, SUB_PROCESSOR, JOINT_CONTROLLER, SERVICE_PROVIDER'
        )
      }
    })

    it('should allow all valid processor types', () => {
      const validTypes = ['DATA_PROCESSOR', 'SUB_PROCESSOR', 'JOINT_CONTROLLER', 'SERVICE_PROVIDER']

      validTypes.forEach((type) => {
        // Arrange
        const validData = {
          name: 'Test Processor',
          type: type as
            | 'DATA_PROCESSOR'
            | 'SUB_PROCESSOR'
            | 'JOINT_CONTROLLER'
            | 'SERVICE_PROVIDER',
        }

        // Act
        const result = ProcessorCreateSchema.parse(validData)

        // Assert
        expect(result.type).toBe(type)
      })
    })

    it('should allow null description', () => {
      // Arrange
      const validData = {
        name: 'Test Processor',
        type: 'JOINT_CONTROLLER' as const,
        description: null,
      }

      // Act
      const result = ProcessorCreateSchema.parse(validData)

      // Assert
      expect(result.description).toBeNull()
    })

    it('should allow setting isActive to false', () => {
      // Arrange
      const validData = {
        name: 'Inactive Processor',
        type: 'DATA_PROCESSOR' as const,
        isActive: false,
      }

      // Act
      const result = ProcessorCreateSchema.parse(validData)

      // Assert
      expect(result.isActive).toBe(false)
    })
  })

  describe('ProcessorUpdateSchema', () => {
    it('should validate partial updates', () => {
      // Arrange
      const partialUpdate = {
        description: 'Updated description',
      }

      // Act
      const result = ProcessorUpdateSchema.parse(partialUpdate)

      // Assert
      expect(result.description).toBe('Updated description')
      expect(result.name).toBeUndefined()
    })

    it('should allow updating only isActive status', () => {
      // Arrange
      const partialUpdate = {
        isActive: false,
      }

      // Act
      const result = ProcessorUpdateSchema.parse(partialUpdate)

      // Assert
      expect(result.isActive).toBe(false)
    })

    it('should allow updating processor type', () => {
      // Arrange
      const partialUpdate = {
        type: 'SUB_PROCESSOR' as const,
      }

      // Act
      const result = ProcessorUpdateSchema.parse(partialUpdate)

      // Assert
      expect(result.type).toBe('SUB_PROCESSOR')
    })

    it('should allow empty update object', () => {
      // Arrange
      const emptyUpdate = {}

      // Act
      const result = ProcessorUpdateSchema.parse(emptyUpdate)

      // Assert
      expect(result).toEqual({})
    })

    it('should still enforce validation rules on provided fields', () => {
      // Arrange
      const invalidUpdate = {
        type: 'INVALID_TYPE',
      }

      // Act & Assert
      expect(() => ProcessorUpdateSchema.parse(invalidUpdate)).toThrow(ZodError)

      try {
        ProcessorUpdateSchema.parse(invalidUpdate)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.errors[0]?.path).toEqual(['type'])
        expect(zodError.errors[0]?.message).toBe(
          'Type must be one of: DATA_PROCESSOR, SUB_PROCESSOR, JOINT_CONTROLLER, SERVICE_PROVIDER'
        )
      }
    })
  })

  describe('ProcessorFiltersSchema', () => {
    it('should validate filters with all fields', () => {
      // Arrange
      const filters = {
        type: 'DATA_PROCESSOR' as const,
        isActive: true,
        limit: 30,
        cursor: 'cursor-abc-123',
      }

      // Act
      const result = ProcessorFiltersSchema.parse(filters)

      // Assert
      expect(result.type).toBe('DATA_PROCESSOR')
      expect(result.isActive).toBe(true)
      expect(result.limit).toBe(30)
      expect(result.cursor).toBe('cursor-abc-123')
    })

    it('should apply default limit when not provided', () => {
      // Arrange
      const filters = {
        isActive: false,
      }

      // Act
      const result = ProcessorFiltersSchema.parse(filters)

      // Assert
      expect(result.limit).toBe(50) // Default value
      expect(result.isActive).toBe(false)
    })

    it('should validate with only type filter', () => {
      // Arrange
      const filters = {
        type: 'JOINT_CONTROLLER' as const,
      }

      // Act
      const result = ProcessorFiltersSchema.parse(filters)

      // Assert
      expect(result.type).toBe('JOINT_CONTROLLER')
      expect(result.limit).toBe(50)
    })

    it('should fail validation with invalid processor type', () => {
      // Arrange
      const invalidFilters = {
        type: 'INVALID_TYPE',
      }

      // Act & Assert
      expect(() => ProcessorFiltersSchema.parse(invalidFilters)).toThrow(ZodError)

      try {
        ProcessorFiltersSchema.parse(invalidFilters)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.errors[0]?.path).toEqual(['type'])
        expect(zodError.errors[0]?.message).toBe(
          'Type must be one of: DATA_PROCESSOR, SUB_PROCESSOR, JOINT_CONTROLLER, SERVICE_PROVIDER'
        )
      }
    })

    it('should fail validation with limit exceeding maximum', () => {
      // Arrange
      const invalidFilters = {
        limit: 200, // Exceeds max of 100
      }

      // Act & Assert
      expect(() => ProcessorFiltersSchema.parse(invalidFilters)).toThrow(ZodError)
    })

    it('should fail validation with zero or negative limit', () => {
      // Arrange
      const invalidFilters = {
        limit: 0,
      }

      // Act & Assert
      expect(() => ProcessorFiltersSchema.parse(invalidFilters)).toThrow(ZodError)
    })
  })
})
