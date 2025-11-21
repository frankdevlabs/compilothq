'use client'

import { Button } from '@compilothq/ui'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

interface SignOutButtonProps {
  children?: React.ReactNode
  className?: string
  callbackUrl?: string
}

export function SignOutButton({ children, className, callbackUrl = '/' }: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({ callbackUrl })
    } catch (error) {
      console.error('Sign out error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSignOut}
      disabled={isLoading}
      variant="ghost"
      className={className}
    >
      {isLoading ? 'Signing out...' : children || 'Sign Out'}
    </Button>
  )
}
