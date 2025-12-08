import { describe, expect, it } from 'vitest'

import {
  RecipientProcessingLocationCreateSchema,
  RecipientProcessingLocationMoveSchema,
  RecipientProcessingLocationUpdateSchema,
} from '../../src/schemas/recipients'
import { LocationRoleSchema } from '../../src/schemas/shared'

describe('Recipient Processing Location Validation Schemas', () => {
  describe('RecipientProcessingLocationCreateSchema - Valid Data', () => {
    it('should validate complete valid location data', () => {
      const validData = {
        organizationId: 'clxyz12345abcdefghijk',
        recipientId: 'clxyz12345abcdefghijk',
        service: 'Email delivery via SendGrid API',
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'PROCESSING' as const,
        purposeId: 'clxyz12345abcdefghijk',
        purposeText: null,
        transferMechanismId: 'clxyz12345abcdefghijk',
        metadata: { datacenter: 'us-east-1' },
      }

      const result = RecipientProcessingLocationCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.service).toBe('Email delivery via SendGrid API')
        expect(result.data.locationRole).toBe('PROCESSING')
      }
    })

    it('should validate minimal required fields only', () => {
      const minimalData = {
        organizationId: 'clxyz12345abcdefghijk',
        recipientId: 'clxyz12345abcdefghijk',
        service: 'Cloud storage',
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'HOSTING' as const,
      }

      const result = RecipientProcessingLocationCreateSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    it('should allow purposeId only (without purposeText)', () => {
      const validData = {
        organizationId: 'clxyz12345abcdefghijk',
        recipientId: 'clxyz12345abcdefghijk',
        service: 'Analytics processing',
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'BOTH' as const,
        purposeId: 'clxyz12345abcdefghijk',
        purposeText: null,
      }

      const result = RecipientProcessingLocationCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow purposeText only (without purposeId)', () => {
      const validData = {
        organizationId: 'clxyz12345abcdefghijk',
        recipientId: 'clxyz12345abcdefghijk',
        service: 'Data backup',
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'HOSTING' as const,
        purposeId: null,
        purposeText: 'Customer data backups for disaster recovery',
      }

      const result = RecipientProcessingLocationCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow both purposeId AND purposeText', () => {
      const validData = {
        organizationId: 'clxyz12345abcdefghijk',
        recipientId: 'clxyz12345abcdefghijk',
        service: 'Combined processing',
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'BOTH' as const,
        purposeId: 'clxyz12345abcdefghijk',
        purposeText: 'Additional purpose details',
      }

      const result = RecipientProcessingLocationCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow neither purposeId nor purposeText (no refinement)', () => {
      // Unlike AssetProcessingLocation, RecipientProcessingLocation
      // does NOT require purpose fields
      const validData = {
        organizationId: 'clxyz12345abcdefghijk',
        recipientId: 'clxyz12345abcdefghijk',
        service: 'Data storage',
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'HOSTING' as const,
        purposeId: null,
        purposeText: null,
      }

      const result = RecipientProcessingLocationCreateSchema.safeParse(validData)
      expect(result.success).toBe(true) // Should succeed
    })
  })

  describe('RecipientProcessingLocationCreateSchema - Invalid Data', () => {
    it('should reject invalid organizationId format', () => {
      const invalidData = {
        organizationId: 'not-a-cuid', // Invalid
        recipientId: 'clxyz12345abcdefghijk',
        service: 'Test service',
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'PROCESSING' as const,
      }

      const result = RecipientProcessingLocationCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['organizationId'])
      }
    })

    it('should reject service shorter than 3 characters', () => {
      const invalidData = {
        organizationId: 'clxyz12345abcdefghijk',
        recipientId: 'clxyz12345abcdefghijk',
        service: 'ab', // Too short
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'HOSTING' as const,
      }

      const result = RecipientProcessingLocationCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['service'])
        expect(result.error.issues[0]?.message).toContain('at least 3 characters')
      }
    })

    it('should reject service longer than 500 characters', () => {
      const invalidData = {
        organizationId: 'clxyz12345abcdefghijk',
        recipientId: 'clxyz12345abcdefghijk',
        service: 'a'.repeat(501), // Too long
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'PROCESSING' as const,
      }

      const result = RecipientProcessingLocationCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['service'])
      }
    })

    it('should reject invalid locationRole enum value', () => {
      const invalidData = {
        organizationId: 'clxyz12345abcdefghijk',
        recipientId: 'clxyz12345abcdefghijk',
        service: 'Test service',
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'INVALID_ROLE', // Not in enum
      }

      const result = RecipientProcessingLocationCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['locationRole'])
        expect(result.error.issues[0]?.message).toContain(
          'Must be one of: HOSTING, PROCESSING, BOTH'
        )
      }
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        organizationId: 'clxyz12345abcdefghijk',
        // Missing: recipientId, service, countryId, locationRole
      }

      const result = RecipientProcessingLocationCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const paths = result.error.issues.map((issue) => issue.path[0])
        expect(paths).toContain('recipientId')
        expect(paths).toContain('service')
        expect(paths).toContain('countryId')
        expect(paths).toContain('locationRole')
      }
    })
  })

  describe('RecipientProcessingLocationUpdateSchema - Partial Updates', () => {
    it('should validate partial update with single field', () => {
      const updateData = {
        service: 'Updated email delivery service',
      }

      const result = RecipientProcessingLocationUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should validate updating multiple fields', () => {
      const updateData = {
        service: 'New service description',
        countryId: 'clxyz12345abcdefghijk',
        transferMechanismId: 'clxyz12345abcdefghijk',
        locationRole: 'BOTH' as const,
      }

      const result = RecipientProcessingLocationUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should validate empty update object', () => {
      const updateData = {}

      const result = RecipientProcessingLocationUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should allow setting fields to null', () => {
      const updateData = {
        purposeId: null,
        purposeText: null,
        transferMechanismId: null,
        metadata: null,
      }

      const result = RecipientProcessingLocationUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should validate isActive toggle', () => {
      const updateData = {
        isActive: false,
      }

      const result = RecipientProcessingLocationUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid service length in updates', () => {
      const updateData = {
        service: 'ab', // Too short
      }

      const result = RecipientProcessingLocationUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(false)
    })
  })

  describe('RecipientProcessingLocationMoveSchema - Transactional Move', () => {
    it('should validate move with locationId and updates', () => {
      const moveData = {
        locationId: 'clxyz12345abcdefghijk',
        updates: {
          countryId: 'clxyz12345abcdefghijk',
          service: 'Moved to US data center',
          transferMechanismId: 'clxyz12345abcdefghijk',
        },
      }

      const result = RecipientProcessingLocationMoveSchema.safeParse(moveData)
      expect(result.success).toBe(true)
    })

    it('should validate move with minimal updates', () => {
      const moveData = {
        locationId: 'clxyz12345abcdefghijk',
        updates: {
          countryId: 'clxyz12345abcdefghijk',
        },
      }

      const result = RecipientProcessingLocationMoveSchema.safeParse(moveData)
      expect(result.success).toBe(true)
    })

    it('should validate move with empty updates object', () => {
      const moveData = {
        locationId: 'clxyz12345abcdefghijk',
        updates: {},
      }

      const result = RecipientProcessingLocationMoveSchema.safeParse(moveData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid locationId format', () => {
      const moveData = {
        locationId: 'not-a-cuid', // Invalid
        updates: {
          countryId: 'clxyz12345abcdefghijk',
        },
      }

      const result = RecipientProcessingLocationMoveSchema.safeParse(moveData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['locationId'])
      }
    })

    it('should reject missing locationId', () => {
      const moveData = {
        updates: {
          countryId: 'clxyz12345abcdefghijk',
        },
      }

      const result = RecipientProcessingLocationMoveSchema.safeParse(moveData)
      expect(result.success).toBe(false)
    })

    it('should reject missing updates object', () => {
      const moveData = {
        locationId: 'clxyz12345abcdefghijk',
      }

      const result = RecipientProcessingLocationMoveSchema.safeParse(moveData)
      expect(result.success).toBe(false)
    })

    it('should allow but ignore isActive in move updates (Zod default behavior)', () => {
      // Note: The MOVE schema does not include isActive field, but Zod's default
      // behavior is to allow additional properties (they are simply ignored).
      // The inline schema has the same behavior - it doesn't explicitly reject
      // isActive, it just doesn't use it.
      const moveData = {
        locationId: 'clxyz12345abcdefghijk',
        updates: {
          countryId: 'clxyz12345abcdefghijk',
          isActive: false, // This will be ignored (not rejected)
        },
      }

      const result = RecipientProcessingLocationMoveSchema.safeParse(moveData)
      expect(result.success).toBe(true) // Zod allows additional properties by default
    })
  })

  describe('LocationRoleSchema - Enum Validation', () => {
    it('should accept valid HOSTING role', () => {
      const result = LocationRoleSchema.safeParse('HOSTING')
      expect(result.success).toBe(true)
    })

    it('should accept valid PROCESSING role', () => {
      const result = LocationRoleSchema.safeParse('PROCESSING')
      expect(result.success).toBe(true)
    })

    it('should accept valid BOTH role', () => {
      const result = LocationRoleSchema.safeParse('BOTH')
      expect(result.success).toBe(true)
    })

    it('should reject invalid role value', () => {
      const result = LocationRoleSchema.safeParse('INVALID')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          'Must be one of: HOSTING, PROCESSING, BOTH'
        )
      }
    })

    it('should reject null value', () => {
      const result = LocationRoleSchema.safeParse(null)
      expect(result.success).toBe(false)
    })

    it('should reject undefined value', () => {
      const result = LocationRoleSchema.safeParse(undefined)
      expect(result.success).toBe(false)
    })
  })
})
