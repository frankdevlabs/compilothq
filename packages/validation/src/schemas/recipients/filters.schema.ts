import { z } from 'zod'

import { RecipientTypeEnum } from './create.schema'

/**
 * Validation schema for filtering recipients in list queries
 * Supports cursor-based pagination
 */
export const RecipientFiltersSchema = z.object({
  type: RecipientTypeEnum.optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().optional(),
})

/**
 * Inferred TypeScript type for recipient filters
 */
export type RecipientFilters = z.infer<typeof RecipientFiltersSchema>
