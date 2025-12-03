/**
 * Test factory for ExternalOrganization entities
 *
 * ExternalOrganization represents external legal entities (vendors, partners, authorities)
 * and is a global entity (not scoped to any organization).
 *
 * Usage:
 *   const externalOrg = await createTestExternalOrganization({
 *     legalName: 'Custom Legal Name',
 *   })
 */

import type { ExternalOrganization } from '../../index'
import { prisma } from '../../index'

let sequenceNumber = 0

/**
 * Create a test external organization with sensible defaults
 *
 * @param overrides - Optional partial ExternalOrganization data to override defaults
 * @returns Promise<ExternalOrganization>
 */
export async function createTestExternalOrganization(
  overrides: Partial<{
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
  }> = {}
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
 * Clean up test external organizations
 *
 * @param ids - Array of external organization IDs to delete
 */
export async function cleanupTestExternalOrganizations(ids: string[]): Promise<void> {
  if (ids.length === 0) return

  await prisma.externalOrganization.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  })
}
