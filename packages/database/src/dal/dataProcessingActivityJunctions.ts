import type { DataProcessingActivity, DigitalAsset, Prisma } from '../index'
import { prisma } from '../index'

/**
 * Type for DataProcessingActivity with all related components
 * Uses Prisma's inferred types for accurate type safety
 */
export type DataProcessingActivityWithComponents = Prisma.DataProcessingActivityGetPayload<{
  include: {
    purposes: {
      include: {
        purpose: true
      }
    }
    dataSubjects: {
      include: {
        dataSubjectCategory: true
      }
    }
    dataCategories: {
      include: {
        dataCategory: true
      }
    }
    recipients: {
      include: {
        recipient: true
      }
    }
  }
}>

// ============================================================================
// Sync Operations (Replace all relationships atomically)
// ============================================================================

/**
 * Sync activity purposes - replaces all existing relationships atomically
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * Uses Prisma transaction to delete existing relationships and create new ones atomically.
 * This ensures data consistency even if the operation fails midway.
 *
 * @param activityId - The activity ID to sync purposes for
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param purposeIds - Array of purpose IDs to link to the activity
 * @returns Promise<void>
 *
 * @example
 * await syncActivityPurposes('activity-id', 'org-id', ['purpose-1', 'purpose-2'])
 */
export async function syncActivityPurposes(
  activityId: string,
  organizationId: string,
  purposeIds: string[]
): Promise<void> {
  // First verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Use transaction to ensure atomic operation
  await prisma.$transaction(async (tx) => {
    // Delete existing purpose relationships
    await tx.dataProcessingActivityPurpose.deleteMany({
      where: {
        activityId,
      },
    })

    // Create new purpose relationships
    if (purposeIds.length > 0) {
      await tx.dataProcessingActivityPurpose.createMany({
        data: purposeIds.map((purposeId) => ({
          activityId,
          purposeId,
        })),
        skipDuplicates: true, // Idempotent operation
      })
    }
  })
}

/**
 * Sync activity data categories - replaces all existing relationships atomically
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * @param activityId - The activity ID to sync data categories for
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param dataCategoryIds - Array of data category IDs to link to the activity
 * @returns Promise<void>
 *
 * @example
 * await syncActivityDataCategories('activity-id', 'org-id', ['category-1', 'category-2'])
 */
export async function syncActivityDataCategories(
  activityId: string,
  organizationId: string,
  dataCategoryIds: string[]
): Promise<void> {
  // First verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Use transaction to ensure atomic operation
  await prisma.$transaction(async (tx) => {
    // Delete existing data category relationships
    await tx.dataProcessingActivityDataCategory.deleteMany({
      where: {
        activityId,
      },
    })

    // Create new data category relationships
    if (dataCategoryIds.length > 0) {
      await tx.dataProcessingActivityDataCategory.createMany({
        data: dataCategoryIds.map((dataCategoryId) => ({
          activityId,
          dataCategoryId,
        })),
        skipDuplicates: true, // Idempotent operation
      })
    }
  })
}

/**
 * Sync activity data subjects - replaces all existing relationships atomically
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * @param activityId - The activity ID to sync data subjects for
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param dataSubjectIds - Array of data subject category IDs to link to the activity
 * @returns Promise<void>
 *
 * @example
 * await syncActivityDataSubjects('activity-id', 'org-id', ['subject-1', 'subject-2'])
 */
export async function syncActivityDataSubjects(
  activityId: string,
  organizationId: string,
  dataSubjectIds: string[]
): Promise<void> {
  // First verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Use transaction to ensure atomic operation
  await prisma.$transaction(async (tx) => {
    // Delete existing data subject relationships
    await tx.dataProcessingActivityDataSubject.deleteMany({
      where: {
        activityId,
      },
    })

    // Create new data subject relationships
    if (dataSubjectIds.length > 0) {
      await tx.dataProcessingActivityDataSubject.createMany({
        data: dataSubjectIds.map((dataSubjectCategoryId) => ({
          activityId,
          dataSubjectCategoryId,
        })),
        skipDuplicates: true, // Idempotent operation
      })
    }
  })
}

