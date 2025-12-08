import { z } from 'zod'

import { LocationRoleSchema } from '../shared/locationRole.schema'

/**
 * Validation schema for creating a Recipient Processing Location
 * Matches RecipientProcessingLocation model in @compilothq/database
 *
 * Multi-tenancy: Requires organizationId for tenant isolation
 * Parent Reference: recipientId links to parent Recipient entity
 * Geographic Compliance: countryId + locationRole for transfer analysis
 * Purpose Tracking: Optional purposeId OR purposeText for documentation
 *
 * Note: Unlike AssetProcessingLocation, this schema does NOT require
 * purposeId or purposeText (no .refine() validation) and does NOT
 * include isActive field in CREATE (differs from asset pattern).
 */
export const RecipientProcessingLocationCreateSchema = z.object({
  organizationId: z.string().cuid('Invalid organization ID'),
  recipientId: z.string().cuid('Invalid recipient ID'),

  // Business context
  service: z.string().min(3, 'Service must be at least 3 characters').max(500),
  purposeId: z.string().cuid('Invalid purpose ID').optional().nullable(),
  purposeText: z.string().max(500).optional().nullable(),

  // Geographic and compliance
  countryId: z.string().cuid('Invalid country ID'),
  locationRole: LocationRoleSchema,
  transferMechanismId: z.string().cuid('Invalid transfer mechanism ID').optional().nullable(),

  // Extensibility
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

/**
 * Inferred TypeScript type for recipient processing location creation
 */
export type RecipientProcessingLocationCreate = z.infer<
  typeof RecipientProcessingLocationCreateSchema
>

/**
 * Validation schema for updating a Recipient Processing Location
 * All fields optional for partial updates
 * organizationId and recipientId excluded (immutable)
 *
 * Note: Does not include purposeId/purposeText refinement
 * since updates are partial and fields may be updated independently
 */
export const RecipientProcessingLocationUpdateSchema = z.object({
  service: z.string().min(3).max(500).optional(),
  countryId: z.string().cuid('Invalid country ID').optional(),
  locationRole: LocationRoleSchema.optional(),
  purposeId: z.string().cuid('Invalid purpose ID').optional().nullable(),
  purposeText: z.string().max(500).optional().nullable(),
  transferMechanismId: z.string().cuid('Invalid transfer mechanism ID').optional().nullable(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

/**
 * Inferred TypeScript type for recipient processing location updates
 */
export type RecipientProcessingLocationUpdate = z.infer<
  typeof RecipientProcessingLocationUpdateSchema
>

/**
 * Updates schema for MOVE operation (without isActive field)
 * Used internally by RecipientProcessingLocationMoveSchema
 *
 * Move operation semantics:
 * - Creates new location (defaults to isActive: true)
 * - Deactivates old location (sets isActive: false)
 * - Maintains audit trail by preserving historical location data
 *
 * This schema excludes isActive because the operation handles
 * active status changes automatically during the transaction.
 */
const RecipientProcessingLocationMoveUpdatesSchema = z.object({
  service: z.string().min(3).max(500).optional(),
  countryId: z.string().cuid('Invalid country ID').optional(),
  locationRole: LocationRoleSchema.optional(),
  purposeId: z.string().cuid('Invalid purpose ID').optional().nullable(),
  purposeText: z.string().max(500).optional().nullable(),
  transferMechanismId: z.string().cuid('Invalid transfer mechanism ID').optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  // NOTE: NO isActive field (differs from UPDATE schema)
})

/**
 * Validation schema for moving a Recipient Processing Location
 * Wraps MOVE updates schema with locationId for transactional move operation
 *
 * Move operation = Create new location + Deactivate old location
 * Maintains audit trail by preserving historical location data
 */
export const RecipientProcessingLocationMoveSchema = z.object({
  locationId: z.string().cuid('Invalid location ID'),
  updates: RecipientProcessingLocationMoveUpdatesSchema,
})

/**
 * Inferred TypeScript type for recipient processing location move
 */
export type RecipientProcessingLocationMove = z.infer<typeof RecipientProcessingLocationMoveSchema>
