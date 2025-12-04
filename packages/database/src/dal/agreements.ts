/**
 * Data Access Layer for Agreement entities
 *
 * Agreement represents legal agreements (DPA, SCC, etc.) with external organizations.
 * This is a TENANT-BOUND entity scoped to organizations.
 *
 * SECURITY: All operations enforce multi-tenancy by requiring organizationId.
 */

import type { Agreement, AgreementStatus, AgreementType } from '../index'
import { prisma } from '../index'

/**
 * Agreement with included ExternalOrganization relation
 */
export type AgreementWithOrganization = Agreement & {
  externalOrganization: {
    id: string
    legalName: string
    tradingName: string | null
  }
}

/**
 * Create a new agreement
 *
 * SECURITY: Enforces multi-tenancy by requiring organizationId
 * SECURITY: Verifies ExternalOrganization belongs to same tenant
 *
 * @param data - Agreement data with organizationId, externalOrganizationId, and type (required)
 * @returns Created Agreement
 * @throws Error if ExternalOrganization not found or does not belong to organization
 *
 * @example
 * ```typescript
 * const agreement = await createAgreement({
 *   organizationId: 'org-id',
 *   externalOrganizationId: 'ext-org-id',
 *   type: 'DPA',
 *   status: 'ACTIVE',
 *   signedDate: new Date('2024-01-01'),
 *   expiryDate: new Date('2026-01-01')
 * })
 * ```
 */
export async function createAgreement(data: {
  organizationId: string
  externalOrganizationId: string
  type: AgreementType
  status?: AgreementStatus
  signedDate?: Date | null
  expiryDate?: Date | null
}): Promise<Agreement> {
  // SECURITY: Verify ExternalOrganization belongs to same organization
  const externalOrg = await prisma.externalOrganization.findUnique({
    where: {
      id: data.externalOrganizationId,
      organizationId: data.organizationId,
    },
  })

  if (!externalOrg) {
    throw new Error('ExternalOrganization not found or does not belong to organization')
  }

  return await prisma.agreement.create({
    data: {
      organizationId: data.organizationId,
      externalOrganizationId: data.externalOrganizationId,
      type: data.type,
      status: data.status ?? 'DRAFT',
      signedDate: data.signedDate,
      expiryDate: data.expiryDate,
    },
  })
}

/**
 * Get an agreement by ID
 *
 * SECURITY: Enforces multi-tenancy by requiring both id and organizationId match
 *
 * Returns null if agreement doesn't exist or doesn't belong to the specified organization.
 *
 * @param id - Agreement ID
 * @param organizationId - Organization ID (tenant context)
 * @returns Agreement or null
 *
 * @example
 * ```typescript
 * const agreement = await getAgreementById('agreement-id', 'org-id')
 * if (agreement) {
 *   console.log(agreement.type, agreement.status)
 * }
 * ```
 */
export async function getAgreementById(
  id: string,
  organizationId: string
): Promise<Agreement | null> {
  return await prisma.agreement.findUnique({
    where: {
      id,
      organizationId,
    },
  })
}

/**
 * Get an agreement by ID with external organization details
 *
 * SECURITY: Enforces multi-tenancy by requiring both id and organizationId match
 *
 * Returns null if agreement doesn't exist or doesn't belong to the specified organization.
 *
 * @param id - Agreement ID
 * @param organizationId - Organization ID (tenant context)
 * @returns Agreement with ExternalOrganization or null
 *
 * @example
 * ```typescript
 * const agreement = await getAgreementByIdWithOrganization('agreement-id', 'org-id')
 * if (agreement) {
 *   console.log(`${agreement.type} with ${agreement.externalOrganization.legalName}`)
 * }
 * ```
 */
export async function getAgreementByIdWithOrganization(
  id: string,
  organizationId: string
): Promise<AgreementWithOrganization | null> {
  return await prisma.agreement.findUnique({
    where: {
      id,
      organizationId,
    },
    include: {
      externalOrganization: {
        select: {
          id: true,
          legalName: true,
          tradingName: true,
        },
      },
    },
  })
}

/**
 * List agreements for an organization with optional filters
 *
 * SECURITY: Enforces multi-tenancy by filtering all results to the specified organization
 *
 * @param organizationId - Organization ID (tenant context)
 * @param options - Filter options
 * @returns Array of agreements
 *
 * @example
 * ```typescript
 * // All active DPAs
 * const dpas = await listAgreementsByOrganization('org-id', {
 *   type: 'DPA',
 *   status: 'ACTIVE'
 * })
 *
 * // All agreements expiring soon
 * const expiringSoon = await listAgreementsByOrganization('org-id', {
 *   status: 'EXPIRING_SOON'
 * })
 * ```
 */
