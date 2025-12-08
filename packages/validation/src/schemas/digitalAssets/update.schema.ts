import { z } from 'zod'

import { LocationRoleSchema } from '../shared/locationRole.schema'
import { DigitalAssetCreateSchema } from './create.schema'

/**
 * Validation schema for updating a Digital Asset
 * All fields optional for partial updates
 * organizationId excluded (immutable)
 */
export const DigitalAssetUpdateSchema = DigitalAssetCreateSchema.omit({
  organizationId: true,
}).partial()

/**
 * Inferred TypeScript type for digital asset updates
 */
export type DigitalAssetUpdate = z.infer<typeof DigitalAssetUpdateSchema>

/**
 * Validation schema for updating an Asset Processing Location
 * All fields optional for partial updates
 * organizationId and digitalAssetId excluded (immutable)
 *
 * Note: Does not include the purposeId/purposeText refinement from create schema
 * since updates are partial and one field may be updated independently
 */
export const AssetProcessingLocationUpdateSchema = z.object({
  service: z.string().min(1).max(500).optional(),
  purposeId: z.string().cuid('Invalid purpose ID').optional().nullable(),
  purposeText: z.string().max(500).optional().nullable(),
  countryId: z.string().cuid('Invalid country ID').optional(),
  locationRole: LocationRoleSchema.optional(),
  transferMechanismId: z.string().cuid('Invalid transfer mechanism ID').optional().nullable(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

/**
 * Inferred TypeScript type for asset processing location updates
 */
export type AssetProcessingLocationUpdate = z.infer<typeof AssetProcessingLocationUpdateSchema>
