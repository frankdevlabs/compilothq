import { auth } from './config'

/**
 * Get the current session in Server Components and Server Actions
 * This is the primary way to access session data on the server
 * @returns Session object or null if not authenticated
 */
export async function getServerSession() {
  return await auth()
}

/**
 * Require authentication in Server Components and Server Actions
 * Throws an error if user is not authenticated
 * @returns Session object (guaranteed to exist)
 * @throws Error if not authenticated
 */
export async function requireAuth() {
  const session = await auth()

  if (!session || !session.user) {
    throw new Error('Authentication required')
  }

  return session
}

/**
 * Require authentication AND organization membership
 * Throws an error if user is not authenticated or doesn't belong to an organization
 * @returns Session object with organization data (guaranteed to exist)
 * @throws Error if not authenticated or no organization
 */
export async function requireAuthWithOrg() {
  const session = await requireAuth()

  if (!session.user.organizationId) {
    throw new Error('Organization membership required')
  }

  return session as typeof session & {
    user: {
      organizationId: string
      primaryPersona: string
    }
  }
}

/**
 * Get user ID from session
 * Useful shorthand for common operations
 */
export async function getUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

/**
 * Get organization ID from session
 * Useful shorthand for common operations
 */
export async function getOrganizationId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.organizationId ?? null
}
