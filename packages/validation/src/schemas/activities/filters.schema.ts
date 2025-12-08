import { z } from 'zod'

/**
 * Data processing activity status enum matching Prisma schema
 * Supports complete workflow: draft → review → approval → active → archived
 */
export const DataProcessingActivityStatusEnum = z.enum(
  [
    'DRAFT',
    'UNDER_REVIEW',
    'UNDER_REVISION',
    'REJECTED',
    'APPROVED',
    'ACTIVE',
    'SUSPENDED',
    'ARCHIVED',
  ],
  {
    message:
      'Status must be one of: DRAFT, UNDER_REVIEW, UNDER_REVISION, REJECTED, APPROVED, ACTIVE, SUSPENDED, ARCHIVED',
  }
)

/**
 * Risk level enum for data processing activities
 */
export const RiskLevelEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

/**
 * DPIA status enum for tracking Data Protection Impact Assessment
 */
export const DPIAStatusEnum = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'REQUIRES_REVISION',
  'APPROVED',
  'OUTDATED',
])

/**
 * Validation schema for filtering data processing activities in list queries
 * Supports pagination with cursor-based approach and advanced filtering
 */
export const DataProcessingActivityFiltersSchema = z.object({
  status: DataProcessingActivityStatusEnum.optional(),
  riskLevel: RiskLevelEnum.optional(),
  requiresDPIA: z.boolean().optional(),
  dpiaStatus: DPIAStatusEnum.optional(),
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().optional(),
})

/**
 * Inferred TypeScript type for data processing activity filters
 */
export type DataProcessingActivityFilters = z.infer<typeof DataProcessingActivityFiltersSchema>
