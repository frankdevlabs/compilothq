import {
  createDataProcessingActivity,
  deleteDataProcessingActivity,
  getDataProcessingActivityById,
  listDataProcessingActivitiesByOrganization,
  updateDataProcessingActivity,
} from '@compilothq/database'
import {
  DataProcessingActivityCreateSchema,
  DataProcessingActivityFiltersSchema,
} from '@compilothq/validation'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { orgProcedure, router } from '../trpc'
import { handlePrismaError } from '../utils/prisma-errors'

export const dataProcessingActivityRouter = router({
  /**
   * List all data processing activities for the current organization
   * Supports optional filtering by status, risk level, DPIA requirements, and pagination
   */
  list: orgProcedure
    .input(DataProcessingActivityFiltersSchema.omit({ cursor: true }).optional())
    .query(async ({ ctx, input }) => {
      return await listDataProcessingActivitiesByOrganization(ctx.organizationId, input)
    }),

  /**
   * Get a single data processing activity by ID
   * Verifies activity belongs to current organization
   */
  getById: orgProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const activity = await getDataProcessingActivityById(input.id)

    if (!activity) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Data processing activity not found',
      })
    }

    if (activity.organizationId !== ctx.organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Data processing activity does not belong to your organization',
      })
    }

    return activity
  }),

  /**
   * Create a new data processing activity
   * Activity is automatically scoped to the current organization
   */
  create: orgProcedure
    .input(DataProcessingActivityCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return await handlePrismaError(
        createDataProcessingActivity({
          name: input.name,
          description: input.description ?? undefined,
          status: input.status,
          riskLevel: input.riskLevel ?? undefined,
          requiresDPIA: input.requiresDPIA ?? undefined,
          businessOwnerId: input.businessOwnerId ?? undefined,
          processingOwnerId: input.processingOwnerId ?? undefined,
          dpiaStatus: input.dpiaStatus ?? undefined,
          organizationId: ctx.organizationId,
        })
      )
    }),

  /**
   * Update an existing data processing activity
   * Verifies activity belongs to current organization before update
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        status: z
          .enum([
            'DRAFT',
            'UNDER_REVIEW',
            'UNDER_REVISION',
            'REJECTED',
            'APPROVED',
            'ACTIVE',
            'SUSPENDED',
            'ARCHIVED',
          ])
          .optional(),
        riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().nullable(),
        requiresDPIA: z.boolean().optional().nullable(),
        businessOwnerId: z.string().uuid().optional().nullable(),
        processingOwnerId: z.string().uuid().optional().nullable(),
        dpiaStatus: z
          .enum([
            'NOT_STARTED',
            'IN_PROGRESS',
            'UNDER_REVIEW',
            'REQUIRES_REVISION',
            'APPROVED',
            'OUTDATED',
          ])
          .optional()
          .nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify activity belongs to this organization
      const activity = await getDataProcessingActivityById(input.id)

      if (!activity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Data processing activity not found',
        })
      }

      if (activity.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Data processing activity does not belong to your organization',
        })
      }

      // Extract only the update fields (not id)
      const { id, ...updateData } = input

      return await handlePrismaError(
        updateDataProcessingActivity(id, {
          name: updateData.name,
          description: updateData.description === null ? undefined : updateData.description,
          status: updateData.status,
          riskLevel: updateData.riskLevel === null ? undefined : updateData.riskLevel,
          requiresDPIA: updateData.requiresDPIA,
          businessOwnerId: updateData.businessOwnerId,
          processingOwnerId: updateData.processingOwnerId,
          dpiaStatus: updateData.dpiaStatus === null ? undefined : updateData.dpiaStatus,
        })
      )
    }),

  /**
   * Delete a data processing activity
   * Verifies activity belongs to current organization before deletion
   */
  delete: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // Verify activity belongs to this organization
    const activity = await getDataProcessingActivityById(input.id)

    if (!activity) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Data processing activity not found',
      })
    }

    if (activity.organizationId !== ctx.organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Data processing activity does not belong to your organization',
      })
    }

    return await handlePrismaError(deleteDataProcessingActivity(input.id))
  }),
})
