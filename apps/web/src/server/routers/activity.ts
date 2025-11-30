import {
  createActivity as createActivityDAL,
  deleteActivity as deleteActivityDAL,
  getActivityById,
  listActivitiesByOrganization,
  updateActivity as updateActivityDAL,
} from '@compilothq/database'
import { ActivityCreateSchema, ActivityFiltersSchema } from '@compilothq/validation'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { orgProcedure, router } from '../trpc'
import { handlePrismaError } from '../utils/prisma-errors'

export const activityRouter = router({
  /**
   * List all activities for the current organization
   * Supports optional filtering by status and pagination
   */
  list: orgProcedure
    .input(ActivityFiltersSchema.omit({ cursor: true }).optional())
    .query(async ({ ctx, input }) => {
      return await listActivitiesByOrganization(ctx.organizationId, input)
    }),

  /**
   * Get a single activity by ID
   * Verifies activity belongs to current organization
   */
  getById: orgProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const activity = await getActivityById(input.id)

    if (!activity) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Activity not found',
      })
    }

    if (activity.organizationId !== ctx.organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Activity does not belong to your organization',
      })
    }

    return activity
  }),

  /**
   * Create a new activity
   * Activity is automatically scoped to the current organization
   */
  create: orgProcedure.input(ActivityCreateSchema).mutation(async ({ ctx, input }) => {
    return await handlePrismaError(
      createActivityDAL({
        name: input.name,
        description: input.description ?? null,
        organizationId: ctx.organizationId,
      })
    )
  }),

  /**
   * Update an existing activity
   * Verifies activity belongs to current organization before update
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify activity belongs to this organization
      const activity = await getActivityById(input.id)

      if (!activity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Activity not found',
        })
      }

      if (activity.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Activity does not belong to your organization',
        })
      }

      // Extract only the update fields (not id)
      const { id, ...updateData } = input

      return await handlePrismaError(updateActivityDAL(id, updateData))
    }),

  /**
   * Delete an activity
   * Verifies activity belongs to current organization before deletion
   */
  delete: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // Verify activity belongs to this organization
    const activity = await getActivityById(input.id)

    if (!activity) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Activity not found',
      })
    }

    if (activity.organizationId !== ctx.organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Activity does not belong to your organization',
      })
    }

    return await handlePrismaError(deleteActivityDAL(input.id))
  }),
})
