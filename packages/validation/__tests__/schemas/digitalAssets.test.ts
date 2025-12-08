import { describe, expect, it } from 'vitest'

import {
  AssetProcessingLocationCreateSchema,
  AssetTypeSchema,
  DigitalAssetCreateSchema,
  IntegrationStatusSchema,
} from '../../src/schemas/digitalAssets'
import { LocationRoleSchema } from '../../src/schemas/shared'

describe('Digital Asset Validation Schemas', () => {
  describe('DigitalAssetCreateSchema - Valid Data', () => {
    it('should validate complete valid digital asset data', () => {
      const validData = {
        organizationId: 'clxyz12345abcdefghijk',
        name: 'Google Cloud Platform',
        type: 'CLOUD_SERVICE' as const,
        description: 'Cloud infrastructure for data processing',
        primaryHostingCountryId: 'clxyz12345abcdefghijk',
        url: 'https://cloud.google.com',
        technicalOwnerId: 'clxyz12345abcdefghijk',
        businessOwnerId: 'clxyz12345abcdefghijk',
        containsPersonalData: true,
        integrationStatus: 'CONNECTED' as const,
        lastScannedAt: new Date('2025-12-05T00:00:00Z'),
        discoveredVia: 'Manual Entry',
        metadata: { region: 'us-east-1' },
      }

      const result = DigitalAssetCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Google Cloud Platform')
        expect(result.data.type).toBe('CLOUD_SERVICE')
        expect(result.data.containsPersonalData).toBe(true)
        expect(result.data.integrationStatus).toBe('CONNECTED')
      }
    })

    it('should apply default values for optional fields', () => {
      const minimalData = {
        organizationId: 'clxyz12345abcdefghijk',
        name: 'Basic Asset',
        type: 'DATABASE' as const,
      }

      const result = DigitalAssetCreateSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.containsPersonalData).toBe(false) // Default
        expect(result.data.integrationStatus).toBe('NOT_INTEGRATED') // Default
      }
    })
  })

  describe('DigitalAssetCreateSchema - Invalid Enum Values', () => {
    it('should reject invalid AssetType enum value', () => {
      const invalidData = {
        organizationId: 'clxyz12345abcdefghijk',
        name: 'Test Asset',
        type: 'INVALID_TYPE', // Not a valid AssetType
      }

      const result = DigitalAssetCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['type'])
        expect(result.error.issues[0]?.message).toContain('Invalid asset type')
      }
    })

    it('should reject invalid IntegrationStatus enum value', () => {
      const invalidData = {
        organizationId: 'clxyz12345abcdefghijk',
        name: 'Test Asset',
        type: 'API' as const,
        integrationStatus: 'INVALID_STATUS', // Not a valid IntegrationStatus
      }

      const result = DigitalAssetCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['integrationStatus'])
        expect(result.error.issues[0]?.message).toContain('Invalid integration status')
      }
    })

    it('should validate all valid AssetType enum values', () => {
      const validTypes = [
        'ANALYTICS_PLATFORM',
        'API',
        'APPLICATION',
        'CLOUD_SERVICE',
        'CRM',
        'DATABASE',
        'ERP',
        'FILE_STORAGE',
        'MARKETING_TOOL',
        'ON_PREMISE_SYSTEM',
        'OTHER',
      ]

      validTypes.forEach((type) => {
        const result = AssetTypeSchema.safeParse(type)
        expect(result.success).toBe(true)
      })
    })

    it('should validate all valid IntegrationStatus enum values', () => {
      const validStatuses = ['CONNECTED', 'FAILED', 'MANUAL_ONLY', 'NOT_INTEGRATED', 'PENDING']

      validStatuses.forEach((status) => {
        const result = IntegrationStatusSchema.safeParse(status)
        expect(result.success).toBe(true)
      })
    })

    it('should validate all valid LocationRole enum values', () => {
      const validRoles = ['HOSTING', 'PROCESSING', 'BOTH']

      validRoles.forEach((role) => {
        const result = LocationRoleSchema.safeParse(role)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('AssetProcessingLocationCreateSchema - purposeId OR purposeText Required', () => {
    it('should validate location with purposeId only', () => {
      const validData = {
        organizationId: 'clxyz12345abcdefghijk',
        digitalAssetId: 'clxyz12345abcdefghijk',
        service: 'BigQuery analytics',
        purposeId: 'clxyz12345abcdefghijk',
        purposeText: null,
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'BOTH' as const,
        transferMechanismId: 'clxyz12345abcdefghijk',
        isActive: true,
      }

      const result = AssetProcessingLocationCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate location with purposeText only', () => {
      const validData = {
        organizationId: 'clxyz12345abcdefghijk',
        digitalAssetId: 'clxyz12345abcdefghijk',
        service: 'S3 backup storage',
        purposeId: null,
        purposeText: 'Customer data backups',
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'HOSTING' as const,
      }

      const result = AssetProcessingLocationCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate location with both purposeId AND purposeText', () => {
      const validData = {
        organizationId: 'clxyz12345abcdefghijk',
        digitalAssetId: 'clxyz12345abcdefghijk',
        service: 'Analytics processing',
        purposeId: 'clxyz12345abcdefghijk',
        purposeText: 'Additional purpose context',
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'PROCESSING' as const,
      }

      const result = AssetProcessingLocationCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject location with neither purposeId nor purposeText', () => {
      const invalidData = {
        organizationId: 'clxyz12345abcdefghijk',
        digitalAssetId: 'clxyz12345abcdefghijk',
        service: 'Data storage',
        purposeId: null, // Both null - should fail
        purposeText: null,
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'HOSTING' as const,
      }

      const result = AssetProcessingLocationCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['purposeId'])
        expect(result.error.issues[0]?.message).toBe(
          'Either purposeId or purposeText must be provided'
        )
      }
    })

    it('should apply default value for isActive field', () => {
      const dataWithoutIsActive = {
        organizationId: 'clxyz12345abcdefghijk',
        digitalAssetId: 'clxyz12345abcdefghijk',
        service: 'Test service',
        purposeId: 'clxyz12345abcdefghijk',
        countryId: 'clxyz12345abcdefghijk',
        locationRole: 'BOTH' as const,
      }

      const result = AssetProcessingLocationCreateSchema.safeParse(dataWithoutIsActive)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isActive).toBe(true) // Default value
      }
    })
  })
})
