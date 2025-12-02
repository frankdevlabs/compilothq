import { UserMenu } from '@/components/auth/UserMenu'
import { auth } from '@/lib/auth/config'

import { CommandPaletteTrigger } from './command-palette-trigger'
import { OrganizationSwitcher } from './organization-switcher'

/**
 * TopBar Component
 *
 * The main top navigation bar for the authenticated layout.
 * Renders as an async server component that fetches the current session.
 *
 * Layout:
 * - Left side: Logo, OrganizationSwitcher, CommandPaletteTrigger
 * - Right side: UserMenu
 *
 * Features:
 * - Organization switching dropdown
 * - Command palette trigger with keyboard shortcut hint (Cmd/Ctrl+K)
 * - User menu with profile and sign out actions
 * - Fixed height (h-16) with bottom border
 * - Responsive padding (px-6)
 */
export async function TopBar() {
  const session = await auth()

  // Get current organization from session
  // Note: session.user.organization is set in the auth callback (can be null if user hasn't onboarded)
  const currentOrg = session?.user.organization ?? null

  // Stubbed organizations list - data fetching is out of scope for now
  // In a real implementation, this would fetch all organizations the user has access to
  const organizations = currentOrg ? [currentOrg] : []

  return (
    <div className="h-16 border-b flex items-center justify-between px-6">
      {/* Left side: Logo, Organization Switcher, Command Palette Trigger */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Compilo</h1>

        {/* Organization Switcher - only show if user has an organization */}
        {session && currentOrg && (
          <OrganizationSwitcher currentOrg={currentOrg} organizations={organizations} />
        )}

        {/* Command Palette Trigger - only show when authenticated */}
        {session && <CommandPaletteTrigger />}
      </div>

      {/* Right side: User Menu */}
      <div className="flex items-center gap-4">{session && <UserMenu session={session} />}</div>
    </div>
  )
}
