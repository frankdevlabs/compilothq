'use client'

import { Button } from '@compilothq/ui'
import { LogOut, User } from 'lucide-react'
import type { Session } from 'next-auth'
import { signOut } from 'next-auth/react'

interface UserMenuProps {
  session: Session
}

export function UserMenu({ session }: UserMenuProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end text-sm">
        <span className="font-medium">{session.user.name}</span>
        {session.user.organization && (
          <span className="text-xs text-muted-foreground">{session.user.organization.name}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" title="Profile">
          <User className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
