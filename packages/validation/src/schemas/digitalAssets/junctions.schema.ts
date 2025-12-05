import { z } from 'zod'

/**
 * Validation schema for linking a single asset to an activity
 * Used in activityAssetJunction.link tRPC procedure
 */
export const ActivityAssetLinkSchema = z.object({
  activityId: z.string().cuid('Invalid activity ID'),
  digitalAssetId: z.string().cuid('Invalid digital asset ID'),
})

/**
 * Inferred TypeScript type for activity-asset link operation
 */
export type ActivityAssetLink = z.infer<typeof ActivityAssetLinkSchema>

/**
 * Validation schema for unlinking a single asset from an activity
 * Uses same structure as link (idempotent operations)
 */
export const ActivityAssetUnlinkSchema = ActivityAssetLinkSchema

/**
 * Inferred TypeScript type for activity-asset unlink operation
 */
export type ActivityAssetUnlink = z.infer<typeof ActivityAssetUnlinkSchema>

/**
 * Validation schema for atomic bulk sync of activity assets
 * Replaces all asset links for an activity in a single transaction
 * Empty array removes all links
 */
export const ActivityAssetSyncSchema = z.object({
  activityId: z.string().cuid('Invalid activity ID'),
  digitalAssetIds: z.array(z.string().cuid('Invalid digital asset ID')),
})

/**
 * Inferred TypeScript type for activity-asset sync operation
 */
export type ActivityAssetSync = z.infer<typeof ActivityAssetSyncSchema>
