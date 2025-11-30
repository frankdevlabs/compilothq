'use client'

import { Button, Card, CardContent, CardHeader, CardTitle } from '@compilothq/ui'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

import { trpc } from '@/lib/trpc/client'

export default function InvitationAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const token = params.token as string

  // Fetch invitation details
  const { data: invitation, error: fetchError, isLoading } = trpc.invitation.getByToken.useQuery(
    { token },
    { enabled: !!token }
  )

  // Accept invitation mutation
  const acceptInvitation = trpc.invitation.accept.useMutation({
    onSuccess: async () => {
      // Update the session with the new organization
      await update()
      router.push('/dashboard')
    },
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/invite/${token}`)
    }
  }, [status, token, router])

  const handleAcceptInvitation = () => {
    acceptInvitation.mutate({ token })
  }

  if (isLoading || status === 'loading') {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading invitation...</p>
        </CardContent>
      </Card>
    )
  }

  if (fetchError || !invitation) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-destructive">
            Invitation Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            This invitation link is invalid or has expired.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => router.push('/login')}>
              Sign In
            </Button>
            <Button onClick={() => router.push('/signup')}>
              Create Account
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (acceptInvitation.error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">{acceptInvitation.error.message}</p>
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Format persona for display
  const formattedPersona = invitation.invitedPersona
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase())

  const isEmailMatch = session?.user.email?.toLowerCase() === invitation.email.toLowerCase()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Join {invitation.organization.name}
        </CardTitle>
        <p className="text-center text-muted-foreground">
          You&apos;ve been invited to join the team
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 p-4 rounded-lg bg-muted">
          <div>
            <p className="text-sm text-muted-foreground">Organization</p>
            <p className="font-medium">{invitation.organization.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Invited by</p>
            <p className="font-medium">{invitation.inviter.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your role</p>
            <p className="font-medium">{formattedPersona}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Invited email</p>
            <p className="font-medium">{invitation.email}</p>
          </div>
        </div>

        {session && !isEmailMatch && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            Warning: This invitation is for {invitation.email}, but you&apos;re signed in as{' '}
            {session.user.email}. Please sign in with the correct email address.
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleAcceptInvitation}
          disabled={acceptInvitation.isPending || !isEmailMatch}
        >
          {acceptInvitation.isPending ? 'Accepting...' : 'Accept Invitation'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By accepting, you&apos;ll join {invitation.organization.name} with the role of{' '}
          {formattedPersona}.
        </p>
      </CardContent>
    </Card>
  )
}
