import type { Prisma } from '@compilothq/database'
import {
  deactivateAssetProcessingLocation,
  getActiveLocationsForAsset,
  getDigitalAssetById,
  getLocationsByCountry,
  updateAssetProcessingLocation,
} from '@compilothq/database'
import { AssetProcessingLocationUpdateSchema } from '@compilothq/validation'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { orgProcedure, router } from '../trpc'
import { handlePrismaError } from '../utils/prisma-errors'

export const assetProcessingLocationRouter = router({
  /**
   * Get all active processing locations for a digital asset
   * Filters by isActive: true (excludes historical/deactivated locations)
   * Includes related country, transfer mechanism, and purpose data
   */
  listForAsset: orgProcedure
    .input(
      z.object({
        assetId: z.string().cuid('Invalid asset ID'),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify asset belongs to this organization
      const asset = await getDigitalAssetById(input.assetId)

      if (!asset || asset.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Digital asset not found',
        })
      }

      return await getActiveLocationsForAsset(input.assetId)
    }),

  /**
   * Update an existing processing location
   * Supports partial updates of service, country, role, purpose, and transfer mechanism
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string().cuid('Invalid location ID'),
        data: AssetProcessingLocationUpdateSchema,
      })
    )
    .mutation(async ({ input }) => {
      // Type assertion needed for Zod -> Prisma compatibility
      const updateData = input.data as {
        service?: string
        countryId?: string
        locationRole?: 'HOSTING' | 'PROCESSING' | 'BOTH'
        purposeId?: string | null
        purposeText?: string | null
        transferMechanismId?: string | null
        isActive?: boolean
        metadata?: Prisma.InputJsonValue | null
      }

      return await handlePrismaError(updateAssetProcessingLocation(input.id, updateData))
    }),

  /**
   * Deactivate a processing location (preserve audit trail)
   * Sets isActive: false instead of deleting the record
   * Maintains historical compliance data for documentation
   */
  deactivate: orgProcedure
    .input(
      z.object({
        id: z.string().cuid('Invalid location ID'),
      })
    )
    .mutation(async ({ input }) => {
      return await handlePrismaError(deactivateAssetProcessingLocation(input.id))
    }),

  /**
   * Get all processing locations in a specific country
   * Used for geographic compliance queries and cross-border transfer analysis
   * Supports filtering by active status
   */
  listByCountry: orgProcedure
    .input(
      z.object({
        countryId: z.string().cuid('Invalid country ID'),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getLocationsByCountry(ctx.organizationId, input.countryId, {
        isActive: input.isActive,
      })
    }),
})
