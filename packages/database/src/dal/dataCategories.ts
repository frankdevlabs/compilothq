import type { DataCategory, Prisma, SensitivityLevel } from '../index'
import { prisma } from '../index'

/**
 * Type for DataCategory with relations included
 */
export type DataCategoryWithRelations = DataCategory & {
  dataNatures: Array<{
    id: string
    dataCategoryId: string
    dataNatureId: string
    createdAt: Date
    dataNature: {
      id: string
      name: string
      description: string
      type: 'SPECIAL' | 'NON_SPECIAL'
      gdprArticle: string
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }
  }>
}

/**
 * Input type for creating a data category
 */
export type DataCategoryCreateInput = {
  name: string
  description?: string
  organizationId: string
  sensitivity: SensitivityLevel
  isSpecialCategory?: boolean // Manual override
  exampleFields?: string[]
  metadata?: Prisma.InputJsonValue
  dataNatureIds?: string[]
}

/**
 * Input type for updating a data category
 */
export type DataCategoryUpdateInput = {
  name?: string
  description?: string | null
  sensitivity?: SensitivityLevel
  isSpecialCategory?: boolean
  exampleFields?: string[] | null
  metadata?: Prisma.InputJsonValue
  dataNatureIds?: string[]
  isActive?: boolean
}

/**
 * Options for listing data categories
 */
export type DataCategoryListOptions = {
  sensitivity?: SensitivityLevel
  isSpecialCategory?: boolean
  search?: string
  isActive?: boolean
  limit?: number
  cursor?: string
}

/**
 * Sensitivity level ordering for threshold comparisons
 */
const SENSITIVITY_ORDER: Record<SensitivityLevel, number> = {
  PUBLIC: 0,
  INTERNAL: 1,
  CONFIDENTIAL: 2,
  RESTRICTED: 3,
}

/**
 * Helper function to calculate isSpecialCategory based on linked DataNatures
 * SECURITY: Conservative principle - returns true if ANY linked DataNature is SPECIAL
 *
 * @param dataNatureIds - Array of DataNature IDs to check
 * @returns true if any DataNature has type='SPECIAL', false otherwise
 */
async function calculateIsSpecialCategory(dataNatureIds: string[]): Promise<boolean> {
  if (dataNatureIds.length === 0) {
    return false
  }

  const dataNatures = await prisma.dataNature.findMany({
    where: {
      id: {
        in: dataNatureIds,
      },
    },
    select: {
      type: true,
    },
  })

  // Conservative principle: if ANY linked DataNature is SPECIAL, return true
  return dataNatures.some((dn) => dn.type === 'SPECIAL')
}

/**
 * Helper function to merge override metadata
 * Preserves existing metadata fields while adding/updating override information
 *
 * @param existingMetadata - Current metadata object
 * @param isSpecialCategory - Manually set value
 * @param calculatedValue - Auto-calculated value from DataNatures
 * @param justification - Justification for override
 * @returns Merged metadata object
 */
function mergeOverrideMetadata(
  existingMetadata: Prisma.InputJsonValue | undefined,
  isSpecialCategory: boolean,
  calculatedValue: boolean,
  justification?: string
): Prisma.InputJsonValue {
  const base: Prisma.JsonObject =
    typeof existingMetadata === 'object' && !Array.isArray(existingMetadata)
      ? (existingMetadata as Prisma.JsonObject)
      : {}

  // Only add override metadata if manual value differs from calculated
  if (isSpecialCategory !== calculatedValue) {
    return {
      ...base,
      specialCategoryOverride: {
        overridden: true,
        justification: justification ?? 'Manual override applied',
        overriddenAt: new Date().toISOString(),
      },
    } as Prisma.InputJsonValue
  }

  return base as Prisma.InputJsonValue
}

/**
 * Create a new data category
 * SECURITY: Activity is automatically scoped to the provided organizationId
 *
 * Automatically calculates isSpecialCategory based on linked DataNatures unless manually overridden.
 * If manual override differs from calculated value, stores justification in metadata.
 */
