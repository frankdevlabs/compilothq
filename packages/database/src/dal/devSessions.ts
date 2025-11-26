import { randomBytes } from 'crypto'

import type { Session, UserPersona } from '../index'
import { prisma } from '../index'

/**
 * Generate a cryptographically secure session token
 * Matches NextAuth.js session token format (32-byte hex = 64 characters)
 */
function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Create a development session for a given persona
 *
 * SECURITY: Only works in development/test environments
 * Throws error in production
 *
 * @param persona - The user persona to authenticate as
 * @returns Session object with token and user data
 */
export async function createDevSession(persona: UserPersona): Promise<{
  session: Session
  user: {
    id: string
    name: string
    email: string
    organizationId: string
    primaryPersona: UserPersona
  }
  token: string
}> {
  // SECURITY: Prevent use in production
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error(
      'Development sessions are disabled in production. ' +
        'This command is only available in NODE_ENV=development or NODE_ENV=test.'
    )
  }

  // Find development user by persona
  const user = await prisma.user.findFirst({
    where: {
      primaryPersona: persona,
      email: {
        endsWith: '@dev.compilo.local', // Additional safety check
      },
      organization: {
        slug: 'compilo-dev',
      },
    },
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

  if (!user) {
    throw new Error(
      `Development user not found for persona: ${persona}\n` +
        `Run "pnpm db:seed" to create development users.`
    )
  }

  if (!user.organizationId) {
    throw new Error(
      `Development user ${user.email} has no organization.\n` +
        `This should not happen. Run "pnpm db:seed" to recreate development users.`
    )
  }

  // Delete any existing sessions for this user (clean slate)
  await prisma.session.deleteMany({
    where: { userId: user.id },
  })

  // Generate session token
  const sessionToken = generateSessionToken()

  // Create session (30-day expiration, matching NextAuth.js default)
  const session = await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  })

  return {
    session,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      organizationId: user.organizationId,
      primaryPersona: user.primaryPersona,
    },
    token: sessionToken,
  }
}

/**
 * Delete all development sessions
 * Useful for test cleanup
 */
export async function clearDevSessions(): Promise<void> {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Cannot clear dev sessions in production')
  }

  await prisma.session.deleteMany({
    where: {
      user: {
        email: {
          endsWith: '@dev.compilo.local',
        },
      },
    },
  })
}

/**
 * List all valid personas for development
 */
export function getValidDevPersonas(): UserPersona[] {
  return ['DPO', 'PRIVACY_OFFICER', 'BUSINESS_OWNER', 'IT_ADMIN', 'SECURITY_TEAM', 'LEGAL_TEAM']
}
