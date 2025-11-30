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

interface MagicLinkEmailProps {
  email: string
  magicLink: string
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

export function MagicLinkEmail({ email, magicLink }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to your Compilo account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Sign in to Compilo</Heading>

          <Text style={text}>
            Hi there! Click the button below to sign in to your Compilo account.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={magicLink}>
              Sign in to Compilo
            </Button>
          </Section>

          <Text style={text}>
            This link will expire in <strong>15 minutes</strong> and can only be used once.
          </Text>

          <Text style={text}>If you didn&apos;t request this email, you can safely ignore it.</Text>

          <Text style={footer}>
            Signing in as: <strong>{email}</strong>
          </Text>

          <Text style={footer}>
            This link was sent to {email}. If you didn&apos;t request this link, please ignore this
            email.
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

export default MagicLinkEmail
