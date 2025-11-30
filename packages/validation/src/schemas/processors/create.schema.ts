import { z } from 'zod'

/**
 * Processor type enum matching Prisma schema
 */
export const ProcessorTypeEnum = z.enum(
  ['DATA_PROCESSOR', 'SUB_PROCESSOR', 'JOINT_CONTROLLER', 'SERVICE_PROVIDER'],
  {
    errorMap: () => ({
      message:
        'Type must be one of: DATA_PROCESSOR, SUB_PROCESSOR, JOINT_CONTROLLER, SERVICE_PROVIDER',
    }),
  }
)

/**
 * Validation schema for creating a Processor
 * Matches Prisma schema definition for Processor model
 */
export const ProcessorCreateSchema = z.object({
  name: z.string().min(1, 'Processor name is required'),
  type: ProcessorTypeEnum,
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

/**
 * Inferred TypeScript type for processor creation
 */
export type ProcessorCreate = z.infer<typeof ProcessorCreateSchema>
