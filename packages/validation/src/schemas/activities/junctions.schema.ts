import { z } from 'zod'

/**
 * Validation schema for syncing activity purposes
 * SECURITY: Validates activityId and purposeIds as CUID strings
 *
 * Used by syncActivityPurposes DAL function
 */
export const ActivityPurposeSyncSchema = z.object({
  activityId: z.string().cuid('Invalid activity ID format'),
  purposeIds: z.array(z.string().cuid('Invalid purpose ID format')),
})

/**
 * Inferred TypeScript type for activity purpose sync
 */
export type ActivityPurposeSync = z.infer<typeof ActivityPurposeSyncSchema>

/**
 * Validation schema for syncing activity data categories
 * SECURITY: Validates activityId and dataCategoryIds as CUID strings
 *
 * Used by syncActivityDataCategories DAL function
 */
export const ActivityDataCategorySyncSchema = z.object({
  activityId: z.string().cuid('Invalid activity ID format'),
  dataCategoryIds: z.array(z.string().cuid('Invalid data category ID format')),
})

/**
 * Inferred TypeScript type for activity data category sync
 */
export type ActivityDataCategorySync = z.infer<typeof ActivityDataCategorySyncSchema>

/**
 * Validation schema for syncing activity data subjects
 * SECURITY: Validates activityId and dataSubjectIds as CUID strings
 *
 * Used by syncActivityDataSubjects DAL function
 */
export const ActivityDataSubjectSyncSchema = z.object({
  activityId: z.string().cuid('Invalid activity ID format'),
  dataSubjectIds: z.array(z.string().cuid('Invalid data subject ID format')),
})

/**
 * Inferred TypeScript type for activity data subject sync
 */
export type ActivityDataSubjectSync = z.infer<typeof ActivityDataSubjectSyncSchema>

/**
 * Validation schema for syncing activity recipients
 * SECURITY: Validates activityId and recipientIds as CUID strings
 *
 * Used by syncActivityRecipients DAL function
 */
export const ActivityRecipientSyncSchema = z.object({
  activityId: z.string().cuid('Invalid activity ID format'),
  recipientIds: z.array(z.string().cuid('Invalid recipient ID format')),
})

/**
 * Inferred TypeScript type for activity recipient sync
 */
export type ActivityRecipientSync = z.infer<typeof ActivityRecipientSyncSchema>

/**
 * Validation schema for linking components to an activity
 * SECURITY: Validates activityId and componentIds as CUID strings
 * Enforces non-empty array (must link at least one component)
 *
 * Reusable schema for all link operations:
 * - linkActivityToPurposes
 * - linkActivityToDataCategories
 * - linkActivityToDataSubjects
 * - linkActivityToRecipients
 */
export const ActivityComponentLinkSchema = z.object({
  activityId: z.string().cuid('Invalid activity ID format'),
  componentIds: z
    .array(z.string().cuid('Invalid component ID format'))
    .min(1, 'Must provide at least 1 component ID to link'),
})

/**
 * Inferred TypeScript type for activity component link
 */
export type ActivityComponentLink = z.infer<typeof ActivityComponentLinkSchema>

/**
 * Validation schema for unlinking a component from an activity
 * SECURITY: Validates activityId and componentId as CUID strings
 *
 * Reusable schema for all unlink operations:
 * - unlinkActivityFromPurpose
 * - unlinkActivityFromDataCategory
 * - unlinkActivityFromDataSubject
 * - unlinkActivityFromRecipient
 */
export const ActivityComponentUnlinkSchema = z.object({
  activityId: z.string().cuid('Invalid activity ID format'),
  componentId: z.string().cuid('Invalid component ID format'),
})

/**
 * Inferred TypeScript type for activity component unlink
 */
export type ActivityComponentUnlink = z.infer<typeof ActivityComponentUnlinkSchema>
