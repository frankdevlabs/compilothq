import { z } from 'zod'

import { DataProcessingActivityStatusEnum, DPIAStatusEnum, RiskLevelEnum } from './filters.schema'

/**
 * Validation schema for updating a Data Processing Activity
 * All fields optional for partial updates
 *
 * IMPORTANT: Inline definition to avoid inheriting .default() from create schema
 */
export const DataProcessingActivityUpdateSchema = z.object({
  name: z.string().min(1, 'Data processing activity name is required').optional(),
  description: z.string().optional().nullable(),
  status: DataProcessingActivityStatusEnum.optional(),
  riskLevel: RiskLevelEnum.optional().nullable(),
  requiresDPIA: z.boolean().optional().nullable(),
  businessOwnerId: z.string().uuid().optional().nullable(),
  processingOwnerId: z.string().uuid().optional().nullable(),
  dpiaStatus: DPIAStatusEnum.optional().nullable(),
})

/**
 * Inferred TypeScript type for data processing activity updates
 */
export type DataProcessingActivityUpdate = z.infer<typeof DataProcessingActivityUpdateSchema>
