import { z } from 'zod'

/**
 * Validation schema for creating a ProcessingAct
 * Matches Prisma schema definition
 */
export const ProcessingActCreateSchema = z.object({
  name: z.string().min(1, 'Processing act name is required'),
  description: z.string().min(1, 'Description is required'),
  examples: z.array(z.string()).min(1, 'At least one example is required').default([]),
  requiresDPA: z.boolean().default(false),
  triggersDPIA: z.boolean().default(false),
  gdprArticle: z.string().min(1, 'GDPR article reference is required'),
  isActive: z.boolean().default(true),
})

/**
 * Validation schema for updating a ProcessingAct
 */
export const ProcessingActUpdateSchema = ProcessingActCreateSchema.partial()

/**
 * Inferred TypeScript types
 */
export type ProcessingActCreate = z.infer<typeof ProcessingActCreateSchema>
export type ProcessingActUpdate = z.infer<typeof ProcessingActUpdateSchema>
