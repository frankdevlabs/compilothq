'use client'

import type { UserPersona } from '@compilothq/database'
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@compilothq/ui'
import { formatDistanceToNow } from 'date-fns'

import { trpc } from '@/lib/trpc/client'

const formatPersona = (persona: UserPersona): string => {
  return persona
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export function PendingInvitationsList() {
  const utils = trpc.useUtils()

  const {
    data: invitations,
    isLoading,
    error,
  } = trpc.invitation.list.useQuery({
    status: 'PENDING',
    limit: 50,
  })

  const resendInvitation = trpc.invitation.resend.useMutation({
    onSuccess: async () => utils.invitation.list.invalidate(),
  })

  const cancelInvitation = trpc.invitation.cancel.useMutation({
    onSuccess: async () => utils.invitation.list.invalidate(),
  })

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Loading invitations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
        <p className="font-medium">Failed to load invitations</p>
        <p className="text-xs mt-1">{error.message}</p>
      </div>
    )
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No pending invitations</p>
        <p className="text-xs text-muted-foreground mt-2">
          Invite team members using the button above
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Sent</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell className="font-medium">{invitation.email}</TableCell>
            <TableCell>
              <Badge variant="secondary">{formatPersona(invitation.invitedPersona)}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDistanceToNow(new Date(invitation.createdAt), {
                addSuffix: true,
              })}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(invitation.expiresAt) > new Date() ? (
                `in ${formatDistanceToNow(new Date(invitation.expiresAt))}`
              ) : (
                <span className="text-destructive">Expired</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resendInvitation.mutate({ invitationId: invitation.id })}
                  disabled={resendInvitation.isPending}
                >
                  {resendInvitation.isPending ? 'Sending...' : 'Resend'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => cancelInvitation.mutate({ invitationId: invitation.id })}
                  disabled={cancelInvitation.isPending}
                >
                  {cancelInvitation.isPending ? 'Cancelling...' : 'Cancel'}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
