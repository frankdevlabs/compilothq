'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@compilothq/ui'

import { InviteTeamMemberDialog } from '@/components/team/InviteTeamMemberDialog'
import { PendingInvitationsList } from '@/components/team/PendingInvitationsList'
import { TeamMembersList } from '@/components/team/TeamMembersList'

/**
 * Team Settings Page
 *
 * Allows organization administrators to:
 * - View current team members
 * - Invite new team members
 * - Manage pending invitations (cancel, resend)
 *
 * This page uses tRPC procedures with automatic organization filtering
 * via orgProcedure for multi-tenancy isolation.
 */
export default function TeamSettingsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground mt-2">
          Invite team members and manage access to your organization
        </p>
      </div>

      {/* Invite Team Member Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invite Team Member</CardTitle>
              <CardDescription>
                Send invitations to add new members to your organization
              </CardDescription>
            </div>
            <InviteTeamMemberDialog />
          </div>
        </CardHeader>
      </Card>

      {/* Pending Invitations Section */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Manage invitations that have been sent but not yet accepted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PendingInvitationsList />
        </CardContent>
      </Card>

      {/* Team Members Section */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>All members currently in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamMembersList />
        </CardContent>
      </Card>
    </div>
  )
}
