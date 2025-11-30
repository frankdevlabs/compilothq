import { z } from 'zod'

/**
 * Validation schema for creating an Activity
 * Matches Prisma schema definition for Activity model
 */
export const ActivityCreateSchema = z.object({
  name: z.string().min(1, 'Activity name is required'),
  description: z.string().optional().nullable(),
})

/**
 * Inferred TypeScript type for activity creation
 */
export type ActivityCreate = z.infer<typeof ActivityCreateSchema>