export async function createDataCategory(data: DataCategoryCreateInput): Promise<DataCategory> {
  // Auto-calculate isSpecialCategory if not manually provided
  let finalIsSpecialCategory: boolean
  let metadata: Prisma.InputJsonValue | undefined = data.metadata

  if (data.dataNatureIds && data.dataNatureIds.length > 0) {
    const calculatedValue = await calculateIsSpecialCategory(data.dataNatureIds)

    if (data.isSpecialCategory !== undefined) {
      // Manual override provided
      finalIsSpecialCategory = data.isSpecialCategory

      // Extract justification if it exists in metadata
      let justification: string | undefined
      if (typeof data.metadata === 'object' && !Array.isArray(data.metadata)) {
        const metadataObj = data.metadata as Record<string, unknown>
        const specialOverride = metadataObj['specialCategoryOverride']
        if (typeof specialOverride === 'object' && specialOverride !== null) {
          const override = specialOverride as Record<string, unknown>
          if (typeof override['justification'] === 'string') {
            justification = override['justification']
          }
        }
      }

      metadata = mergeOverrideMetadata(
        data.metadata,
        data.isSpecialCategory,
        calculatedValue,
        justification
      )
    } else {
      // Use calculated value
      finalIsSpecialCategory = calculatedValue
    }
  } else {
    // No DataNatures linked - use manual value or default to false
    finalIsSpecialCategory = data.isSpecialCategory ?? false
  }

  // Use transaction to ensure atomic creation of category and junction entries
  return await prisma.$transaction(async (tx) => {
    const category = await tx.dataCategory.create({
      data: {
        name: data.name,
        description: data.description,
        organizationId: data.organizationId,
        sensitivity: data.sensitivity,
        isSpecialCategory: finalIsSpecialCategory,
        exampleFields: data.exampleFields as Prisma.InputJsonValue | undefined,
        metadata: metadata,
      },
    })

    // Create junction table entries if dataNatureIds provided
    if (data.dataNatureIds && data.dataNatureIds.length > 0) {
      await tx.dataCategoryDataNature.createMany({
        data: data.dataNatureIds.map((dataNatureId) => ({
          dataCategoryId: category.id,
          dataNatureId: dataNatureId,
        })),
      })
    }

    return category
  })
}

/**
 * Get a data category by ID with ownership verification
 * SECURITY: Enforces multi-tenancy by requiring both id and organizationId match
 *
 * @param id - DataCategory ID
 * @param organizationId - Organization ID for ownership verification
 * @returns DataCategory with relations or null if not found or wrong organization
 */
export async function getDataCategoryById(
  id: string,
  organizationId: string
): Promise<DataCategoryWithRelations | null> {
  return await prisma.dataCategory.findUnique({
    where: {
      id,
      organizationId,
    },
    include: {
      dataNatures: {
        include: {
          dataNature: true,
        },
      },
    },
  })
}

/**
 * List data categories by organization with cursor-based pagination
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 *
 * @param organizationId - Organization ID
 * @param options - Filter and pagination options
 * @returns Paginated list of data categories with nextCursor
 */
