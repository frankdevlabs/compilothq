/**
 * Test factory for Agreement entities
 *
 * Agreement represents legal agreements with external organizations
 * (DPAs, Joint Controller Agreements, SCCs, etc.)
 * This is a TENANT-BOUND entity scoped to organizations.
 *
 * Usage:
 *   const agreement = await createTestAgreement({
 *     organizationId: 'org-id',
 *     externalOrganizationId: externalOrg.id,
 *     type: 'DPA',
 *     status: 'ACTIVE',
 *   })
 */

import type { Agreement, AgreementStatus, AgreementType } from '../../index'
import { prisma } from '../../index'

let _sequenceNumber = 0

/**
 * Create a test agreement with sensible defaults
 *
 * @param data - Required organizationId and externalOrganizationId with optional overrides
 * @returns Promise<Agreement>
 */
export async function createTestAgreement(data: {
  organizationId: string
  externalOrganizationId: string
  type?: AgreementType
  status?: AgreementStatus
  signedDate?: Date
  expiryDate?: Date
}): Promise<Agreement> {
  _sequenceNumber++

  const defaults = {
    type: data.type ?? 'DPA',
    status: data.status ?? 'ACTIVE',
    signedDate: data.signedDate ?? new Date(),
    expiryDate: data.expiryDate ?? null,
  }

  return await prisma.agreement.create({
    data: {
      organizationId: data.organizationId,
      externalOrganizationId: data.externalOrganizationId,
      ...defaults,
    },
  })
}

/**
 * Clean up test agreements by organization IDs
 *
 * @param organizationIds - Array of organization IDs whose agreements should be deleted
 */
export async function cleanupTestAgreements(organizationIds: string[]): Promise<void> {
  if (organizationIds.length === 0) return

  await prisma.agreement.deleteMany({
    where: {
      organizationId: {
        in: organizationIds,
      },
    },
  })
}
