import {
  createOrganizationWithOwner,
  generateSlugFromName,
  updateUserOrganization,
} from '@compilothq/database'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const organizationRouter = router({
  /**
   * Create a new organization
   * Used during signup flow for new users without an organization
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, 'Organization name must be at least 2 characters'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already has an organization
      if (ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User already belongs to an organization',
        })
      }

      // Create organization
      const organization = await createOrganizationWithOwner(input.name, ctx.session.user.id)

      // Update user with organization and DPO persona
      await updateUserOrganization(ctx.session.user.id, organization.id, 'DPO')

      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      }
    }),

  /**
   * Generate slug preview from organization name
   * Useful for showing preview before creation
   */
  generateSlug: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .query(({ input }) => {
      return {
        slug: generateSlugFromName(input.name),
      }
    }),
})
