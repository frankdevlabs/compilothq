import { z } from 'zod'

/**
 * Recipient type enum matching Prisma RecipientType
 * Initially exposes 4 core types for backward compatibility with ProcessorType
 * Future: Expand to all 7 types (SEPARATE_CONTROLLER, PUBLIC_AUTHORITY, INTERNAL_DEPARTMENT)
 */
export const RecipientTypeEnum = z.enum(
  ['PROCESSOR', 'SUB_PROCESSOR', 'JOINT_CONTROLLER', 'SERVICE_PROVIDER'],
  {
    message: 'Type must be one of: PROCESSOR, SUB_PROCESSOR, JOINT_CONTROLLER, SERVICE_PROVIDER',
  }
)

/**
 * Validation schema for creating a Recipient
 * Matches Recipient model in @compilothq/database
 */
export const RecipientCreateSchema = z.object({
  name: z.string().min(1, 'Recipient name is required'),
  type: RecipientTypeEnum,
  description: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  externalOrganizationId: z.string().uuid().optional().nullable(),
  parentRecipientId: z.string().uuid().optional().nullable(),
  hierarchyType: z.enum(['PROCESSOR_CHAIN', 'ORGANIZATIONAL', 'GROUPING']).optional().nullable(),
  isActive: z.boolean().default(true),
})

/**
 * Inferred TypeScript type for recipient creation
 */
export type RecipientCreate = z.infer<typeof RecipientCreateSchema>
