/**
 * Data Access Layer for ExternalOrganization entities
 *
 * ExternalOrganization represents external legal entities (vendors, partners, authorities)
 * that receive personal data. This is a GLOBAL entity - not scoped to any organization.
 * Multiple tenants can reference the same ExternalOrganization.
 *
 * SECURITY: No organizationId scoping - this is intentionally a shared/global entity.
 */

import type { ExternalOrganization, Prisma } from '../index'
import { prisma } from '../index'

/**
 * Create a new external organization
 *
 * SECURITY: Global entity (no organizationId scoping)
 *
 * @param data - Organization data with legalName (required) and optional fields
 * @returns Created ExternalOrganization
 *
 * @example
 * ```typescript
 * const org = await createExternalOrganization({
 *   legalName: 'Recruitee B.V.',
 *   tradingName: 'Recruitee',
 *   jurisdiction: 'NL',
 *   headquartersCountryId: 'country-id'
 * })
 * ```
 */
export async function createExternalOrganization(data: {
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
 * Returns null if organization doesn't exist.
 * Optionally includes the headquartersCountry relation.
 *
 * @param id - ExternalOrganization ID
 * @returns ExternalOrganization or null
 *
 * @example
 * ```typescript
 * const org = await getExternalOrganizationById('org-id')
 * if (org) {
 *   console.log(org.legalName)
 * }
 * ```
 */
export async function getExternalOrganizationById(
  id: string
): Promise<ExternalOrganization | null> {
  return await prisma.externalOrganization.findUnique({
    where: { id },
  })
}

/**
 * List external organizations with cursor-based pagination and filters
 *
 * SECURITY: Global entity (no organizationId scoping)
 *
 * @param options - Pagination and filter options
 * @returns Paginated list with nextCursor for pagination
 *
 * @example
 * ```typescript
 * // First page
 * const firstPage = await listExternalOrganizations({ limit: 50 })
 *
 * // Second page using cursor
 * const secondPage = await listExternalOrganizations({
 *   limit: 50,
 *   cursor: firstPage.nextCursor
 * })
 *
 * // Filtered by public authority
 * const authorities = await listExternalOrganizations({
 *   isPublicAuthority: true
 * })
 * ```
 */
export async function listExternalOrganizations(options?: {
  legalName?: string
  isPublicAuthority?: boolean
  headquartersCountryId?: string
  limit?: number
  cursor?: string
}): Promise<{
  items: ExternalOrganization[]
  nextCursor: string | null
}> {
  const limit = options?.limit ?? 50

  const organizations = await prisma.externalOrganization.findMany({
    where: {
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
 * SECURITY: Global entity (no organizationId scoping)
 * NOTE: Caller should verify appropriate permissions before updating shared entities
 *
 * Supports explicit null values to clear optional fields.
 *
 * @param id - ExternalOrganization ID
 * @param data - Fields to update (all optional)
 * @returns Updated ExternalOrganization
 *
 * @example
 * ```typescript
 * // Update specific fields
 * const updated = await updateExternalOrganization('org-id', {
 *   tradingName: 'New Trading Name',
 *   website: 'https://new-site.com'
 * })
 *
 * // Clear optional fields with explicit null
 * await updateExternalOrganization('org-id', {
 *   tradingName: null,
 *   website: null
 * })
 * ```
 */
export async function updateExternalOrganization(
  id: string,
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
  return await prisma.externalOrganization.update({
    where: { id },
    data,
  })
}

/**
 * Delete an external organization
 *
 * SECURITY: Global entity (no organizationId scoping)
 * NOTE: Caller should verify appropriate permissions before deleting shared entities
 *
 * WARNING: This will set externalOrganizationId to NULL on all Recipients
 * that reference this organization (onDelete: SetNull).
 * Agreements will be cascade deleted (onDelete: Cascade).
 *
 * @param id - ExternalOrganization ID
 * @returns Deleted ExternalOrganization
 *
 * @example
 * ```typescript
 * const deleted = await deleteExternalOrganization('org-id')
 * console.log(`Deleted ${deleted.legalName}`)
 * ```
 */
export async function deleteExternalOrganization(id: string): Promise<ExternalOrganization> {
  return await prisma.externalOrganization.delete({
    where: { id },
  })
}
