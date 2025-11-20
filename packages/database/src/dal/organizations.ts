import { prisma } from '../index'
import type { Organization, OrganizationStatus } from '.prisma/client'
import { Prisma } from '.prisma/client'

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
