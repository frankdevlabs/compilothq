import { z } from 'zod'

import { RecipientTypeEnum } from './create.schema'

/**
 * Validation schema for updating a Recipient
 * All fields optional for partial updates
 */
export const RecipientUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: RecipientTypeEnum.optional(),
  description: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  externalOrganizationId: z.string().uuid().optional().nullable(),
  parentRecipientId: z.string().uuid().optional().nullable(),
  hierarchyType: z.enum(['PROCESSOR_CHAIN', 'ORGANIZATIONAL', 'GROUPING']).optional().nullable(),
  isActive: z.boolean().optional(),
})

/**
 * Inferred TypeScript type for recipient update
 */
export type RecipientUpdate = z.infer<typeof RecipientUpdateSchema>
