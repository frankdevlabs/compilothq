/**
 * Test factory for Agreement entities
 *
 * Agreement represents legal agreements with external organizations
 * (DPAs, Joint Controller Agreements, SCCs, etc.)
 *
 * Usage:
 *   const agreement = await createTestAgreement({
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
 * @param data - Required externalOrganizationId and optional overrides
 * @returns Promise<Agreement>
 */
export async function createTestAgreement(data: {
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
      externalOrganizationId: data.externalOrganizationId,
      ...defaults,
    },
  })
}

/**
 * Clean up test agreements
 *
 * @param ids - Array of agreement IDs to delete
 */
export async function cleanupTestAgreements(ids: string[]): Promise<void> {
  if (ids.length === 0) return

  await prisma.agreement.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  })
}