/**
 * Sync activity recipients - replaces all existing relationships atomically
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * @param activityId - The activity ID to sync recipients for
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param recipientIds - Array of recipient IDs to link to the activity
 * @returns Promise<void>
 *
 * @example
 * await syncActivityRecipients('activity-id', 'org-id', ['recipient-1', 'recipient-2'])
 */
export async function syncActivityRecipients(
  activityId: string,
  organizationId: string,
  recipientIds: string[]
): Promise<void> {
  // First verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Use transaction to ensure atomic operation
  await prisma.$transaction(async (tx) => {
    // Delete existing recipient relationships
    await tx.dataProcessingActivityRecipient.deleteMany({
      where: {
        activityId,
      },
    })

    // Create new recipient relationships
    if (recipientIds.length > 0) {
      await tx.dataProcessingActivityRecipient.createMany({
        data: recipientIds.map((recipientId) => ({
          activityId,
          recipientId,
        })),
        skipDuplicates: true, // Idempotent operation
      })
    }
  })
}

// ============================================================================
// Link Operations (Add without replacing)
// ============================================================================

/**
 * Link activity to purposes - adds new relationships without removing existing
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * @param activityId - The activity ID to link purposes to
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param purposeIds - Array of purpose IDs to link to the activity
 * @returns Promise<void>
 *
 * @example
 * await linkActivityToPurposes('activity-id', 'org-id', ['purpose-3'])
 */
export async function linkActivityToPurposes(
  activityId: string,
  organizationId: string,
  purposeIds: string[]
): Promise<void> {
  // First verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Add new relationships (skipDuplicates makes this idempotent)
  if (purposeIds.length > 0) {
    await prisma.dataProcessingActivityPurpose.createMany({
      data: purposeIds.map((purposeId) => ({
        activityId,
        purposeId,
      })),
      skipDuplicates: true,
    })
  }
}

/**
 * Link activity to data categories - adds new relationships without removing existing
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * @param activityId - The activity ID to link data categories to
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param dataCategoryIds - Array of data category IDs to link to the activity
 * @returns Promise<void>
 *
 * @example
 * await linkActivityToDataCategories('activity-id', 'org-id', ['category-3'])
 */
export async function linkActivityToDataCategories(
  activityId: string,
  organizationId: string,
  dataCategoryIds: string[]
): Promise<void> {
  // First verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Add new relationships (skipDuplicates makes this idempotent)
  if (dataCategoryIds.length > 0) {
    await prisma.dataProcessingActivityDataCategory.createMany({
      data: dataCategoryIds.map((dataCategoryId) => ({
        activityId,
        dataCategoryId,
      })),
      skipDuplicates: true,
    })
  }
}

/**
 * Link activity to data subjects - adds new relationships without removing existing
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * @param activityId - The activity ID to link data subjects to
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param dataSubjectIds - Array of data subject category IDs to link to the activity
 * @returns Promise<void>
 *
 * @example
 * await linkActivityToDataSubjects('activity-id', 'org-id', ['subject-3'])
 */
export async function linkActivityToDataSubjects(
  activityId: string,
  organizationId: string,
  dataSubjectIds: string[]
): Promise<void> {
  // First verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Add new relationships (skipDuplicates makes this idempotent)
  if (dataSubjectIds.length > 0) {
    await prisma.dataProcessingActivityDataSubject.createMany({
      data: dataSubjectIds.map((dataSubjectCategoryId) => ({
        activityId,
        dataSubjectCategoryId,
      })),
      skipDuplicates: true,
    })
  }
}

/**
 * Link activity to recipients - adds new relationships without removing existing
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * @param activityId - The activity ID to link recipients to
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param recipientIds - Array of recipient IDs to link to the activity
 * @returns Promise<void>
 *
 * @example
 * await linkActivityToRecipients('activity-id', 'org-id', ['recipient-3'])
 */
export async function linkActivityToRecipients(
  activityId: string,
  organizationId: string,
  recipientIds: string[]
): Promise<void> {
  // First verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Add new relationships (skipDuplicates makes this idempotent)
  if (recipientIds.length > 0) {
    await prisma.dataProcessingActivityRecipient.createMany({
      data: recipientIds.map((recipientId) => ({
        activityId,
        recipientId,
      })),
      skipDuplicates: true,
    })
  }
}

// ============================================================================
// Unlink Operations (Remove specific links)
// ============================================================================

