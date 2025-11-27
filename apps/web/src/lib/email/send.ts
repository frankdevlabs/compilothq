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
  console.log('[Email] Preparing to send magic link')
  console.log('[Email] Recipient:', email)
  console.log('[Email] Resend API key present:', !!config.auth.email.resendApiKey)

  try {
    const result = await resend.emails.send({
      from: 'Compilo <auth@mrfrank.dev>',
      to: email,
      subject: 'Sign in to Compilo',
      react: MagicLinkEmail({ email, magicLink }),
    })

    console.log('[Email] Resend response:', result)

    // Check for Resend API errors
    if (result.error) {
      console.error('[Email] Resend API rejected email:', result.error)

      if (result.error.statusCode === 403) {
        console.error(
          '[Email] Domain not authorized. Please verify your domain in Resend dashboard:',
          'https://resend.com/domains'
        )
        throw new Error(
          'Email domain not verified. Please verify compilo.app in your Resend dashboard.'
        )
      }

      throw new Error(`Resend API error: ${result.error.message}`)
    }

    console.log(`[Email] Magic link email sent successfully to ${email}`)
  } catch (error) {
    console.error('[Email] Failed to send magic link:', error)
    throw error
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
      from: 'Compilo <invites@mrfrank.dev>',
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