export async function listDataCategories(
  organizationId: string,
  options?: DataCategoryListOptions
): Promise<{
  items: DataCategoryWithRelations[]
  nextCursor: string | null
}> {
  const limit = options?.limit ?? 50

  const categories = await prisma.dataCategory.findMany({
    where: {
      organizationId,
      ...(options?.sensitivity ? { sensitivity: options.sensitivity } : {}),
      ...(options?.isSpecialCategory !== undefined
        ? { isSpecialCategory: options.isSpecialCategory }
        : {}),
      ...(options?.search
        ? {
            name: {
              contains: options.search,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
    },
    include: {
      dataNatures: {
        include: {
          dataNature: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1, // Fetch one extra to determine if there are more
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  })

  // Check if there are more items
  const hasMore = categories.length > limit
  const items = hasMore ? categories.slice(0, limit) : categories
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null

  return {
    items,
    nextCursor,
  }
}

/**
 * Update a data category
 * SECURITY: Verify organizationId ownership before update
 *
 * When dataNatureIds are updated, recalculates isSpecialCategory unless manually overridden.
 * Supports explicit null values to clear optional fields.
 */
export async function updateDataCategory(
  id: string,
  organizationId: string,
  data: DataCategoryUpdateInput
): Promise<DataCategory> {
  // First verify record exists and belongs to organization
  const existing = await prisma.dataCategory.findUnique({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error(`DataCategory with id ${id} not found or does not belong to organization`)
  }

  // Use transaction for atomic update with junction table changes
  return await prisma.$transaction(async (tx) => {
    let finalIsSpecialCategory = data.isSpecialCategory
    let metadata = data.metadata

    // Handle dataNatureIds update
    if (data.dataNatureIds !== undefined) {
      // Delete existing junction entries
      await tx.dataCategoryDataNature.deleteMany({
        where: {
          dataCategoryId: id,
        },
      })

      // Create new junction entries
      if (data.dataNatureIds.length > 0) {
        await tx.dataCategoryDataNature.createMany({
          data: data.dataNatureIds.map((dataNatureId) => ({
            dataCategoryId: id,
            dataNatureId: dataNatureId,
          })),
        })

        // Recalculate isSpecialCategory if not manually overridden
        if (data.isSpecialCategory === undefined) {
          const calculatedValue = await calculateIsSpecialCategory(data.dataNatureIds)
          finalIsSpecialCategory = calculatedValue
        }
      } else {
        // No natures linked, default to false if not manually set
        if (data.isSpecialCategory === undefined) {
          finalIsSpecialCategory = false
        }
      }
    }

    // Build update data object - handle Json fields carefully
    const updateData: Prisma.DataCategoryUpdateInput = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.sensitivity !== undefined ? { sensitivity: data.sensitivity } : {}),
      ...(finalIsSpecialCategory !== undefined
        ? { isSpecialCategory: finalIsSpecialCategory }
        : {}),
      ...(data.exampleFields !== undefined
        ? {
            exampleFields: data.exampleFields as
              | Prisma.InputJsonValue
              | Prisma.NullableJsonNullValueInput,
          }
        : {}),
      ...(metadata !== undefined ? { metadata: metadata } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    }

    return await tx.dataCategory.update({
      where: { id },
      data: updateData,
    })
  })
}

/**
 * Delete a data category
 * SECURITY: Verify organizationId ownership before delete
 *
 * Junction table entries cascade delete automatically.
 *
 * @param id - DataCategory ID
 * @param organizationId - Organization ID for ownership verification
 * @returns Deleted DataCategory
 */
export async function deleteDataCategory(
  id: string,
  organizationId: string
): Promise<DataCategory> {
  // First verify record exists and belongs to organization
  const existing = await prisma.dataCategory.findUnique({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error(`DataCategory with id ${id} not found or does not belong to organization`)
  }

  // Junction table entries cascade delete automatically due to onDelete: Cascade
  return await prisma.dataCategory.delete({
    where: { id },
  })
}

/**
 * Get all special category data categories for an organization
 * Convenience function for Article 9/10 compliance views
 *
 * @param organizationId - Organization ID
 * @returns List of special category data categories
 */
export async function getSpecialCategoryDataCategories(
  organizationId: string
): Promise<DataCategoryWithRelations[]> {
  return await prisma.dataCategory.findMany({
    where: {
      organizationId,
      isSpecialCategory: true,
      isActive: true,
    },
    include: {
      dataNatures: {
        include: {
          dataNature: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })
}

/**
 * Get data categories by minimum sensitivity level
 * Filters categories at or above the specified sensitivity threshold
 *
 * @param organizationId - Organization ID
 * @param minSensitivity - Minimum sensitivity level threshold
 * @returns List of data categories matching or exceeding sensitivity level
 */
export async function getDataCategoriesBySensitivity(
  organizationId: string,
  minSensitivity: SensitivityLevel
): Promise<DataCategoryWithRelations[]> {
  // Get the minimum threshold value
  // eslint-disable-next-line security/detect-object-injection -- Safe: minSensitivity is a typed enum (SensitivityLevel), not user input
  const minThreshold = SENSITIVITY_ORDER[minSensitivity]

  // Get all sensitivity levels at or above threshold
  const eligibleLevels = Object.entries(SENSITIVITY_ORDER)
    .filter(([, value]) => value >= minThreshold)
    .map(([key]) => key as SensitivityLevel)

  return await prisma.dataCategory.findMany({
    where: {
      organizationId,
      sensitivity: {
        in: eligibleLevels,
      },
      isActive: true,
    },
    include: {
      dataNatures: {
        include: {
          dataNature: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })
}
