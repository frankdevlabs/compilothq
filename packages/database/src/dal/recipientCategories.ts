import type { RecipientCategory } from '../index'
import { prisma } from '../index'

/**
 * List all recipient categories ordered by name
 */
export async function listRecipientCategories(): Promise<RecipientCategory[]> {
  return prisma.recipientCategory.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

/**
 * Get a recipient category by its ID
 */
export async function getRecipientCategoryById(id: string): Promise<RecipientCategory | null> {
  return prisma.recipientCategory.findUnique({
    where: { id },
  })
}

/**
 * Get a recipient category by its code
 */
export async function getRecipientCategoryByCode(code: string): Promise<RecipientCategory | null> {
  return prisma.recipientCategory.findUnique({
    where: { code },
  })
}
