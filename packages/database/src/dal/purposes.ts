import type { Purpose, PurposeCategory, PurposeScope } from '../index'
import { prisma } from '../index'

/**
 * List purposes by organization with optional filtering
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 */
export async function listPurposesByOrganization(
  organizationId: string,
  options?: {
    category?: PurposeCategory
    scope?: PurposeScope
    isActive?: boolean
  }
): Promise<Purpose[]> {
  return prisma.purpose.findMany({
    where: {
      organizationId,
      ...(options?.category ? { category: options.category } : {}),
      ...(options?.scope ? { scope: options.scope } : {}),
      ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
    },
    orderBy: [{ name: 'asc' }],
  })
}

/**
 * Get a purpose by its ID
 * Returns null if purpose doesn't exist
 */
export async function getPurposeById(id: string): Promise<Purpose | null> {
  return prisma.purpose.findUnique({
    where: { id },
  })
}

/**
 * Create a new purpose
 * SECURITY: Purpose is automatically scoped to the provided organizationId
 */
export async function createPurpose(data: {
  name: string
  description?: string
  category: PurposeCategory
  scope: PurposeScope
  organizationId: string
  isActive?: boolean
}): Promise<Purpose> {
  return prisma.purpose.create({
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      scope: data.scope,
      organizationId: data.organizationId,
      isActive: data.isActive ?? true,
    },
  })
}

/**
 * Update a purpose
 * SECURITY: Caller must verify purpose belongs to their organization before calling
 */
export async function updatePurpose(
  id: string,
  data: {
    name?: string
    description?: string | null
    category?: PurposeCategory
    scope?: PurposeScope
    isActive?: boolean
  }
): Promise<Purpose> {
  return prisma.purpose.update({
    where: { id },
    data,
  })
}

/**
 * Delete a purpose
 * SECURITY: Caller must verify purpose belongs to their organization before calling
 */
export async function deletePurpose(id: string): Promise<Purpose> {
  return prisma.purpose.delete({
    where: { id },
  })
}
