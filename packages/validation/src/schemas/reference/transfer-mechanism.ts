import { z } from 'zod'

/**
 * Transfer Mechanism Category enum matching Prisma schema
 */
export const TransferMechanismCategorySchema = z.enum(
  ['ADEQUACY', 'SAFEGUARD', 'DEROGATION', 'NONE'],
  {
    message: 'Transfer mechanism category must be one of: ADEQUACY, SAFEGUARD, DEROGATION, NONE',
  }
)

/**
 * Validation schema for creating a TransferMechanism
 * Matches Prisma schema definition
 */
export const TransferMechanismCreateSchema = z.object({
  code: z.string().min(1, 'Transfer mechanism code is required'),
  name: z.string().min(1, 'Transfer mechanism name is required'),
  description: z.string().min(1, 'Description is required'),
  typicalUseCase: z.string().min(1, 'Typical use case is required'),
  gdprArticle: z.string().min(1, 'GDPR article reference is required'),
  category: TransferMechanismCategorySchema,
  isDerogation: z.boolean().default(false),
  requiresAdequacy: z.boolean().default(false),
  requiresDocumentation: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

/**
 * Validation schema for updating a TransferMechanism
 * All fields optional for partial updates
 *
 * IMPORTANT: Inline definition to avoid inheriting .default() from create schema
 */
export const TransferMechanismUpdateSchema = z.object({
  code: z.string().min(1, 'Transfer mechanism code is required').optional(),
  name: z.string().min(1, 'Transfer mechanism name is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  typicalUseCase: z.string().min(1, 'Typical use case is required').optional(),
  gdprArticle: z.string().min(1, 'GDPR article reference is required').optional(),
  category: TransferMechanismCategorySchema.optional(),
  isDerogation: z.boolean().optional(),
  requiresAdequacy: z.boolean().optional(),
  requiresDocumentation: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

/**
 * Inferred TypeScript types
 */
export type TransferMechanismCreate = z.infer<typeof TransferMechanismCreateSchema>
export type TransferMechanismUpdate = z.infer<typeof TransferMechanismUpdateSchema>
export type TransferMechanismCategory = z.infer<typeof TransferMechanismCategorySchema>