/**
 * Unlink activity from a purpose - removes single relationship
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * @param activityId - The activity ID to unlink purpose from
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param purposeId - The purpose ID to unlink from the activity
 * @returns Promise<void>
 *
 * @example
 * await unlinkActivityFromPurpose('activity-id', 'org-id', 'purpose-1')
 */
export async function unlinkActivityFromPurpose(
  activityId: string,
  organizationId: string,
  purposeId: string
): Promise<void> {
  // First verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Remove the relationship
  await prisma.dataProcessingActivityPurpose.deleteMany({
    where: {
      activityId,
      purposeId,
    },
  })
}

/**
 * Unlink activity from a data category - removes single relationship
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * @param activityId - The activity ID to unlink data category from
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param dataCategoryId - The data category ID to unlink from the activity
 * @returns Promise<void>
 *
 * @example
 * await unlinkActivityFromDataCategory('activity-id', 'org-id', 'category-1')
 */
export async function unlinkActivityFromDataCategory(
  activityId: string,
  organizationId: string,
  dataCategoryId: string
): Promise<void> {
  // First verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Remove the relationship
  await prisma.dataProcessingActivityDataCategory.deleteMany({
    where: {
      activityId,
      dataCategoryId,
    },
  })
}

/**
 * Unlink activity from a data subject - removes single relationship
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * @param activityId - The activity ID to unlink data subject from
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param dataSubjectId - The data subject category ID to unlink from the activity
 * @returns Promise<void>
 *
 * @example
 * await unlinkActivityFromDataSubject('activity-id', 'org-id', 'subject-1')
 */
export async function unlinkActivityFromDataSubject(
  activityId: string,
  organizationId: string,
  dataSubjectId: string
): Promise<void> {
  // First verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Remove the relationship
  await prisma.dataProcessingActivityDataSubject.deleteMany({
    where: {
      activityId,
      dataSubjectCategoryId: dataSubjectId,
    },
  })
}

/**
 * Unlink activity from a recipient - removes single relationship
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * @param activityId - The activity ID to unlink recipient from
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param recipientId - The recipient ID to unlink from the activity
 * @returns Promise<void>
 *
 * @example
 * await unlinkActivityFromRecipient('activity-id', 'org-id', 'recipient-1')
 */
export async function unlinkActivityFromRecipient(
  activityId: string,
  organizationId: string,
  recipientId: string
): Promise<void> {
  // First verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Remove the relationship
  await prisma.dataProcessingActivityRecipient.deleteMany({
    where: {
      activityId,
      recipientId,
    },
  })
}

// ============================================================================
// Digital Asset Junction Operations
// ============================================================================

/**
 * Link digital asset to activity - creates junction record
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * Creates a junction record linking a digital asset to a processing activity.
 * Idempotent operation - silently succeeds if link already exists.
 *
 * @param activityId - The activity ID to link asset to
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param digitalAssetId - The digital asset ID to link
 * @returns Promise<void>
 *
 * @example
 * await linkAssetToActivity('activity-id', 'org-id', 'asset-id')
 */
export async function linkAssetToActivity(
  activityId: string,
  organizationId: string,
  digitalAssetId: string
): Promise<void> {
  // Verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Check if junction already exists (idempotent check)
  const existingJunction = await prisma.dataProcessingActivityDigitalAsset.findFirst({
    where: {
      activityId,
      digitalAssetId,
    },
  })

  // Only create if it doesn't exist (idempotent operation)
  if (!existingJunction) {
    await prisma.dataProcessingActivityDigitalAsset.create({
      data: {
        activityId,
        digitalAssetId,
      },
    })
  }
}

/**
 * Unlink digital asset from activity - removes junction record
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * Removes the junction record linking an asset to an activity.
 * Idempotent operation - no error if junction doesn't exist.
 *
 * @param activityId - The activity ID to unlink asset from
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param digitalAssetId - The digital asset ID to unlink
 * @returns Promise<void>
 *
 * @example
 * await unlinkAssetFromActivity('activity-id', 'org-id', 'asset-id')
 */
export async function unlinkAssetFromActivity(
  activityId: string,
  organizationId: string,
  digitalAssetId: string
): Promise<void> {
  // Verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Remove junction (deleteMany is idempotent)
  await prisma.dataProcessingActivityDigitalAsset.deleteMany({
    where: {
      activityId,
      digitalAssetId,
    },
  })
}

