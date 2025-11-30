import {
  cancelInvitation as cancelInvitationDAL,
  createInvitation as createInvitationDAL,
  findInvitationByToken,
  findPendingInvitationByEmail,
  getUserByEmailSimple,
  InvitationStatus,
  listInvitationsByOrganization,
  prisma,
  resendInvitation as resendInvitationDAL,
  updateUserOrganization,
  UserPersona,
} from '@compilothq/database'
import { config } from '@compilothq/validation'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { sendInvitation } from '@/lib/email/send'

import { orgProcedure, protectedProcedure, publicProcedure, router } from '../trpc'

export const invitationRouter = router({
  /**
   * Send a new invitation to join the organization
   */
  send: orgProcedure
    .input(
      z.object({
        email: z.string().email(),
        invitedPersona: z.nativeEnum(UserPersona),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user with this email already exists in this organization
      const existingUser = await getUserByEmailSimple(input.email)
      if (existingUser && existingUser.organizationId === ctx.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is already a member of this organization',
        })
      }

      // Check if there's already a pending invitation
      const pendingInvitation = await findPendingInvitationByEmail(
        input.email,
        ctx.organizationId
      )
      if (pendingInvitation) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User already has a pending invitation',
        })
      }

      // Create invitation
      const invitation = await createInvitationDAL({
        email: input.email,
        organizationId: ctx.organizationId,
        invitedBy: ctx.session.user.id,
        invitedPersona: input.invitedPersona,
      })

      // Fetch invitation with relations for email
      const fullInvitation = await findInvitationByToken(invitation.token)
      if (!fullInvitation) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch invitation',
        })
      }

      // Send invitation email
      const inviteLink = `${config.app.url}/invite/${invitation.token}`
      await sendInvitation({
        email: input.email,
        organizationName: fullInvitation.organization.name,
        inviterName: fullInvitation.inviter.name,
        inviteLink,
        invitedPersona: input.invitedPersona,
      })

      return invitation
    }),

  /**
   * List all invitations for the current organization
   */
  list: orgProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(InvitationStatus).optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await listInvitationsByOrganization(ctx.organizationId, input)
    }),

  /**
   * Cancel a pending invitation
   */
  cancel: orgProcedure
    .input(
      z.object({
        invitationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify invitation belongs to this organization
      const invitation = await prisma.invitation.findUnique({
        where: { id: input.invitationId },
      })

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      if (invitation.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Invitation does not belong to your organization',
        })
      }

      if (invitation.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only cancel pending invitations',
        })
      }

      return await cancelInvitationDAL(input.invitationId)
    }),

  /**
   * Resend a pending invitation
   */
  resend: orgProcedure
    .input(
      z.object({
        invitationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify invitation belongs to this organization
      const invitation = await prisma.invitation.findUnique({
        where: { id: input.invitationId },
        include: {
          organization: true,
          inviter: true,
        },
      })

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      if (invitation.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Invitation does not belong to your organization',
        })
      }

      if (invitation.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only resend pending invitations',
        })
      }

      // Resend invitation (generates new token)
      const updatedInvitation = await resendInvitationDAL(input.invitationId)

      // Send email with new link
      const inviteLink = `${config.app.url}/invite/${updatedInvitation.token}`
      await sendInvitation({
        email: invitation.email,
        organizationName: invitation.organization.name,
        inviterName: invitation.inviter.name,
        inviteLink,
        invitedPersona: invitation.invitedPersona,
      })

      return updatedInvitation
    }),

  /**
   * Get invitation details by token (public - for acceptance page)
   */
  getByToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      const invitation = await findInvitationByToken(input.token)

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      // Check if invitation is still valid
      if (invitation.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invitation is ${invitation.status.toLowerCase()}`,
        })
      }

      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invitation has expired',
        })
      }

      return invitation
    }),

  /**
   * Accept an invitation (requires authentication)
   */
  accept: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await findInvitationByToken(input.token)

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      // Validate invitation is still pending and not expired
      if (invitation.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invitation is ${invitation.status.toLowerCase()}`,
        })
      }

      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invitation has expired',
        })
      }

      // Validate email matches authenticated user
      if (invitation.email.toLowerCase() !== ctx.session.user.email?.toLowerCase()) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This invitation is for a different email address',
        })
      }

      // Check if user already belongs to an organization
      if (ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You already belong to an organization',
        })
      }

      // Update user with organization and persona
      await updateUserOrganization(
        ctx.session.user.id,
        invitation.organizationId,
        invitation.invitedPersona
      )

      // Mark invitation as accepted
      await prisma.invitation.update({
        where: { token: input.token },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      })

      return {
        success: true,
        organizationId: invitation.organizationId,
        organizationName: invitation.organization.name,
      }
    }),
})
