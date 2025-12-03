import {
  createRecipient,
  deleteRecipient,
  getRecipientByIdForOrg,
  listRecipientsByOrganization,
  updateRecipient,
} from '@compilothq/database'
import { RecipientCreateSchema, RecipientFiltersSchema } from '@compilothq/validation'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { orgProcedure, router } from '../trpc'
import { handlePrismaError } from '../utils/prisma-errors'

export const processorRouter = router({
  /**
   * List all processors for the current organization
   * Supports cursor-based pagination and filtering by type and isActive status
   */
  list: orgProcedure.input(RecipientFiltersSchema.optional()).query(async ({ ctx, input }) => {
    return await listRecipientsByOrganization(ctx.organizationId, input)
  }),

  /**
   * Get a single processor by ID
   * Verifies processor belongs to current organization
   */
  getById: orgProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const recipient = await getRecipientByIdForOrg(input.id, ctx.organizationId)

    if (!recipient) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Processor not found',
      })
    }

    return recipient
  }),

  /**
   * Create a new processor
   * Processor is automatically scoped to the current organization
   */
  create: orgProcedure.input(RecipientCreateSchema).mutation(async ({ ctx, input }) => {
    return await handlePrismaError(
      createRecipient({
        name: input.name,
        type: input.type,
        description: input.description ?? undefined,
        purpose: input.purpose ?? undefined,
        externalOrganizationId: input.externalOrganizationId ?? undefined,
        parentRecipientId: input.parentRecipientId ?? undefined,
        hierarchyType: input.hierarchyType ?? undefined,
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
          .enum(['PROCESSOR', 'SUB_PROCESSOR', 'JOINT_CONTROLLER', 'SERVICE_PROVIDER'])
          .optional(),
        description: z.string().optional().nullable(),
        purpose: z.string().optional().nullable(),
        externalOrganizationId: z.string().uuid().optional().nullable(),
        parentRecipientId: z.string().uuid().optional().nullable(),
        hierarchyType: z
          .enum(['PROCESSOR_CHAIN', 'ORGANIZATIONAL', 'GROUPING'])
          .optional()
          .nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify recipient belongs to this organization
      const recipient = await getRecipientByIdForOrg(input.id, ctx.organizationId)

      if (!recipient) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Processor not found',
        })
      }

      // Extract only the update fields (not id)
      const { id, ...updateData } = input

      return await handlePrismaError(
        updateRecipient(id, {
          ...updateData,
          description: updateData.description ?? undefined,
          purpose: updateData.purpose ?? undefined,
          externalOrganizationId: updateData.externalOrganizationId ?? undefined,
          parentRecipientId: updateData.parentRecipientId ?? undefined,
          hierarchyType: updateData.hierarchyType ?? undefined,
        })
      )
    }),

  /**
   * Delete a processor
   * Verifies processor belongs to current organization before deletion
   */
  delete: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // Verify recipient belongs to this organization
    const recipient = await getRecipientByIdForOrg(input.id, ctx.organizationId)

    if (!recipient) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Processor not found',
      })
    }

    return await handlePrismaError(deleteRecipient(input.id))
  }),
})
