import { z } from 'zod'

import { ProcessorCreateSchema } from './create.schema'

/**
 * Validation schema for updating a Processor
 * All fields are optional to support partial updates
 */
export const ProcessorUpdateSchema = ProcessorCreateSchema.partial()

/**
 * Inferred TypeScript type for processor updates
 */
export type ProcessorUpdate = z.infer<typeof ProcessorUpdateSchema>
