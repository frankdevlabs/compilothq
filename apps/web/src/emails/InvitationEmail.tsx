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
            <strong>{inviterName}</strong> has invited you to join <strong>{organizationName}</strong>{' '}
            on Compilo as a <strong>{formattedPersona}</strong>.
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
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
}

const buttonContainer = {
  padding: '27px 40px',
}

const button = {
  backgroundColor: '#000',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 40px',
}

export default InvitationEmail
