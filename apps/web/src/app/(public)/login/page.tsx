'use client'

import { Button, Card, CardContent, CardHeader, CardTitle } from '@compilothq/ui'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

import { EmailForm } from '@/components/auth/EmailForm'
import { GoogleButton } from '@/components/auth/GoogleButton'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const [emailSent, setEmailSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailSubmit = async (email: string) => {
    console.log('[Login] Starting email sign-in flow for:', email)
    setIsLoading(true)
    setError(null)

    try {
      console.log('[Login] Calling signIn with:', { email, callbackUrl, redirect: false })
      const result = await signIn('resend', {
        email,
        callbackUrl,
        redirect: false,
      })

      console.log('[Login] signIn result:', result)

      // Check the result for errors
      if (result.error) {
        console.error('[Login] Sign in error:', result.error)
        setError('Failed to send magic link. Please try again.')
        return
      }

      // Only show success if no error
      console.log('[Login] Sign in successful, showing confirmation')
      setSentEmail(email)
      setEmailSent(true)
    } catch (err) {
      console.error('[Login] Unexpected error during sign in:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Check your email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            We sent a magic link to <strong>{sentEmail}</strong>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Click the link in the email to sign in. The link will expire in 15 minutes.
          </p>
          <div className="pt-4">
            <Button variant="ghost" onClick={() => setEmailSent(false)} className="w-full text-sm">
              Use a different email
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
        <p className="text-center text-muted-foreground">Sign in to your Compilo account</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <EmailForm
          onSubmit={handleEmailSubmit}
          buttonText="Continue with Email"
          isLoading={isLoading}
        />

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <GoogleButton callbackUrl={callbackUrl} />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-foreground hover:text-accent-gold font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm transition-colors duration-200"
          >
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
