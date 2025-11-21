'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@compilothq/ui'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

import { EmailForm } from '@/components/auth/EmailForm'
import { GoogleButton } from '@/components/auth/GoogleButton'

export default function SignupPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/create-organization'
  const [emailSent, setEmailSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const handleEmailSubmit = async (email: string) => {
    await signIn('resend', {
      email,
      callbackUrl,
      redirect: false,
    })
    setSentEmail(email)
    setEmailSent(true)
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
            Click the link in the email to continue your sign up. The link will expire in 15
            minutes.
          </p>
          <div className="pt-4">
            <button
              onClick={() => setEmailSent(false)}
              className="text-sm text-muted-foreground hover:text-foreground text-center w-full"
            >
              Use a different email
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Create your account</CardTitle>
        <p className="text-center text-muted-foreground">
          Get started with Compilo compliance management
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <EmailForm onSubmit={handleEmailSubmit} buttonText="Continue with Email" />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <GoogleButton callbackUrl={callbackUrl} />

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-foreground hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
