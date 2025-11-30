import type { Organization, OrganizationStatus } from '../index'
import { Prisma, prisma } from '../index'
import { generateSlug } from '../utils/tokens'

/**
 * Create a new organization
 */
export async function createOrganization(data: {
  name: string
  slug: string
  status?: OrganizationStatus
  settings?: Prisma.InputJsonValue
}): Promise<Organization> {
  return await prisma.organization.create({
    data: {
      name: data.name,
      slug: data.slug,
      status: data.status ?? 'ACTIVE',
      settings: data.settings ?? Prisma.JsonNull,
    },
  })
}

/**
 * Create an organization with an initial owner user
 * Used during signup flow - creates both organization and assigns user
 * @param name - Organization name
 * @param userId - ID of the user to assign as organization owner (currently unused, kept for future use)
 * @param status - Organization status (defaults to ACTIVE)
 * @returns Created organization
 */
export async function createOrganizationWithOwner(
  name: string,
  _userId: string, // Prefixed with underscore to indicate intentionally unused parameter
  status: OrganizationStatus = 'ACTIVE'
): Promise<Organization> {
  const slug = generateSlug(name)

  // Check if slug already exists
  const existing = await getOrganizationBySlug(slug)
  if (existing) {
    // Append random suffix to make slug unique
    const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 8)}`
    return await prisma.organization.create({
      data: {
        name,
        slug: uniqueSlug,
        status,
      },
    })
  }

  return await prisma.organization.create({
    data: {
      name,
      slug,
      status,
    },
  })
}

/**
 * Generate a slug from an organization name
 * Exported utility for external use
 */
export function generateSlugFromName(name: string): string {
  return generateSlug(name)
}

/**
 * Get an organization by its ID
 */
export async function getOrganizationById(id: string): Promise<Organization | null> {
  return await prisma.organization.findUnique({
    where: { id },
  })
}

/**
 * Get an organization by its slug
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  return await prisma.organization.findUnique({
    where: { slug },
  })
}

/**
 * Update an organization
 */
export async function updateOrganization(
  id: string,
  data: {
    name?: string
    slug?: string
    status?: OrganizationStatus
    settings?: Prisma.InputJsonValue
  }
): Promise<Organization> {
  return await prisma.organization.update({
    where: { id },
    data,
  })
}

/**
 * Soft delete an organization by setting deletedAt timestamp
 */
export async function softDeleteOrganization(id: string): Promise<Organization> {
  return await prisma.organization.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

/**
 * Restore a soft-deleted organization by clearing deletedAt timestamp
 */
export async function restoreOrganization(id: string): Promise<Organization> {
  return await prisma.organization.update({
    where: { id },
    data: { deletedAt: null },
  })
}

/**
 * List all organizations, optionally including soft-deleted ones
 */
export async function listOrganizations(includeDeleted = false): Promise<Organization[]> {
  return await prisma.organization.findMany({
    where: includeDeleted ? {} : { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })
}
