import { z } from 'zod'

import { LocationRoleSchema } from '../shared/locationRole.schema'

/**
 * Asset type enum matching Prisma AssetType
 * Comprehensive coverage of common digital asset categories
 */
export const AssetTypeSchema = z.enum(
  [
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
  ],
  {
    message:
      'Invalid asset type. Must be one of: ANALYTICS_PLATFORM, API, APPLICATION, CLOUD_SERVICE, CRM, DATABASE, ERP, FILE_STORAGE, MARKETING_TOOL, ON_PREMISE_SYSTEM, OTHER',
  }
)

/**
 * Integration status enum for future automation readiness
 */
export const IntegrationStatusSchema = z.enum(
  ['CONNECTED', 'FAILED', 'MANUAL_ONLY', 'NOT_INTEGRATED', 'PENDING'],
  {
    message:
      'Invalid integration status. Must be one of: CONNECTED, FAILED, MANUAL_ONLY, NOT_INTEGRATED, PENDING',
  }
)

/**
 * Validation schema for creating a Digital Asset
 * Matches DigitalAsset model in @compilothq/database
 */
export const DigitalAssetCreateSchema = z.object({
  organizationId: z.string().cuid('Invalid organization ID'),
  name: z.string().min(1, 'Asset name is required').max(255),
  type: AssetTypeSchema,
  description: z.string().max(2000).optional().nullable(),

  // Display-purpose hosting country (distinct from compliance tracking)
  primaryHostingCountryId: z.string().cuid('Invalid country ID').optional().nullable(),
  hostingDetail: z
    .string()
    .max(255, 'Hosting detail must be 255 characters or less')
    .optional()
    .nullable(),

  // URLs and ownership
  url: z.string().url('Invalid URL format').optional().nullable(),
  technicalOwnerId: z.string().cuid('Invalid technical owner ID').optional().nullable(),
  businessOwnerId: z.string().cuid('Invalid business owner ID').optional().nullable(),

  // Data classification
  containsPersonalData: z.boolean().default(false),
  integrationStatus: IntegrationStatusSchema.default('NOT_INTEGRATED'),

  // Discovery metadata
  lastScannedAt: z.date().optional().nullable(),
  discoveredVia: z.string().max(100).optional().nullable(),

  // Extensibility
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

/**
 * Inferred TypeScript type for digital asset creation
 */
export type DigitalAssetCreate = z.infer<typeof DigitalAssetCreateSchema>

/**
 * Validation schema for creating an Asset Processing Location
 * Matches AssetProcessingLocation model in @compilothq/database
 *
 * SECURITY: Requires purposeId OR purposeText (at least one must be provided)
 */
export const AssetProcessingLocationCreateSchema = z
  .object({
    organizationId: z.string().cuid('Invalid organization ID'),
    digitalAssetId: z.string().cuid('Invalid digital asset ID'),

    // Business context
    service: z.string().min(1, 'Service description is required').max(500),
    purposeId: z.string().cuid('Invalid purpose ID').optional().nullable(),
    purposeText: z.string().max(500).optional().nullable(),

    // Geographic and compliance
    countryId: z.string().cuid('Invalid country ID'),
    locationRole: LocationRoleSchema,
    transferMechanismId: z.string().cuid('Invalid transfer mechanism ID').optional().nullable(),

    // Status
    isActive: z.boolean().default(true),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  })
  .refine((data) => data.purposeId !== null || data.purposeText !== null, {
    message: 'Either purposeId or purposeText must be provided',
    path: ['purposeId'],
  })

/**
 * Inferred TypeScript type for asset processing location creation
 */
export type AssetProcessingLocationCreate = z.infer<typeof AssetProcessingLocationCreateSchema>
