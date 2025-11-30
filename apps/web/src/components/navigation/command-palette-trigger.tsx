'use client'

import { Button } from '@compilothq/ui'
import { Search } from 'lucide-react'
import { useSyncExternalStore } from 'react'

import { getPlatformModifierKey, useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'

/**
 * CommandPaletteTrigger Component
 *
 * A button that triggers the command palette (future implementation).
 * Displays a keyboard shortcut hint that adapts to the user's platform:
 * - Mac: Shows "Cmd+K"
 * - Windows/Linux: Shows "Ctrl+K"
 *
 * Features:
 * - Ghost button variant with Search icon
 * - Platform-aware keyboard shortcut display
 * - Registers Cmd/Ctrl+K keyboard shortcut
 * - Stubbed callback for future command palette implementation
 *
 * @example
 * ```tsx
 * <CommandPaletteTrigger />
 * ```
 */
export function CommandPaletteTrigger() {
  // Use useSyncExternalStore for platform-dependent state (React 19 best practice)
  // This avoids setState in useEffect and properly handles SSR/client hydration
  const modifierKey = useSyncExternalStore(
    () => () => {}, // subscribe: no-op since platform doesn't change
    () => getPlatformModifierKey(), // getSnapshot: client-side value
    () => 'Ctrl' // getServerSnapshot: SSR fallback
  )

  /**
   * Handle command palette trigger
   * Stubbed for now - actual implementation is out of scope
   */
  const handleTrigger = () => {
    console.log('Command palette triggered')
  }

  // Register Cmd/Ctrl+K keyboard shortcut
  useKeyboardShortcut({
    key: 'k',
    modifiers: ['cmd'],
    callback: handleTrigger,
  })

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleTrigger}
      className="gap-2 text-muted-foreground hover:text-foreground"
      aria-label="Search - Open command palette"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline-flex items-center gap-1">
        <span className="text-xs">Search</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span>{modifierKey}</span>
          <span>K</span>
        </kbd>
      </span>
    </Button>
  )
}
