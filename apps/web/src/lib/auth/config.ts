import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@compilothq/database'
import { config } from '@compilothq/validation'
import type { NextAuthConfig } from 'next-auth'
import NextAuth from 'next-auth'
import type { Adapter, AdapterUser } from 'next-auth/adapters'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'

import { sendMagicLink } from '../email/send'

/**
 * Custom Prisma Adapter that ensures 'name' field is always provided
 * For email magic links: generates name from email prefix (e.g., "john.doe" from "john.doe@example.com")
 * For OAuth: uses the name from the provider profile
 */
function createCustomPrismaAdapter(p: typeof prisma): Adapter {
  const baseAdapter = PrismaAdapter(p)

  return {
    ...baseAdapter,
    createUser: async (data: Omit<AdapterUser, 'id'>) => {
      // Generate name from email if not provided (email magic link flow)
      // Keep OAuth-provided names unchanged
      const name = data.name ?? data.email.split('@')[0]

      const user = await p.user.create({
        data: {
          email: data.email,
          name,
          emailVerified: data.emailVerified ?? null,
          image: data.image ?? null,
        },
      })

      return user as AdapterUser
    },
  }
}

/**
 * NextAuth.js v5 Configuration
 * Uses database sessions via Prisma adapter for better security and audit trail
 */
export const authConfig = {
  adapter: createCustomPrismaAdapter(prisma),
  providers: [
    // Email Magic Link Provider (Primary)
    Resend({
      apiKey: config.auth.email.resendApiKey,
      from: 'Compilo <auth@mrfrank.dev>',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        console.log('[Auth] sendVerificationRequest called for:', email)
        console.log('[Auth] Magic link URL:', url)
        console.log('[Auth] API key present:', !!config.auth.email.resendApiKey)

        try {
          // Use custom email template via our email service
          await sendMagicLink(email, url)
          console.log('[Auth] Magic link sent successfully')
        } catch (error) {
          console.error('[Auth] Failed to send magic link:', error)
          throw error // Re-throw to propagate to signIn()
        }
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

  // Cookie configuration handled by NextAuth defaults
  // Uses 'authjs.session-token' in dev, '__Secure-authjs.session-token' in prod

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
    signIn() {
      // For now, allow all sign-ins
      // Future: Add additional validation here (e.g., domain restrictions)
      return true
    },

    /**
     * session callback
     * Adds organizationId and primaryPersona to session
     * This data is available to all authenticated requests
     * Note: organizationId may be null for users who haven't completed onboarding
     */
    async session({ session, user }) {
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
        session.user.organizationId = fullUser.organizationId ?? null
        session.user.primaryPersona = fullUser.primaryPersona
        session.user.organization = fullUser.organization ?? null
      }

      return session
    },
  },

  // Enable debug logs in development
  debug: process.env['NODE_ENV'] === 'development',
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
