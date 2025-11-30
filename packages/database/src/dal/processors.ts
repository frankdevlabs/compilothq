import type { Processor, ProcessorType } from '../index'
import { prisma } from '../index'

/**
 * Create a new processor
 * SECURITY: Processor is automatically scoped to the provided organizationId
 */
export async function createProcessor(data: {
  name: string
  type: ProcessorType
  description?: string
  organizationId: string
  isActive?: boolean
}): Promise<Processor> {
  return await prisma.processor.create({
    data: {
      name: data.name,
      type: data.type,
      description: data.description,
      organizationId: data.organizationId,
      isActive: data.isActive ?? true,
    },
  })
}

/**
 * Get a processor by ID
 * Returns null if processor doesn't exist
 */
export async function getProcessorById(id: string): Promise<Processor | null> {
  return await prisma.processor.findUnique({
    where: { id },
  })
}

/**
 * List processors by organization with cursor-based pagination
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 */
export async function listProcessorsByOrganization(
  organizationId: string,
  options?: {
    type?: ProcessorType
    isActive?: boolean
    limit?: number
    cursor?: string
  }
): Promise<{
  items: Processor[]
  nextCursor: string | null
}> {
  const limit = options?.limit ?? 50

  const processors = await prisma.processor.findMany({
    where: {
      organizationId,
      ...(options?.type ? { type: options.type } : {}),
      ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1, // Fetch one extra to determine if there are more
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  })

  // Check if there are more items
  const hasMore = processors.length > limit
  const items = hasMore ? processors.slice(0, limit) : processors
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null

  return {
    items,
    nextCursor,
  }
}

/**
 * Update a processor
 * SECURITY: Caller must verify processor belongs to their organization before calling
 */
export async function updateProcessor(
  id: string,
  data: {
    name?: string
    type?: ProcessorType
    description?: string
    isActive?: boolean
  }
): Promise<Processor> {
  return await prisma.processor.update({
    where: { id },
    data,
  })
}

/**
 * Delete a processor
 * SECURITY: Caller must verify processor belongs to their organization before calling
 */
export async function deleteProcessor(id: string): Promise<Processor> {
  return await prisma.processor.delete({
    where: { id },
  })
}
