import { type NextRequest } from 'next/server'

import { auth } from '@/lib/auth/config'

/**
 * Create tRPC context with NextAuth session
 * This context is available to all tRPC procedures
 */
export const createContext = async (opts: { req: NextRequest }) => {
  // Get session from NextAuth
  const session = await auth()

  return {
    req: opts.req,
    session,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
