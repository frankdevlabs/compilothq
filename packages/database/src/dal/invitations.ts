import type { Invitation, InvitationStatus, UserPersona } from '../index'
import { prisma } from '../index'
import { generateInvitationToken, getInvitationExpiryDate } from '../utils/tokens'

/**
 * Create a new invitation
 * Generates secure token and sets 7-day expiration
 */
export async function createInvitation(data: {
  email: string
  organizationId: string
  invitedBy: string
  invitedPersona: UserPersona
}): Promise<Invitation> {
  const token = generateInvitationToken()
  const expiresAt = getInvitationExpiryDate()

  return await prisma.invitation.create({
    data: {
      email: data.email,
      token,
      organizationId: data.organizationId,
      invitedBy: data.invitedBy,
      invitedPersona: data.invitedPersona,
      status: 'PENDING',
      expiresAt,
    },
  })
}

/**
 * Find an invitation by its token
 * Includes organization and inviter data for display
 */
export async function findInvitationByToken(token: string): Promise<
  | (Invitation & {
      organization: { id: string; name: string; slug: string }
      inviter: { id: string; name: string; email: string }
    })
  | null
> {
  return await prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Get an invitation by ID
 */
export async function getInvitationById(id: string): Promise<Invitation | null> {
  return await prisma.invitation.findUnique({
    where: { id },
  })
}

/**
 * Accept an invitation
 * Updates status to ACCEPTED and sets acceptedAt timestamp
 */
export async function acceptInvitation(token: string): Promise<Invitation> {
  return await prisma.invitation.update({
    where: { token },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    },
  })
}

/**
 * Cancel an invitation
 * Updates status to CANCELLED
 */
export async function cancelInvitation(id: string): Promise<Invitation> {
  return await prisma.invitation.update({
    where: { id },
    data: {
      status: 'CANCELLED',
    },
  })
}

/**
 * Resend an invitation
 * Generates new token and resets expiration
 */
export async function resendInvitation(id: string): Promise<Invitation> {
  const token = generateInvitationToken()
  const expiresAt = getInvitationExpiryDate()

  return await prisma.invitation.update({
    where: { id },
    data: {
      token,
      expiresAt,
      status: 'PENDING', // Reset to pending in case it was expired
    },
  })
}

/**
 * List invitations by organization
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 */
export async function listInvitationsByOrganization(
  organizationId: string,
  options?: {
    status?: InvitationStatus
    limit?: number
  }
): Promise<
  (Invitation & {
    inviter: { id: string; name: string; email: string }
  })[]
> {
  return await prisma.invitation.findMany({
    where: {
      organizationId,
      ...(options?.status ? { status: options.status } : {}),
    },
    include: {
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    ...(options?.limit ? { take: options.limit } : {}),
  })
}

/**
 * Find pending invitation by email and organization
 * Used to check if user already has a pending invitation
 */
export async function findPendingInvitationByEmail(
  email: string,
  organizationId: string
): Promise<Invitation | null> {
  return await prisma.invitation.findFirst({
    where: {
      email,
      organizationId,
      status: 'PENDING',
    },
  })
}

/**
 * Mark expired invitations
 * Updates status of invitations past their expiration date
 * This function should be called periodically (e.g., via cron job)
 */
export async function markExpiredInvitations(): Promise<number> {
  const result = await prisma.invitation.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: 'EXPIRED',
    },
  })

  return result.count
}
