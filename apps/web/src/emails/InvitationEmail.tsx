import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface InvitationEmailProps {
  inviteeEmail: string
  organizationName: string
  inviterName: string
  inviteLink: string
  invitedPersona: string
}

/**
 * Email Design Tokens
 *
 * Email clients don't support CSS variables or Tailwind classes.
 * These constants mirror the Compilo Design System for email compatibility.
 *
 * Color Mappings:
 * - background: #f6f9fc → bg-background (light mode equivalent)
 * - cardBackground: #ffffff → bg-card
 * - text: #333 → text-foreground
 * - buttonBg: #000 → bg-primary (dark navy)
 * - buttonText: #fff → text-primary-foreground
 * - mutedText: #8898aa → text-muted-foreground
 */
const EMAIL_COLORS = {
  background: '#f6f9fc', // Light background (mirrors bg-background)
  cardBackground: '#ffffff', // Card surface (mirrors bg-card)
  text: '#333', // Primary text (mirrors text-foreground)
  buttonBg: '#000', // Primary button (mirrors bg-primary - dark navy)
  buttonText: '#fff', // Button text (mirrors text-primary-foreground)
  mutedText: '#8898aa', // Secondary text (mirrors text-muted-foreground)
} as const

export function InvitationEmail({
  inviteeEmail,
  organizationName,
  inviterName,
  inviteLink,
  invitedPersona,
}: InvitationEmailProps) {
  // Format persona for display
  const formattedPersona = invitedPersona
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <Html>
      <Head />
      <Preview>Join {organizationName} on Compilo</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You&apos;ve been invited to join {organizationName}</Heading>

          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join{' '}
            <strong>{organizationName}</strong> on Compilo as a <strong>{formattedPersona}</strong>.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={inviteLink}>
              Accept Invitation
            </Button>
          </Section>

          <Text style={text}>
            This invitation will expire in <strong>7 days</strong>. If you don&apos;t have a Compilo
            account yet, you&apos;ll be able to create one when you click the link above.
          </Text>

          <Text style={text}>
            If you didn&apos;t expect this invitation, you can safely ignore this email.
          </Text>

          <Text style={footer}>
            This invitation was sent to: <strong>{inviteeEmail}</strong>
          </Text>

          <Text style={footer}>
            Compilo helps organizations manage their GDPR and data privacy compliance.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: EMAIL_COLORS.background,
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: EMAIL_COLORS.cardBackground,
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: EMAIL_COLORS.text,
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
}

const text = {
  color: EMAIL_COLORS.text,
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
}

const buttonContainer = {
  padding: '27px 40px',
}

const button = {
  backgroundColor: EMAIL_COLORS.buttonBg,
  borderRadius: '8px',
  color: EMAIL_COLORS.buttonText,
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
}

const footer = {
  color: EMAIL_COLORS.mutedText,
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 40px',
}

export default InvitationEmail
