/**
 * Test factory for ExternalOrganization entities
 *
 * ExternalOrganization represents external legal entities (vendors, partners, authorities)
 * and is a TENANT-BOUND entity scoped to organizations.
 *
 * Usage:
 *   const externalOrg = await createTestExternalOrganization({
 *     organizationId: 'org-id',
 *     legalName: 'Custom Legal Name',
 *   })
 */

import type { ExternalOrganization } from '../../index'
import { prisma } from '../../index'

let sequenceNumber = 0

/**
 * Create a test external organization with sensible defaults
 *
 * @param overrides - Optional partial ExternalOrganization data to override defaults (organizationId required)
 * @returns Promise<ExternalOrganization>
 */
export async function createTestExternalOrganization(
  overrides: Partial<{
    organizationId: string
    legalName: string
    tradingName: string
    jurisdiction: string
    registrationNumber: string
    vatNumber: string
    headquartersCountryId: string
    operatingCountries: string[]
    website: string
    contactEmail: string
    contactPhone: string
    isPublicAuthority: boolean
    sector: string
    notes: string
  }> & { organizationId: string } // organizationId is required
): Promise<ExternalOrganization> {
  sequenceNumber++

  const defaults = {
    legalName: `Test External Org ${sequenceNumber}`,
    tradingName: overrides.tradingName ?? null,
    jurisdiction: overrides.jurisdiction ?? null,
    registrationNumber: overrides.registrationNumber ?? null,
    vatNumber: overrides.vatNumber ?? null,
    headquartersCountryId: overrides.headquartersCountryId ?? null,
    operatingCountries: overrides.operatingCountries ?? [],
    website: overrides.website ?? null,
    contactEmail: overrides.contactEmail ?? null,
    contactPhone: overrides.contactPhone ?? null,
    isPublicAuthority: overrides.isPublicAuthority ?? false,
    sector: overrides.sector ?? null,
    notes: overrides.notes ?? null,
  }

  return await prisma.externalOrganization.create({
    data: {
      ...defaults,
      ...overrides,
    },
  })
}

/**
 * Clean up test external organizations by organization IDs
 *
 * @param organizationIds - Array of organization IDs whose external organizations should be deleted
 */
export async function cleanupTestExternalOrganizations(organizationIds: string[]): Promise<void> {
  if (organizationIds.length === 0) return

  await prisma.externalOrganization.deleteMany({
    where: {
      organizationId: {
        in: organizationIds,
      },
    },
  })
}
