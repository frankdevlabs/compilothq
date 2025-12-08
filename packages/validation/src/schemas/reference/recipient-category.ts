import { z } from 'zod'

/**
 * Validation schema for creating a RecipientCategory
 * Matches Prisma schema definition
 */
export const RecipientCategoryCreateSchema = z.object({
  code: z.string().min(1, 'Recipient category code is required'),
  name: z.string().min(1, 'Recipient category name is required'),
  examples: z.array(z.string()).min(1, 'At least one example is required').default([]),
  commonReasons: z.string().min(1, 'Common reasons are required'),
  requiresDPA: z.boolean().default(false),
  requiresImpactAssessment: z.boolean().default(false),
  defaultRole: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

/**
 * Validation schema for updating a RecipientCategory
 * All fields optional for partial updates
 *
 * IMPORTANT: Inline definition to avoid inheriting .default() from create schema
 */
export const RecipientCategoryUpdateSchema = z.object({
  code: z.string().min(1, 'Recipient category code is required').optional(),
  name: z.string().min(1, 'Recipient category name is required').optional(),
  examples: z.array(z.string()).min(1, 'At least one example is required').optional(),
  commonReasons: z.string().min(1, 'Common reasons are required').optional(),
  requiresDPA: z.boolean().optional(),
  requiresImpactAssessment: z.boolean().optional(),
  defaultRole: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

/**
 * Inferred TypeScript types
 */
export type RecipientCategoryCreate = z.infer<typeof RecipientCategoryCreateSchema>
export type RecipientCategoryUpdate = z.infer<typeof RecipientCategoryUpdateSchema>