export async function listAgreementsByOrganization(
  organizationId: string,
  options?: {
    type?: AgreementType
    status?: AgreementStatus
    externalOrganizationId?: string
  }
): Promise<AgreementWithOrganization[]> {
  return await prisma.agreement.findMany({
    where: {
      organizationId,
      ...(options?.type ? { type: options.type } : {}),
      ...(options?.status ? { status: options.status } : {}),
      ...(options?.externalOrganizationId
        ? { externalOrganizationId: options.externalOrganizationId }
        : {}),
    },
    include: {
      externalOrganization: {
        select: {
          id: true,
          legalName: true,
          tradingName: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  })
}

/**
 * Get all agreements for a specific external organization
 *
 * SECURITY: Enforces multi-tenancy by requiring organizationId
 *
 * @param externalOrganizationId - ExternalOrganization ID
 * @param organizationId - Organization ID (tenant context)
 * @param options - Filter options
 * @returns Array of agreements
 *
 * @example
 * ```typescript
 * const agreements = await getAgreementsByExternalOrganization('ext-org-id', 'org-id', {
 *   status: 'ACTIVE'
 * })
 * ```
 */
export async function getAgreementsByExternalOrganization(
  externalOrganizationId: string,
  organizationId: string,
  options?: {
    type?: AgreementType
    status?: AgreementStatus
  }
): Promise<Agreement[]> {
  return await prisma.agreement.findMany({
    where: {
      organizationId,
      externalOrganizationId,
      ...(options?.type ? { type: options.type } : {}),
      ...(options?.status ? { status: options.status } : {}),
    },
    orderBy: [{ createdAt: 'desc' }],
  })
}

/**
 * Get agreements expiring within a specified number of days
 *
 * SECURITY: Enforces multi-tenancy by filtering to the specified organization
 *
 * Returns active agreements that will expire within the threshold.
 *
 * @param organizationId - Organization ID (tenant context)
 * @param daysThreshold - Number of days to look ahead (default: 30)
 * @returns Array of expiring agreements with external organization details
 *
 * @example
 * ```typescript
 * // Agreements expiring in next 30 days
 * const expiring = await getExpiringAgreements('org-id')
 *
 * // Agreements expiring in next 90 days
 * const expiring90 = await getExpiringAgreements('org-id', 90)
 * ```
 */
export async function getExpiringAgreements(
  organizationId: string,
  daysThreshold = 30
): Promise<AgreementWithOrganization[]> {
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

  return await prisma.agreement.findMany({
    where: {
      organizationId,
      status: 'ACTIVE',
      expiryDate: {
        not: null,
        lte: thresholdDate,
        gte: new Date(), // Only future expiry dates
      },
    },
    include: {
      externalOrganization: {
        select: {
          id: true,
          legalName: true,
          tradingName: true,
        },
      },
    },
    orderBy: [{ expiryDate: 'asc' }],
  })
}

/**
 * Update an agreement
 *
 * SECURITY: Enforces multi-tenancy by verifying ownership before update
 *
 * @param id - Agreement ID
 * @param organizationId - Organization ID (tenant context)
 * @param data - Fields to update (all optional)
 * @returns Updated Agreement
 * @throws Error if Agreement not found or does not belong to organization
 *
 * @example
 * ```typescript
 * const updated = await updateAgreement('agreement-id', 'org-id', {
 *   status: 'ACTIVE',
 *   signedDate: new Date()
 * })
 * ```
 */
export async function updateAgreement(
  id: string,
  organizationId: string,
  data: {
    type?: AgreementType
    status?: AgreementStatus
    signedDate?: Date | null
    expiryDate?: Date | null
  }
): Promise<Agreement> {
  // SECURITY: Verify ownership before update
  const existing = await prisma.agreement.findUnique({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Agreement not found or does not belong to organization')
  }

  return await prisma.agreement.update({
    where: { id },
    data,
  })
}

/**
 * Delete an agreement
 *
 * SECURITY: Enforces multi-tenancy by verifying ownership before delete
 *
 * @param id - Agreement ID
 * @param organizationId - Organization ID (tenant context)
 * @returns Deleted Agreement
 * @throws Error if Agreement not found or does not belong to organization
 *
 * @example
 * ```typescript
 * const deleted = await deleteAgreement('agreement-id', 'org-id')
 * console.log(`Deleted ${deleted.type} agreement`)
 * ```
 */
export async function deleteAgreement(id: string, organizationId: string): Promise<Agreement> {
  // SECURITY: Verify ownership before delete
  const existing = await prisma.agreement.findUnique({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Agreement not found or does not belong to organization')
  }

  return await prisma.agreement.delete({
    where: { id },
  })
}
