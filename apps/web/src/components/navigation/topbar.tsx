'use client'

import { Bell } from 'lucide-react'

export function TopBar() {
  return (
    <header className="border-b bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          {/* Breadcrumb placeholder */}
          <p className="text-sm text-muted-foreground">Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-accent/10 rounded transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          {/* User menu placeholder */}
          <div className="h-8 w-8 rounded-full bg-accent/20" />
        </div>
      </div>
    </header>
  )
}
