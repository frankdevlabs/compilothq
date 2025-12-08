import { z } from 'zod'

import { ProcessorTypeEnum } from './create.schema'

/**
 * Validation schema for updating a Processor
 * All fields optional for partial updates
 *
 * IMPORTANT: Inline definition to avoid inheriting .default() from create schema
 */
export const ProcessorUpdateSchema = z.object({
  name: z.string().min(1, 'Processor name is required').optional(),
  type: ProcessorTypeEnum.optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

/**
 * Inferred TypeScript type for processor updates
 */
export type ProcessorUpdate = z.infer<typeof ProcessorUpdateSchema>
