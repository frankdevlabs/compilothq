import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import {
  DataProcessingActivityCreateSchema,
  DataProcessingActivityFiltersSchema,
  DataProcessingActivityUpdateSchema,
} from '../../../src/schemas/activities'

describe('DataProcessingActivity Validation Schemas - Integration Tests', () => {
  describe('DataProcessingActivityCreateSchema', () => {
    it('should validate valid activity data', () => {
      // Arrange
      const validData = {
        name: 'Customer Data Processing',
        description: 'Processing customer personal data for service delivery',
      }

      // Act
      const result = DataProcessingActivityCreateSchema.parse(validData)

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
      const result = DataProcessingActivityCreateSchema.parse(minimalData)

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
      expect(() => DataProcessingActivityCreateSchema.parse(invalidData)).toThrow(ZodError)

      try {
        DataProcessingActivityCreateSchema.parse(invalidData)
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

    it('should fail validation when name is empty string', () => {
      // Arrange
      const invalidData = {
        name: '',
        description: 'Some description',
      }

      // Act & Assert
      expect(() => DataProcessingActivityCreateSchema.parse(invalidData)).toThrow(ZodError)

      try {
        DataProcessingActivityCreateSchema.parse(invalidData)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.issues[0]?.path).toEqual(['name'])
        expect(zodError.issues[0]?.message).toBe('Data processing activity name is required')
      }
    })

    it('should allow null description', () => {
      // Arrange
      const validData = {
        name: 'Test Activity',
        description: null,
      }

      // Act
      const result = DataProcessingActivityCreateSchema.parse(validData)

      // Assert
      expect(result.name).toBe('Test Activity')
      expect(result.description).toBeNull()
    })

    it('should apply default status of DRAFT when not provided', () => {
      const result = DataProcessingActivityCreateSchema.parse({
        name: 'Test Activity',
      })
      expect(result.status).toBe('DRAFT')
    })

    it('should allow all valid status values', () => {
      const statuses = [
        'DRAFT',
        'UNDER_REVIEW',
        'UNDER_REVISION',
        'REJECTED',
        'APPROVED',
        'ACTIVE',
        'SUSPENDED',
        'ARCHIVED',
      ] as const

      statuses.forEach((status) => {
        const result = DataProcessingActivityCreateSchema.parse({
          name: 'Test Activity',
          status,
        })
        expect(result.status).toBe(status)
      })
    })

    it('should validate riskLevel enum values', () => {
      const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

      riskLevels.forEach((riskLevel) => {
        const result = DataProcessingActivityCreateSchema.parse({
          name: 'Test Activity',
          riskLevel,
        })
        expect(result.riskLevel).toBe(riskLevel)
      })
    })

    it('should reject invalid riskLevel values', () => {
      const invalidData = { name: 'Test Activity', riskLevel: 'INVALID' }
      expect(() => DataProcessingActivityCreateSchema.parse(invalidData)).toThrow(ZodError)
    })

    it('should allow riskLevel to be null', () => {
      const result = DataProcessingActivityCreateSchema.parse({
        name: 'Test Activity',
        riskLevel: null,
      })
      expect(result.riskLevel).toBeNull()
    })

    it('should allow requiresDPIA to be true, false, or null', () => {
      const resultTrue = DataProcessingActivityCreateSchema.parse({
        name: 'Test Activity',
        requiresDPIA: true,
      })
      const resultFalse = DataProcessingActivityCreateSchema.parse({
        name: 'Test Activity',
        requiresDPIA: false,
      })
      const resultNull = DataProcessingActivityCreateSchema.parse({
        name: 'Test Activity',
        requiresDPIA: null,
      })

      expect(resultTrue.requiresDPIA).toBe(true)
      expect(resultFalse.requiresDPIA).toBe(false)
      expect(resultNull.requiresDPIA).toBeNull()
    })

    it('should validate dpiaStatus enum values', () => {
      const dpiaStatuses = [
        'NOT_STARTED',
        'IN_PROGRESS',
        'UNDER_REVIEW',
        'REQUIRES_REVISION',
        'APPROVED',
        'OUTDATED',
      ] as const

      dpiaStatuses.forEach((dpiaStatus) => {
        const result = DataProcessingActivityCreateSchema.parse({
          name: 'Test Activity',
          dpiaStatus,
        })
        expect(result.dpiaStatus).toBe(dpiaStatus)
      })
    })

    it('should allow dpiaStatus to be null', () => {
      const result = DataProcessingActivityCreateSchema.parse({
        name: 'Test Activity',
        dpiaStatus: null,
      })
      expect(result.dpiaStatus).toBeNull()
    })

    it('should validate businessOwnerId as UUID', () => {
      const result = DataProcessingActivityCreateSchema.parse({
        name: 'Test Activity',
        businessOwnerId: 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d',
      })
      expect(result.businessOwnerId).toBe('c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d')
    })

    it('should reject invalid UUID for businessOwnerId', () => {
      const invalidData = {
        name: 'Test Activity',
        businessOwnerId: 'not-a-uuid',
      }

      expect(() => DataProcessingActivityCreateSchema.parse(invalidData)).toThrow(ZodError)
    })

    it('should validate processingOwnerId as UUID', () => {
      const result = DataProcessingActivityCreateSchema.parse({
        name: 'Test Activity',
        processingOwnerId: 'd8c4e9f1-6f1c-5c1f-9c4b-4c0f5c4e4c4e',
      })
      expect(result.processingOwnerId).toBe('d8c4e9f1-6f1c-5c1f-9c4b-4c0f5c4e4c4e')
    })

    it('should allow owner IDs to be null', () => {
      const result = DataProcessingActivityCreateSchema.parse({
        name: 'Test Activity',
        businessOwnerId: null,
        processingOwnerId: null,
      })
      expect(result.businessOwnerId).toBeNull()
      expect(result.processingOwnerId).toBeNull()
    })
  })

  describe('DataProcessingActivityUpdateSchema', () => {
    it('should validate partial updates', () => {
      // Arrange
      const partialUpdate = {
        description: 'Updated description',
      }

      // Act
      const result = DataProcessingActivityUpdateSchema.parse(partialUpdate)

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
      const result = DataProcessingActivityUpdateSchema.parse(partialUpdate)

      // Assert
      expect(result.name).toBe('Updated Activity Name')
    })

    it('should allow empty update object', () => {
      // Arrange
      const emptyUpdate = {}

      // Act
      const result = DataProcessingActivityUpdateSchema.parse(emptyUpdate)

      // Assert
      expect(result).toEqual({})
    })

    it('should still enforce validation rules on provided fields', () => {
      // Arrange
      const invalidUpdate = {
        name: '', // Should not be empty
      }

      // Act & Assert
      expect(() => DataProcessingActivityUpdateSchema.parse(invalidUpdate)).toThrow(ZodError)

      try {
        DataProcessingActivityUpdateSchema.parse(invalidUpdate)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.issues[0]?.path).toEqual(['name'])
        expect(zodError.issues[0]?.message).toBe('Data processing activity name is required')
      }
    })
  })

  describe('DataProcessingActivityFiltersSchema', () => {
    it('should validate filters with all fields', () => {
      // Arrange
      const filters = {
        status: 'ACTIVE' as const,
        limit: 25,
        cursor: 'cursor-id-123',
      }

      // Act
      const result = DataProcessingActivityFiltersSchema.parse(filters)

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
      const result = DataProcessingActivityFiltersSchema.parse(filters)

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
      const result = DataProcessingActivityFiltersSchema.parse(filters)

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
      expect(() => DataProcessingActivityFiltersSchema.parse(invalidFilters)).toThrow(ZodError)

      try {
        DataProcessingActivityFiltersSchema.parse(invalidFilters)
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.issues[0]?.path).toEqual(['status'])
        expect(zodError.issues[0]?.message).toBe(
          'Status must be one of: DRAFT, UNDER_REVIEW, UNDER_REVISION, REJECTED, APPROVED, ACTIVE, SUSPENDED, ARCHIVED'
        )
      }
    })

    it('should fail validation with limit exceeding maximum', () => {
      // Arrange
      const invalidFilters = {
        limit: 150, // Exceeds max of 100
      }

      // Act & Assert
      expect(() => DataProcessingActivityFiltersSchema.parse(invalidFilters)).toThrow(ZodError)
    })

    it('should fail validation with negative limit', () => {
      // Arrange
      const invalidFilters = {
        limit: -10,
      }

      // Act & Assert
      expect(() => DataProcessingActivityFiltersSchema.parse(invalidFilters)).toThrow(ZodError)
    })

    it('should filter by riskLevel', () => {
      const result = DataProcessingActivityFiltersSchema.parse({
        riskLevel: 'HIGH',
      })
      expect(result.riskLevel).toBe('HIGH')
      expect(result.limit).toBe(50)
    })

    it('should filter by requiresDPIA boolean', () => {
      const result = DataProcessingActivityFiltersSchema.parse({
        requiresDPIA: true,
      })
      expect(result.requiresDPIA).toBe(true)
    })

    it('should filter by dpiaStatus', () => {
      const result = DataProcessingActivityFiltersSchema.parse({
        dpiaStatus: 'IN_PROGRESS',
      })
      expect(result.dpiaStatus).toBe('IN_PROGRESS')
    })

    it('should combine multiple filters', () => {
      const filters = {
        status: 'ACTIVE' as const,
        riskLevel: 'CRITICAL' as const,
        requiresDPIA: true,
        dpiaStatus: 'APPROVED' as const,
        limit: 25,
      }

      const result = DataProcessingActivityFiltersSchema.parse(filters)

      expect(result.status).toBe('ACTIVE')
      expect(result.riskLevel).toBe('CRITICAL')
      expect(result.requiresDPIA).toBe(true)
      expect(result.dpiaStatus).toBe('APPROVED')
      expect(result.limit).toBe(25)
    })
  })
})
