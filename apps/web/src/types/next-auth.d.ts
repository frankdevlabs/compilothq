import type { UserPersona } from '@compilothq/database'
import type { DefaultSession } from 'next-auth'

/**
 * Module augmentation for next-auth types
 * Uses UserPersona from @compilothq/database (Prisma-generated enum) as single source of truth.
 * Turborepo build order ensures database package builds before web package.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      organizationId: string | null
      primaryPersona: UserPersona
      organization?: {
        id: string
        name: string
        slug: string
      } | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    organizationId: string | null
    primaryPersona: UserPersona
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    organizationId?: string | null
    primaryPersona?: UserPersona
  }
}
