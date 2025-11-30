import { z } from 'zod'

import { ActivityCreateSchema } from './create.schema'

/**
 * Validation schema for updating an Activity
 * All fields are optional to support partial updates
 */
export const ActivityUpdateSchema = ActivityCreateSchema.partial()

/**
 * Inferred TypeScript type for activity updates
 */
export type ActivityUpdate = z.infer<typeof ActivityUpdateSchema>
