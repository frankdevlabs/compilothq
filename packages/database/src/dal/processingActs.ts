import type { ProcessingAct } from '../index'
import { prisma } from '../index'

/**
 * List all processing acts ordered by name
 */
export async function listProcessingActs(): Promise<ProcessingAct[]> {
  return prisma.processingAct.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

/**
 * Get a processing act by its ID
 */
export async function getProcessingActById(id: string): Promise<ProcessingAct | null> {
  return prisma.processingAct.findUnique({
    where: { id },
  })
}

/**
 * Get a processing act by its name
 */
export async function getProcessingActByName(name: string): Promise<ProcessingAct | null> {
  return prisma.processingAct.findFirst({
    where: { name, isActive: true },
  })
}
