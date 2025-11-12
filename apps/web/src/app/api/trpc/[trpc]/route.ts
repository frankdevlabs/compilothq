import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest } from 'next/server'

import { createContext } from '@/server/context'
import { appRouter } from '@/server/routers/_app'

const handler = async (req: Request) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => createContext({ req: req as NextRequest }),
  })
}

export { handler as GET, handler as POST }
