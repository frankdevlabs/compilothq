import type { LegalBasis, LegalBasisType, RegulatoryFramework } from '../index'
import { prisma } from '../index'

/**
 * List all active legal bases ordered by type
 */
export async function listLegalBases(): Promise<LegalBasis[]> {
  return prisma.legalBasis.findMany({
    where: { isActive: true },
    orderBy: { type: 'asc' },
  })
}

/**
 * Get a legal basis by its ID
 */
export async function getLegalBasisById(id: string): Promise<LegalBasis | null> {
  return prisma.legalBasis.findUnique({
    where: { id },
  })
}

/**
 * Get a legal basis by its type
 */
export async function getLegalBasisByType(type: LegalBasisType): Promise<LegalBasis | null> {
  return prisma.legalBasis.findFirst({
    where: { type, isActive: true },
  })
}

/**
 * Get legal bases by regulatory framework
 */
export async function getLegalBasesByFramework(
  framework: RegulatoryFramework
): Promise<LegalBasis[]> {
  return prisma.legalBasis.findMany({
    where: {
      framework,
      isActive: true,
    },
    orderBy: { type: 'asc' },
  })
}
