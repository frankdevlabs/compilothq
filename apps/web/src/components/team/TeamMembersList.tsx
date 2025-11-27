'use client'

import type { UserPersona } from '@compilothq/database'
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@compilothq/ui'
import { format } from 'date-fns'

import { trpc } from '@/lib/trpc/client'

const formatPersona = (persona: UserPersona): string => {
  return persona
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export function TeamMembersList() {
  const { data: users, isLoading, error } = trpc.user.listByOrganization.useQuery()

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Loading team members...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
        <p className="font-medium">Failed to load team members</p>
        <p className="text-xs mt-1">{error.message}</p>
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No team members found</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell className="text-muted-foreground">{user.email}</TableCell>
            <TableCell>
              <Badge variant="secondary">{formatPersona(user.primaryPersona)}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {format(new Date(user.createdAt), 'MMM d, yyyy')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
