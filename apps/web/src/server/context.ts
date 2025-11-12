import { type NextRequest } from 'next/server'

// Note: Async is intentional for future session/database integration
// eslint-disable-next-line @typescript-eslint/require-await
export const createContext = async (opts: { req: NextRequest }) => {
  return {
    req: opts.req,
    // Future: Add session, database client
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
