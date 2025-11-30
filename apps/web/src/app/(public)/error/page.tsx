'use client'

import { Button, Card, CardContent, CardHeader, CardTitle } from '@compilothq/ui'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  let message = 'An error occurred during authentication.'

  if (error === 'Configuration') {
    message = 'There is a problem with the server configuration.'
  } else if (error === 'AccessDenied') {
    message = 'You do not have permission to sign in.'
  } else if (error === 'Verification') {
    message = 'The verification link is invalid or has expired.'
  }

  return (
    <div className="container max-w-md mx-auto py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-destructive">
            Authentication Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">{message}</p>
          {error && (
            <p className="text-center text-sm text-muted-foreground">Error code: {error}</p>
          )}
          <div className="pt-4">
            <Button asChild className="w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
