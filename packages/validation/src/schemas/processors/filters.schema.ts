import { z } from 'zod'

import { ProcessorTypeEnum } from './create.schema'

/**
 * Validation schema for filtering processors in list queries
 * Supports pagination with cursor-based approach
 */
export const ProcessorFiltersSchema = z.object({
  type: ProcessorTypeEnum.optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().optional(),
})

/**
 * Inferred TypeScript type for processor filters
 */
export type ProcessorFilters = z.infer<typeof ProcessorFiltersSchema>
