import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@compilothq/database'
import { config } from '@compilothq/validation'
import type { NextAuthConfig } from 'next-auth'
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'

import { sendMagicLink } from '../email/send'

/**
 * NextAuth.js v5 Configuration
 * Uses database sessions via Prisma adapter for better security and audit trail
 */
export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email Magic Link Provider (Primary)
    Resend({
      apiKey: config.auth.email.resendApiKey,
      from: 'Compilo <auth@compilo.app>',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        // Use custom email template via our email service
        await sendMagicLink(email, url)
      },
    }),

    // Google OAuth Provider (Secondary/Convenience)
    Google({
      clientId: config.auth.google.clientId ?? '',
      clientSecret: config.auth.google.clientSecret ?? '',
      allowDangerousEmailAccountLinking: true, // Allow linking email and OAuth accounts
    }),
  ],

  // Use database sessions (not JWT) for revocability and audit trail
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // Cookie configuration for security
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env['NODE_ENV'] === 'production',
      },
    },
  },

  pages: {
    signIn: '/login',
    verifyRequest: '/verify-request',
    error: '/error',
  },

  callbacks: {
    /**
     * signIn callback
     * Controls whether a user is allowed to sign in
     */
    async signIn() {
      // For now, allow all sign-ins
      // Future: Add additional validation here (e.g., domain restrictions)
      return true
    },

    /**
     * session callback
     * Adds organizationId and primaryPersona to session
     * This data is available to all authenticated requests
     */
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id

        // Fetch full user data with organization
        const fullUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        })

        if (fullUser) {
          session.user.organizationId = fullUser.organizationId
          session.user.primaryPersona = fullUser.primaryPersona
          session.user.organization = fullUser.organization
        }
      }

      return session
    },
  },

  // Enable debug logs in development
  debug: process.env['NODE_ENV'] === 'development',
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
