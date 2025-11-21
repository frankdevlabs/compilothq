import { config } from '@compilothq/validation'
import { Resend } from 'resend'

import { InvitationEmail } from '@/emails/InvitationEmail'
import { MagicLinkEmail } from '@/emails/MagicLinkEmail'

const resend = new Resend(config.auth.email.resendApiKey)

/**
 * Send a magic link email for passwordless authentication
 * @param email - Recipient email address
 * @param magicLink - The magic link URL
 */
export async function sendMagicLink(email: string, magicLink: string) {
  try {
    await resend.emails.send({
      from: 'Compilo <auth@compilo.app>',
      to: email,
      subject: 'Sign in to Compilo',
      react: MagicLinkEmail({ email, magicLink }),
    })

    console.log(`Magic link email sent to ${email}`)
  } catch (error) {
    console.error('Error sending magic link email:', error)
    throw new Error('Failed to send magic link email')
  }
}

/**
 * Send an invitation email to join an organization
 * @param invitation - Invitation details
 */
export async function sendInvitation(invitation: {
  email: string
  organizationName: string
  inviterName: string
  inviteLink: string
  invitedPersona: string
}) {
  try {
    await resend.emails.send({
      from: 'Compilo <invites@compilo.app>',
      to: invitation.email,
      subject: `Join ${invitation.organizationName} on Compilo`,
      react: InvitationEmail({
        inviteeEmail: invitation.email,
        organizationName: invitation.organizationName,
        inviterName: invitation.inviterName,
        inviteLink: invitation.inviteLink,
        invitedPersona: invitation.invitedPersona,
      }),
    })

    console.log(`Invitation email sent to ${invitation.email}`)
  } catch (error) {
    console.error('Error sending invitation email:', error)
    throw new Error('Failed to send invitation email')
  }
}
