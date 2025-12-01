import type { DataSubjectCategory } from '../index'
import { prisma } from '../index'

/**
 * List all active data subject categories for an organization (includes org-specific + system-wide)
 * @param organizationId - Optional organization ID to filter by
 * @returns Array of active data subject categories
 */
export async function listDataSubjectCategories(
  organizationId?: string
): Promise<DataSubjectCategory[]> {
  return prisma.dataSubjectCategory.findMany({
    where: {
      isActive: true,
      OR: organizationId
        ? [{ organizationId }, { organizationId: null }]
        : [{ organizationId: null }],
    },
    orderBy: { name: 'asc' },
  })
}

/**
 * Get a data subject category by its ID
 * @param id - Data subject category ID
 * @returns Data subject category or null
 */
export async function getDataSubjectCategoryById(id: string): Promise<DataSubjectCategory | null> {
  return prisma.dataSubjectCategory.findUnique({
    where: { id },
  })
}

/**
 * Get a data subject category by its code with organization scope
 * First tries to find org-specific category, then falls back to system-wide
 * @param code - Data subject category code
 * @param organizationId - Optional organization ID for scoping
 * @returns Data subject category or null
 */
export async function getDataSubjectCategoryByCode(
  code: string,
  organizationId?: string
): Promise<DataSubjectCategory | null> {
  // Try to find org-specific category first
  if (organizationId) {
    const orgCategory = await prisma.dataSubjectCategory.findFirst({
      where: {
        code,
        organizationId,
      },
    })

    if (orgCategory) {
      return orgCategory
    }
  }

  // Fall back to system-wide category
  return prisma.dataSubjectCategory.findFirst({
    where: {
      code,
      organizationId: null,
    },
  })
}

/**
 * Get all vulnerable data subject categories (filters by isVulnerable = true)
 * @param organizationId - Optional organization ID to filter by
 * @returns Array of vulnerable data subject categories
 */
export async function getVulnerableDataSubjectCategories(
  organizationId?: string
): Promise<DataSubjectCategory[]> {
  return prisma.dataSubjectCategory.findMany({
    where: {
      isVulnerable: true,
      isActive: true,
      OR: organizationId
        ? [{ organizationId }, { organizationId: null }]
        : [{ organizationId: null }],
    },
    orderBy: { name: 'asc' },
  })
}
