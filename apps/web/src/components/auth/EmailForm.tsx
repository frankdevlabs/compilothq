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

    // Parent component handles errors via isLoading state
    await onSubmit(email)
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
          aria-invalid={!!error}
          aria-describedby={error ? 'email-error' : undefined}
        />
        {error && (
          <p id="email-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <Button
        size="lg"
        className="w-full font-semibold text-base"
        type="submit"
        disabled={isLoading || !email}
      >
        <Mail className="size-5" />
        {isLoading ? 'Sending...' : buttonText}
      </Button>
    </form>
  )
}