/**
 * Sync activity digital assets - replaces all existing relationships atomically
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * Uses Prisma transaction to delete existing asset links and create new ones atomically.
 * This ensures data consistency even if the operation fails midway.
 * Supports empty array to remove all links.
 *
 * @param activityId - The activity ID to sync assets for
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param digitalAssetIds - Array of digital asset IDs to link to the activity
 * @returns Promise<void>
 *
 * @example
 * await syncActivityAssets('activity-id', 'org-id', ['asset-1', 'asset-2'])
 */
export async function syncActivityAssets(
  activityId: string,
  organizationId: string,
  digitalAssetIds: string[]
): Promise<void> {
  // Verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Use transaction to ensure atomic operation
  await prisma.$transaction(async (tx) => {
    // Delete existing asset links
    await tx.dataProcessingActivityDigitalAsset.deleteMany({
      where: { activityId },
    })

    // Create new asset links
    if (digitalAssetIds.length > 0) {
      await tx.dataProcessingActivityDigitalAsset.createMany({
        data: digitalAssetIds.map((digitalAssetId) => ({
          activityId,
          digitalAssetId,
        })),
        skipDuplicates: true, // Idempotent operation
      })
    }
  })
}

/**
 * Get all digital assets linked to an activity
 * SECURITY: Enforces multi-tenancy by validating organizationId ownership
 *
 * Retrieves all digital assets associated with a processing activity.
 * Includes active processing locations with nested country and transfer mechanism data.
 *
 * @param activityId - The activity ID to get assets for
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<DigitalAsset[]> - Array of digital assets with processing locations
 *
 * @example
 * const assets = await getAssetsForActivity('activity-id', 'org-id')
 */
export async function getAssetsForActivity(
  activityId: string,
  organizationId: string
): Promise<DigitalAsset[]> {
  // Verify activity belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Get linked assets with active processing locations
  const junctions = await prisma.dataProcessingActivityDigitalAsset.findMany({
    where: { activityId },
    include: {
      digitalAsset: {
        include: {
          processingLocations: {
            where: { isActive: true },
            include: {
              country: true,
              transferMechanism: true,
            },
          },
        },
      },
    },
  })

  return junctions.map((j) => j.digitalAsset)
}

/**
 * Get all activities using a digital asset
 *
 * Retrieves all processing activities that use a specific digital asset.
 * No organizationId filtering needed - asset FK ensures correct tenancy.
 *
 * @param digitalAssetId - The digital asset ID to get activities for
 * @returns Promise<DataProcessingActivity[]> - Array of processing activities
 *
 * @example
 * const activities = await getActivitiesForAsset('asset-id')
 */
export async function getActivitiesForAsset(
  digitalAssetId: string
): Promise<DataProcessingActivity[]> {
  const junctions = await prisma.dataProcessingActivityDigitalAsset.findMany({
    where: { digitalAssetId },
    include: {
      activity: true,
    },
  })

  return junctions.map((j) => j.activity)
}

// ============================================================================
// Query Operations
// ============================================================================

/**
 * Get activity with all related components
 * SECURITY: Enforces multi-tenancy by requiring organizationId parameter
 *
 * Queries activity with all related entities using Prisma's include syntax.
 * Returns null if activity doesn't exist or doesn't belong to the organization.
 *
 * @param activityId - The activity ID to query
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<DataProcessingActivityWithComponents | null>
 *
 * @example
 * const activity = await getActivityWithComponents('activity-id', 'org-id')
 * console.log(activity.purposes.map(p => p.purpose.name))
 */
export async function getActivityWithComponents(
  activityId: string,
  organizationId: string
): Promise<DataProcessingActivityWithComponents | null> {
  return await prisma.dataProcessingActivity.findUnique({
    where: {
      id: activityId,
      organizationId,
    },
    include: {
      purposes: {
        include: {
          purpose: true,
        },
      },
      dataSubjects: {
        include: {
          dataSubjectCategory: true,
        },
      },
      dataCategories: {
        include: {
          dataCategory: true,
        },
      },
      recipients: {
        include: {
          recipient: true,
        },
      },
    },
  })
}
