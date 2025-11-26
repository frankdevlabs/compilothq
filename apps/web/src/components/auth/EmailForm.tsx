'use client'

import { Button, Input, Label } from '@compilothq/ui'
import { Mail } from 'lucide-react'
import { useState } from 'react'

interface EmailFormProps {
  onSubmit: (email: string) => Promise<void>
  buttonText?: string
  isLoading?: boolean
}

export function EmailForm({
  onSubmit,
  buttonText = 'Continue with Email',
  isLoading = false,
}: EmailFormProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic email validation
    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    try {
      await onSubmit(email)
    } catch {
      setError('Failed to send magic link. Please try again.')
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Button className="w-full" type="submit" disabled={isLoading || !email}>
        <Mail className="mr-2 h-4 w-4" />
        {isLoading ? 'Sending...' : buttonText}
      </Button>
    </form>
  )
}
