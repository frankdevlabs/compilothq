'use client'

import { UserPersona } from '@compilothq/database'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@compilothq/ui'
import { Users } from 'lucide-react'
import { useState } from 'react'

import { trpc } from '@/lib/trpc/client'

export function InviteTeamMemberDialog() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [persona, setPersona] = useState<UserPersona | ''>('')
  const [error, setError] = useState('')
  const utils = trpc.useUtils()

  const sendInvitation = trpc.invitation.send.useMutation({
    onSuccess: () => {
      setEmail('')
      setPersona('')
      setError('')
      setOpen(false)
      void utils.invitation.list.invalidate()
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !persona) return

    sendInvitation.mutate({
      email,
      invitedPersona: persona,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Users className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to add a new member to your organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sendInvitation.isPending}
                required
              />
            </div>

            {/* Persona Select */}
            <div className="space-y-2">
              <Label htmlFor="persona">Role</Label>
              <Select
                value={persona}
                onValueChange={(value) => setPersona(value as UserPersona)}
                disabled={sendInvitation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DPO">Data Protection Officer</SelectItem>
                  <SelectItem value="PRIVACY_OFFICER">Privacy Officer</SelectItem>
                  <SelectItem value="BUSINESS_OWNER">Business Owner</SelectItem>
                  <SelectItem value="IT_ADMIN">IT Administrator</SelectItem>
                  <SelectItem value="SECURITY_TEAM">Security Team</SelectItem>
                  <SelectItem value="LEGAL_TEAM">Legal Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sendInvitation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sendInvitation.isPending || !email || !persona}>
              {sendInvitation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
