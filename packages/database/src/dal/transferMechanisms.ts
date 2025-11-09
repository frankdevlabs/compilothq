import { prisma } from '../index'
import type { TransferMechanism, TransferMechanismCategory } from '.prisma/client'

/**
 * List all transfer mechanisms ordered by name
 */
export async function listTransferMechanisms(): Promise<TransferMechanism[]> {
  return prisma.transferMechanism.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

/**
 * Get a transfer mechanism by its ID
 */
export async function getTransferMechanismById(id: string): Promise<TransferMechanism | null> {
  return prisma.transferMechanism.findUnique({
    where: { id },
  })
}

/**
 * Get a transfer mechanism by its code
 */
export async function getTransferMechanismByCode(code: string): Promise<TransferMechanism | null> {
  return prisma.transferMechanism.findUnique({
    where: { code },
  })
}

/**
 * Get transfer mechanisms by category
 */
export async function getTransferMechanismsByCategory(
  category: TransferMechanismCategory
): Promise<TransferMechanism[]> {
  return prisma.transferMechanism.findMany({
    where: {
      category,
      isActive: true,
    },
    orderBy: { name: 'asc' },
  })
}
