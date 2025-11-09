import { prisma } from '../index'
import type { DataNature, DataNatureType } from '.prisma/client'

/**
 * List all data natures ordered by name
 */
export async function listDataNatures(): Promise<DataNature[]> {
  return prisma.dataNature.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

/**
 * Get a data nature by its ID
 */
export async function getDataNatureById(id: string): Promise<DataNature | null> {
  return prisma.dataNature.findUnique({
    where: { id },
  })
}

/**
 * Get a data nature by its name
 */
export async function getDataNatureByName(name: string): Promise<DataNature | null> {
  return prisma.dataNature.findFirst({
    where: { name, isActive: true },
  })
}

/**
 * Get data natures by type (SPECIAL or NON_SPECIAL)
 */
export async function getDataNaturesByType(type: DataNatureType): Promise<DataNature[]> {
  return prisma.dataNature.findMany({
    where: {
      type,
      isActive: true,
    },
    orderBy: { name: 'asc' },
  })
}
