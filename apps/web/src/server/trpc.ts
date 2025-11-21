import { TRPCError, initTRPC } from '@trpc/server'

import { type Context } from './context'

const t = initTRPC.context<Context>().create()

export const router = t.router

/**
 * Public procedure - no authentication required
 * Use for public endpoints like health checks or public data
 */
export const publicProcedure = t.procedure

/**
 * Protected procedure - requires authentication
 * Throws UNAUTHORIZED error if user is not authenticated
 * Use for authenticated endpoints that don't require organization context
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' })
  }

  return next({
    ctx: {
      ...ctx,
      session: {
        ...ctx.session,
        user: ctx.session.user,
      },
    },
  })
})

/**
 * Organization procedure - requires authentication and organization membership
 * Throws UNAUTHORIZED if not authenticated
 * Throws FORBIDDEN if user doesn't belong to an organization
 * Automatically includes organizationId in context for easy filtering
 * Use for most application endpoints that need multi-tenancy isolation
 */
export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session.user.organizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Organization membership required',
    })
  }

  return next({
    ctx: {
      ...ctx,
      organizationId: ctx.session.user.organizationId,
    },
  })
})
