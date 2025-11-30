import { z } from 'zod'

import { DataProcessingActivityStatusEnum, DPIAStatusEnum, RiskLevelEnum } from './filters.schema'

/**
 * Validation schema for creating a Data Processing Activity
 * Matches Prisma schema definition for DataProcessingActivity model
 */
export const DataProcessingActivityCreateSchema = z.object({
  name: z.string().min(1, 'Data processing activity name is required'),
  description: z.string().optional().nullable(),
  status: DataProcessingActivityStatusEnum.optional().default('DRAFT'),
  riskLevel: RiskLevelEnum.optional().nullable(),
  requiresDPIA: z.boolean().optional().nullable(),
  businessOwnerId: z.string().uuid().optional().nullable(),
  processingOwnerId: z.string().uuid().optional().nullable(),
  dpiaStatus: DPIAStatusEnum.optional().nullable(),
})

/**
 * Inferred TypeScript type for data processing activity creation
 */
export type DataProcessingActivityCreate = z.infer<typeof DataProcessingActivityCreateSchema>
