/**
 * Data Access Layer for ExternalOrganization entities
 *
 * ExternalOrganization represents external legal entities (vendors, partners, authorities)
 * that receive personal data. This is a TENANT-BOUND entity scoped to organizations.
 *
 * SECURITY: All operations enforce multi-tenancy by requiring organizationId.
 */

import type { ExternalOrganization, Prisma } from '../index'
import { prisma } from '../index'

/**
 * Create a new external organization
 *
 * SECURITY: Enforces multi-tenancy by requiring organizationId
 *
 * @param data - Organization data with organizationId and legalName (required) and optional fields
 * @returns Created ExternalOrganization
 *
 * @example
 * ```typescript
 * const org = await createExternalOrganization({
 *   organizationId: 'org-id',
 *   legalName: 'Recruitee B.V.',
 *   tradingName: 'Recruitee',
 *   jurisdiction: 'NL',
 *   headquartersCountryId: 'country-id'
 * })
 * ```
 */
export async function createExternalOrganization(data: {
  organizationId: string
  legalName: string
  tradingName?: string | null
  jurisdiction?: string | null
  registrationNumber?: string | null
  vatNumber?: string | null
  headquartersCountryId?: string | null
  operatingCountries?: string[]
  website?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  isPublicAuthority?: boolean
  sector?: string | null
  notes?: string | null
  metadata?: Prisma.InputJsonValue
}): Promise<ExternalOrganization> {
  return await prisma.externalOrganization.create({
    data: {
      organizationId: data.organizationId,
      legalName: data.legalName,
      tradingName: data.tradingName,
      jurisdiction: data.jurisdiction,
      registrationNumber: data.registrationNumber,
      vatNumber: data.vatNumber,
      headquartersCountryId: data.headquartersCountryId,
      operatingCountries: data.operatingCountries ?? [],
      website: data.website,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      isPublicAuthority: data.isPublicAuthority ?? false,
      sector: data.sector,
      notes: data.notes,
      metadata: data.metadata,
    },
  })
}

/**
 * Get an external organization by ID
 *
 * SECURITY: Enforces multi-tenancy by requiring both id and organizationId match
 *
 * Returns null if organization doesn't exist or doesn't belong to the specified organization.
 *
 * @param id - ExternalOrganization ID
 * @param organizationId - Organization ID (tenant context)
 * @returns ExternalOrganization or null
 *
 * @example
 * ```typescript
 * const org = await getExternalOrganizationById('ext-org-id', 'org-id')
 * if (org) {
 *   console.log(org.legalName)
 * }
 * ```
 */
export async function getExternalOrganizationById(
  id: string,
  organizationId: string
): Promise<ExternalOrganization | null> {
  return await prisma.externalOrganization.findUnique({
    where: {
      id,
      organizationId,
    },
  })
}

/**
 * List external organizations with cursor-based pagination and filters
 *
 * SECURITY: Enforces multi-tenancy by filtering all results to the specified organization
 *
 * @param organizationId - Organization ID (tenant context)
 * @param options - Pagination and filter options
 * @returns Paginated list with nextCursor for pagination
 *
 * @example
 * ```typescript
 * // First page
 * const firstPage = await listExternalOrganizations('org-id', { limit: 50 })
 *
 * // Second page using cursor
 * const secondPage = await listExternalOrganizations('org-id', {
 *   limit: 50,
 *   cursor: firstPage.nextCursor
 * })
 *
 * // Filtered by public authority
 * const authorities = await listExternalOrganizations('org-id', {
 *   isPublicAuthority: true
 * })
 * ```
 */
export async function listExternalOrganizations(
  organizationId: string,
  options?: {
    legalName?: string
    isPublicAuthority?: boolean
    headquartersCountryId?: string
    limit?: number
    cursor?: string
  }
): Promise<{
  items: ExternalOrganization[]
  nextCursor: string | null
}> {
  const limit = options?.limit ?? 50

  const organizations = await prisma.externalOrganization.findMany({
    where: {
      organizationId,
      ...(options?.legalName ? { legalName: options.legalName } : {}),
      ...(options?.isPublicAuthority !== undefined
        ? { isPublicAuthority: options.isPublicAuthority }
        : {}),
      ...(options?.headquartersCountryId
        ? { headquartersCountryId: options.headquartersCountryId }
        : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1, // Fetch one extra to determine if there are more
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  })

  // Check if there are more items
  const hasMore = organizations.length > limit
  const items = hasMore ? organizations.slice(0, limit) : organizations
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null

  return {
    items,
    nextCursor,
  }
}

/**
 * Update an external organization
 *
 * SECURITY: Enforces multi-tenancy by verifying ownership before update
 *
 * Supports explicit null values to clear optional fields.
 *
 * @param id - ExternalOrganization ID
 * @param organizationId - Organization ID (tenant context)
 * @param data - Fields to update (all optional)
 * @returns Updated ExternalOrganization
 * @throws Error if ExternalOrganization not found or does not belong to organization
 *
 * @example
 * ```typescript
 * // Update specific fields
 * const updated = await updateExternalOrganization('ext-org-id', 'org-id', {
 *   tradingName: 'New Trading Name',
 *   website: 'https://new-site.com'
 * })
 *
 * // Clear optional fields with explicit null
 * await updateExternalOrganization('ext-org-id', 'org-id', {
 *   tradingName: null,
 *   website: null
 * })
 * ```
 */
export async function updateExternalOrganization(
  id: string,
  organizationId: string,
  data: {
    legalName?: string
    tradingName?: string | null
    jurisdiction?: string | null
    registrationNumber?: string | null
    vatNumber?: string | null
    headquartersCountryId?: string | null
    operatingCountries?: string[]
    website?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
    isPublicAuthority?: boolean
    sector?: string | null
    notes?: string | null
    metadata?: Prisma.InputJsonValue
  }
): Promise<ExternalOrganization> {
  // SECURITY: Verify ownership before update
  const existing = await prisma.externalOrganization.findUnique({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('ExternalOrganization not found or does not belong to organization')
  }

  return await prisma.externalOrganization.update({
    where: { id },
    data,
  })
}

/**
 * Delete an external organization
 *
 * SECURITY: Enforces multi-tenancy by verifying ownership before delete
 *
 * WARNING: This will set externalOrganizationId to NULL on all Recipients
 * that reference this organization (onDelete: SetNull).
 * Agreements will be cascade deleted (onDelete: Cascade).
 *
 * @param id - ExternalOrganization ID
 * @param organizationId - Organization ID (tenant context)
 * @returns Deleted ExternalOrganization
 * @throws Error if ExternalOrganization not found or does not belong to organization
 *
 * @example
 * ```typescript
 * const deleted = await deleteExternalOrganization('ext-org-id', 'org-id')
 * console.log(`Deleted ${deleted.legalName}`)
 * ```
 */
export async function deleteExternalOrganization(
  id: string,
  organizationId: string
): Promise<ExternalOrganization> {
  // SECURITY: Verify ownership before delete
  const existing = await prisma.externalOrganization.findUnique({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('ExternalOrganization not found or does not belong to organization')
  }

  return await prisma.externalOrganization.delete({
    where: { id },
  })
}
