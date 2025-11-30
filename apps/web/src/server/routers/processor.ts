import {
  createProcessor as createProcessorDAL,
  deleteProcessor as deleteProcessorDAL,
  getProcessorById,
  listProcessorsByOrganization,
  updateProcessor as updateProcessorDAL,
} from '@compilothq/database'
import { ProcessorCreateSchema, ProcessorFiltersSchema } from '@compilothq/validation'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { orgProcedure, router } from '../trpc'
import { handlePrismaError } from '../utils/prisma-errors'

export const processorRouter = router({
  /**
   * List all processors for the current organization
   * Supports cursor-based pagination and filtering by type and isActive status
   */
  list: orgProcedure.input(ProcessorFiltersSchema.optional()).query(async ({ ctx, input }) => {
    return await listProcessorsByOrganization(ctx.organizationId, input)
  }),

  /**
   * Get a single processor by ID
   * Verifies processor belongs to current organization
   */
  getById: orgProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const processor = await getProcessorById(input.id)

    if (!processor) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Processor not found',
      })
    }

    if (processor.organizationId !== ctx.organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Processor does not belong to your organization',
      })
    }

    return processor
  }),

  /**
   * Create a new processor
   * Processor is automatically scoped to the current organization
   */
  create: orgProcedure.input(ProcessorCreateSchema).mutation(async ({ ctx, input }) => {
    return await handlePrismaError(
      createProcessorDAL({
        name: input.name,
        type: input.type,
        description: input.description ?? null,
        organizationId: ctx.organizationId,
        isActive: input.isActive,
      })
    )
  }),

  /**
   * Update an existing processor
   * Verifies processor belongs to current organization before update
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        type: z
          .enum(['DATA_PROCESSOR', 'SUB_PROCESSOR', 'JOINT_CONTROLLER', 'SERVICE_PROVIDER'])
          .optional(),
        description: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify processor belongs to this organization
      const processor = await getProcessorById(input.id)

      if (!processor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Processor not found',
        })
      }

      if (processor.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Processor does not belong to your organization',
        })
      }

      // Extract only the update fields (not id)
      const { id, ...updateData } = input

      return await handlePrismaError(updateProcessorDAL(id, updateData))
    }),

  /**
   * Delete a processor
   * Verifies processor belongs to current organization before deletion
   */
  delete: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // Verify processor belongs to this organization
    const processor = await getProcessorById(input.id)

    if (!processor) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Processor not found',
      })
    }

    if (processor.organizationId !== ctx.organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Processor does not belong to your organization',
      })
    }

    return await handlePrismaError(deleteProcessorDAL(input.id))
  }),
})
