import { z } from 'zod'

/**
 * Activity status enum matching Prisma schema
 */
export const ActivityStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'], {
  errorMap: () => ({
    message: 'Status must be one of: DRAFT, ACTIVE, ARCHIVED',
  }),
})

/**
 * Validation schema for filtering activities in list queries
 * Supports pagination with cursor-based approach
 */
export const ActivityFiltersSchema = z.object({
  status: ActivityStatusEnum.optional(),
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().optional(),
})

/**
 * Inferred TypeScript type for activity filters
 */
export type ActivityFilters = z.infer<typeof ActivityFiltersSchema>
