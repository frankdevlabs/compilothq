import { z } from 'zod'

/**
 * Data Nature Type enum matching Prisma schema
 */
export const DataNatureTypeSchema = z.enum(['SPECIAL', 'NON_SPECIAL'], {
  message: 'Data nature type must be either SPECIAL or NON_SPECIAL',
})

/**
 * Validation schema for creating a DataNature
 * Matches Prisma schema definition
 */
export const DataNatureCreateSchema = z.object({
  name: z.string().min(1, 'Data nature name is required'),
  description: z.string().min(1, 'Description is required'),
  type: DataNatureTypeSchema,
  gdprArticle: z.string().min(1, 'GDPR article reference is required'),
  isActive: z.boolean().default(true),
})

/**
 * Validation schema for updating a DataNature
 * All fields optional for partial updates
 *
 * IMPORTANT: Inline definition to avoid inheriting .default() from create schema
 */
export const DataNatureUpdateSchema = z.object({
  name: z.string().min(1, 'Data nature name is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  type: DataNatureTypeSchema.optional(),
  gdprArticle: z.string().min(1, 'GDPR article reference is required').optional(),
  isActive: z.boolean().optional(),
})

/**
 * Inferred TypeScript types
 */
export type DataNatureCreate = z.infer<typeof DataNatureCreateSchema>
export type DataNatureUpdate = z.infer<typeof DataNatureUpdateSchema>
export type DataNatureType = z.infer<typeof DataNatureTypeSchema>
