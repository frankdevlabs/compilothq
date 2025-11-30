import { cache } from 'react'

import { auth } from '@/lib/auth/config'
import { appRouter } from '@/server/routers/_app'

/**
 * Server-side tRPC caller for React Server Components
 *
 * This module provides a simplified way to call tRPC procedures directly from
 * server components without going through HTTP. It creates a context with the
 * current session from NextAuth.
 *
 * Note: This is a simpler alternative to the full tRPC caller pattern.
 * For production use, consider using the direct procedure call pattern
 * or importing DAL functions directly in server components.
 *
 * @example Direct DAL usage (recommended for RSC):
 * ```typescript
 * // In a server component (app/dashboard/page.tsx)
 * import { getUserById } from '@compilothq/database'
 * import { auth } from '@/lib/auth/config'
 *
 * export default async function DashboardPage() {
 *   const session = await auth()
 *   const user = await getUserById(session.user.id)
 *
 *   return <Dashboard user={user} />
 * }
 * ```
 *
 * @example tRPC procedure usage (for consistency with client):
 * ```typescript
 * // You can also call procedures directly via the router
 * import { appRouter } from '@/server/routers/_app'
 * import { auth } from '@/lib/auth/config'
 *
 * export default async function DashboardPage() {
 *   const session = await auth()
 *   const ctx = { session, req: undefined }
 *   const caller = appRouter.createCaller(ctx)
 *
 *   const user = await caller.user.getCurrent()
 *   return <Dashboard user={user} />
 * }
 * ```
 */

/**
 * Creates a tRPC context for server-side calls
 * Cached per request to avoid redundant session lookups
 */
const createContext = cache(async () => {
  const session = await auth()

  return {
    session,
    // Note: We don't have a NextRequest in RSC, so req is undefined
    // The context type allows it to be optional for server-side calls
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    req: undefined as any, // Type assertion needed for server-side context
  }
})

/**
 * Get a server-side tRPC caller with the current session context
 *
 * This function creates a tRPC caller that can be used to call procedures
 * directly from server components. The caller is cached per request.
 *
 * @returns A tRPC caller instance with type-safe procedure access
 *
 * @example
 * ```typescript
 * import { getServerCaller } from '@/lib/trpc/server'
 *
 * export default async function Page() {
 *   const api = await getServerCaller()
 *   const user = await api.user.getCurrent()
 *   return <div>{user.name}</div>
 * }
 * ```
 */
export const getServerCaller = cache(async () => {
  const ctx = await createContext()
  return appRouter.createCaller(ctx)
})

/**
 * Server-side API object that auto-resolves the caller
 *
 * This provides a convenience wrapper that automatically gets the caller
 * for each request, matching the client-side usage pattern.
 *
 * Usage: `await api.router.procedure(input)`
 */
export const api = new Proxy(
  {},
  {
    get(_target, router: string) {
      return new Proxy(
        {},
        {
          get(_routerTarget, procedure: string) {
            return async (...args: unknown[]) => {
              const caller = await getServerCaller()
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, security/detect-object-injection
              const routerObj = (caller as any)[router]
              if (!routerObj) {
                throw new Error(`Router "${router}" not found`)
              }
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, security/detect-object-injection
              const proc = routerObj[procedure]
              if (typeof proc !== 'function') {
                throw new Error(`Procedure "${router}.${procedure}" not found`)
              }
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
              return proc(...args)
            }
          },
        }
      )
    },
  }
) as Awaited<ReturnType<typeof getServerCaller>>
