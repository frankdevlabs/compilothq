import { z } from 'zod'

import { DataProcessingActivityCreateSchema } from './create.schema'

/**
 * Validation schema for updating a Data Processing Activity
 * All fields are optional to support partial updates
 */
export const DataProcessingActivityUpdateSchema = DataProcessingActivityCreateSchema.partial()

/**
 * Inferred TypeScript type for data processing activity updates
 */
export type DataProcessingActivityUpdate = z.infer<typeof DataProcessingActivityUpdateSchema>
