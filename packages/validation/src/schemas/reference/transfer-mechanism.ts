import { z } from 'zod'

/**
 * Transfer Mechanism Category enum matching Prisma schema
 */
export const TransferMechanismCategorySchema = z.enum(
  ['ADEQUACY', 'SAFEGUARD', 'DEROGATION', 'NONE'],
  {
    errorMap: () => ({
      message: 'Transfer mechanism category must be one of: ADEQUACY, SAFEGUARD, DEROGATION, NONE',
    }),
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
 */
export const TransferMechanismUpdateSchema = TransferMechanismCreateSchema.partial()

/**
 * Inferred TypeScript types
 */
export type TransferMechanismCreate = z.infer<typeof TransferMechanismCreateSchema>
export type TransferMechanismUpdate = z.infer<typeof TransferMechanismUpdateSchema>
export type TransferMechanismCategory = z.infer<typeof TransferMechanismCategorySchema>
