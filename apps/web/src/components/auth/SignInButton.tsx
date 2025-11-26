'use client'

import { Button } from '@compilothq/ui'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

interface SignInButtonProps {
  provider: 'google' | 'email'
  callbackUrl?: string
  email?: string
  children?: React.ReactNode
  className?: string
}

export function SignInButton({
  provider,
  callbackUrl = '/dashboard',
  email,
  children,
  className,
}: SignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn(provider, {
        email: provider === 'email' ? email : undefined,
        callbackUrl,
      })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={() => void handleSignIn()} disabled={isLoading} className={className}>
      {isLoading ? 'Signing in...' : (children ?? 'Sign In')}
    </Button>
  )
}
