import {
  getActivitiesForAsset,
  getAssetsForActivity,
  linkAssetToActivity,
  syncActivityAssets,
  unlinkAssetFromActivity,
} from '@compilothq/database'
import {
  ActivityAssetLinkSchema,
  ActivityAssetSyncSchema,
  ActivityAssetUnlinkSchema,
} from '@compilothq/validation'
import { z } from 'zod'

import { orgProcedure, router } from '../trpc'
import { handlePrismaError } from '../utils/prisma-errors'

export const activityAssetJunctionRouter = router({
  /**
   * Link a single digital asset to a processing activity
   * Creates junction record with duplicate prevention
   * Validates activity ownership before linking
   */
  link: orgProcedure.input(ActivityAssetLinkSchema).mutation(async ({ ctx, input }) => {
    return await handlePrismaError(
      linkAssetToActivity(input.activityId, ctx.organizationId, input.digitalAssetId)
    )
  }),

  /**
   * Unlink a single digital asset from a processing activity
   * Removes junction record (idempotent - no error if link doesn't exist)
   * Validates activity ownership before unlinking
   */
  unlink: orgProcedure.input(ActivityAssetUnlinkSchema).mutation(async ({ ctx, input }) => {
    return await handlePrismaError(
      unlinkAssetFromActivity(input.activityId, ctx.organizationId, input.digitalAssetId)
    )
  }),

  /**
   * Atomic bulk sync of all assets for a processing activity
   * Replaces ALL asset links in a single transaction (all-or-nothing)
   * Supports empty array to remove all links
   * Prevents partial state during updates
   */
  sync: orgProcedure.input(ActivityAssetSyncSchema).mutation(async ({ ctx, input }) => {
    return await handlePrismaError(
      syncActivityAssets(input.activityId, ctx.organizationId, input.digitalAssetIds)
    )
  }),

  /**
   * Get all digital assets linked to a processing activity
   * Includes active processing locations with country and transfer mechanism data
   * Validates activity ownership before retrieval
   */
  getAssetsForActivity: orgProcedure
    .input(
      z.object({
        activityId: z.string().cuid('Invalid activity ID'),
      })
    )
    .query(async ({ ctx, input }) => {
      return await handlePrismaError(getAssetsForActivity(input.activityId, ctx.organizationId))
    }),

  /**
   * Get all processing activities using a digital asset
   * Used for impact analysis when modifying or deleting assets
   * No organization validation needed (asset-scoped query)
   */
  getActivitiesForAsset: orgProcedure
    .input(
      z.object({
        digitalAssetId: z.string().cuid('Invalid asset ID'),
      })
    )
    .query(async ({ input }) => {
      return await handlePrismaError(getActivitiesForAsset(input.digitalAssetId))
    }),
})
