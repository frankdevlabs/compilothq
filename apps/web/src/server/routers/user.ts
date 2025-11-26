import { listUsersByOrganization } from '@compilothq/database'

import { orgProcedure, router } from '../trpc'

/**
 * User Router
 *
 * Provides procedures for user management within an organization.
 * All procedures use orgProcedure for automatic organization filtering.
 */
export const userRouter = router({
  /**
   * List all users in the current user's organization
   *
   * Security: Automatically filtered by organizationId via orgProcedure
   * Returns: Array of users with their details (name, email, persona, etc.)
   */
  listByOrganization: orgProcedure.query(async ({ ctx }) => {
    const users = await listUsersByOrganization(ctx.session.user.organizationId)
    return users
  }),
})
