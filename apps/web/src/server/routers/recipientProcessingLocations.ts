import type { Prisma } from '@compilothq/database'
import {
  createRecipientProcessingLocation,
  deactivateRecipientProcessingLocation,
  getActiveLocationsForRecipient,
  getAllLocationsForRecipient,
  getLocationsWithParentChain,
  getRecipientLocationsByCountry,
  moveRecipientProcessingLocation,
  updateRecipientProcessingLocation,
} from '@compilothq/database'
import {
  detectCrossBorderTransfers,
  getActivityTransferAnalysis,
} from '@compilothq/database/services/transferDetection'
import {
  RecipientProcessingLocationCreateSchema,
  RecipientProcessingLocationMoveSchema,
  RecipientProcessingLocationUpdateSchema,
} from '@compilothq/validation'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { orgProcedure, protectedProcedure, router } from '../trpc'
import { handlePrismaError } from '../utils/prisma-errors'

/**
 * tRPC router for recipient processing location operations
 * All procedures enforce multi-tenancy via orgProcedure middleware
 *
 * Procedures:
 * - create: Create new processing location with validation
 * - getActiveForRecipient: Get active locations for a recipient
 * - getAllForRecipient: Get all locations (including historical)
 * - getWithParentChain: Get locations with parent recipient chain
 * - getByCountry: Get locations filtered by country
 * - update: Update existing location with partial data
 * - deactivate: Soft delete location (preserve audit trail)
 * - move: Transactional move (create new + deactivate old)
 * - detectTransfers: Detect cross-border transfers organization-wide
 * - analyzeActivityTransfers: Analyze transfers for specific activity
 */
export const recipientProcessingLocationsRouter = router({
  /**
   * Create a new recipient processing location
   * Validates transfer mechanism requirement for third-country transfers
   * Enforces multi-tenancy by requiring organizationId from context
   */
  create: orgProcedure
    .input(RecipientProcessingLocationCreateSchema.omit({ organizationId: true }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await handlePrismaError(
          createRecipientProcessingLocation({
            organizationId: ctx.organizationId,
            recipientId: input.recipientId,
            service: input.service,
            countryId: input.countryId,
            locationRole: input.locationRole,
            purposeId: input.purposeId ?? null,
            purposeText: input.purposeText ?? null,
            transferMechanismId: input.transferMechanismId ?? null,
            metadata: input.metadata as Prisma.InputJsonValue | undefined,
          })
        )
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to create location',
        })
      }
    }),

  /**
   * Get active processing locations for a recipient
   * Filters by isActive: true to exclude historical locations
   * Includes related country, transferMechanism, and purpose data
   */
  getActiveForRecipient: protectedProcedure
    .input(
      z.object({
        recipientId: z.string().cuid('Invalid recipient ID'),
      })
    )
    .query(async ({ input }) => {
      return await getActiveLocationsForRecipient(input.recipientId)
    }),

  /**
   * Get all locations for a recipient (including historical)
   * Supports optional isActive filter for historical snapshots
   * Used for document regeneration and audit trails
   */
  getAllForRecipient: protectedProcedure
    .input(
      z.object({
        recipientId: z.string().cuid('Invalid recipient ID'),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getAllLocationsForRecipient(input.recipientId, {
        isActive: input.isActive,
      })
    }),

  /**
   * Get locations with parent recipient chain
   * Traverses recipient.parentRecipient hierarchy for complete transfer analysis
   * Returns locations grouped by recipient with depth annotation
   */
  getWithParentChain: orgProcedure
    .input(
      z.object({
        recipientId: z.string().cuid('Invalid recipient ID'),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getLocationsWithParentChain(input.recipientId, ctx.organizationId)
    }),

  /**
   * Get all processing locations in a specific country
   * Used for geographic compliance queries and transfer analysis
   * Supports filtering by active status
   */
  getByCountry: orgProcedure
    .input(
      z.object({
        countryId: z.string().cuid('Invalid country ID'),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getRecipientLocationsByCountry(ctx.organizationId, input.countryId, {
        isActive: input.isActive,
      })
    }),

  /**
   * Update existing recipient processing location
   * Supports partial updates of all mutable fields
   * Validates transfer mechanism requirement when country changes
   */
  update: orgProcedure
    .input(
      RecipientProcessingLocationUpdateSchema.extend({
        id: z.string().cuid('Invalid location ID'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input

        // Type assertion for Zod -> Prisma compatibility
        const data = updateData as {
          service?: string
          countryId?: string
          locationRole?: 'HOSTING' | 'PROCESSING' | 'BOTH'
          purposeId?: string | null
          purposeText?: string | null
          transferMechanismId?: string | null
          isActive?: boolean
          metadata?: Prisma.InputJsonValue | null
        }

        return await handlePrismaError(updateRecipientProcessingLocation(id, data))
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to update location',
        })
      }
    }),

  /**
   * Deactivate a processing location (soft delete)
   * Sets isActive: false to preserve audit trail
   * Maintains historical compliance data for documentation
   */
  deactivate: orgProcedure
    .input(
      z.object({
        id: z.string().cuid('Invalid location ID'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await handlePrismaError(deactivateRecipientProcessingLocation(input.id))
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to deactivate location',
        })
      }
    }),

  /**
   * Move recipient processing location (transactional)
   * Creates new location with updated fields and deactivates old location
   * All operations in single transaction for data consistency
   */
  move: orgProcedure.input(RecipientProcessingLocationMoveSchema).mutation(async ({ input }) => {
    try {
      // Type assertion for Zod -> Prisma compatibility
      const updates = input.updates as {
        countryId?: string
        service?: string
        transferMechanismId?: string | null
        locationRole?: 'HOSTING' | 'PROCESSING' | 'BOTH'
        purposeId?: string | null
        purposeText?: string | null
        metadata?: Prisma.InputJsonValue | null
      }

      return await handlePrismaError(moveRecipientProcessingLocation(input.locationId, updates))
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: error instanceof Error ? error.message : 'Failed to move location',
      })
    }
  }),

  /**
   * Detect cross-border transfers organization-wide
   * Compares organization country with all recipient processing locations
   * Includes parent chain locations for sub-processors
   * Returns transfers with risk assessment
   *
   * NOTE: Requires Organization.headquartersCountryId field in schema
   */
  detectTransfers: orgProcedure.query(async ({ ctx }) => {
    try {
      return await detectCrossBorderTransfers(ctx.organizationId)
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: error instanceof Error ? error.message : 'Failed to detect transfers',
      })
    }
  }),

  /**
   * Analyze cross-border transfers for a specific processing activity
   * Gets all recipients linked to activity and analyzes their locations
   * Returns structured analysis with transfer risks and summary statistics
   *
   * NOTE: Requires Organization.headquartersCountryId field in schema
   */
  analyzeActivityTransfers: protectedProcedure
    .input(
      z.object({
        activityId: z.string().cuid('Invalid activity ID'),
      })
    )
    .query(async ({ input }) => {
      try {
        return await getActivityTransferAnalysis(input.activityId)
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to analyze activity transfers',
        })
      }
    }),
})
