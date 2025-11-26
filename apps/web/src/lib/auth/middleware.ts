import { config } from '@compilothq/validation'
import type { NextAuthConfig } from 'next-auth'
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'

/**
 * Edge-compatible NextAuth.js configuration for middleware
 * This configuration excludes server-only code (Prisma adapter, email sending)
 * to be compatible with Edge Runtime.
 *
 * For full server-side auth configuration, see ./config.ts
 */
const authEdgeConfig = {
  providers: [
    // Provider configurations are needed for NextAuth to recognize the auth methods
    // but the actual logic (adapter, callbacks) is handled server-side
    Resend({
      apiKey: config.auth.email.resendApiKey,
      from: 'Compilo <auth@compilo.app>',
    }),
    Google({
      clientId: config.auth.google.clientId ?? '',
      clientSecret: config.auth.google.clientSecret ?? '',
    }),
  ],

  // Use database sessions (not JWT)
  session: {
    strategy: 'database',
  },

  // Cookie configuration handled by NextAuth defaults
  // Uses 'authjs.session-token' in dev, '__Secure-authjs.session-token' in prod

  pages: {
    signIn: '/login',
    verifyRequest: '/verify-request',
    error: '/error',
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      }

      return true
    },
  },
} satisfies NextAuthConfig

export const { auth } = NextAuth(authEdgeConfig)
