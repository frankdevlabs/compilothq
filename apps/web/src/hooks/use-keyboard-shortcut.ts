'use client'

import { useCallback, useEffect } from 'react'

/**
 * Modifier key types for keyboard shortcuts
 *
 * - 'cmd': Maps to metaKey on Mac, ctrlKey on Windows/Linux
 * - 'ctrl': Always maps to ctrlKey
 * - 'shift': Maps to shiftKey
 * - 'alt': Maps to altKey (Option on Mac)
 */
export type ModifierKey = 'cmd' | 'ctrl' | 'shift' | 'alt'

/**
 * Configuration for a keyboard shortcut
 */
export interface KeyboardShortcutConfig {
  /** The key to listen for (case-insensitive) */
  key: string
  /** Optional modifier keys required for the shortcut */
  modifiers?: ModifierKey[]
  /** Callback function to execute when shortcut is triggered */
  callback: () => void
  /** Whether the shortcut is disabled (default: false) */
  disabled?: boolean
}

/**
 * Detects if the current platform is macOS
 *
 * Uses navigator.platform as primary detection with userAgent as fallback.
 * Returns true for Mac platforms, false for Windows/Linux.
 */
function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  // Check navigator.platform first (more reliable)
  if (navigator.platform) {
    return navigator.platform.toLowerCase().includes('mac')
  }

  // Fallback to userAgent
  if (navigator.userAgent) {
    return navigator.userAgent.toLowerCase().includes('mac')
  }

  return false
}

/**
 * Checks if a modifier key is pressed based on the keyboard event
 *
 * The 'cmd' modifier is special - it maps to metaKey on Mac and ctrlKey on Windows/Linux.
 * This allows for cross-platform shortcuts like Cmd+K (Mac) / Ctrl+K (Windows).
 */
function isModifierPressed(modifier: ModifierKey, event: KeyboardEvent): boolean {
  const isMac = isMacPlatform()

  switch (modifier) {
    case 'cmd':
      // On Mac, use metaKey (Cmd). On Windows/Linux, use ctrlKey.
      return isMac ? event.metaKey : event.ctrlKey
    case 'ctrl':
      // Always use ctrlKey regardless of platform
      return event.ctrlKey
    case 'shift':
      return event.shiftKey
    case 'alt':
      return event.altKey
    default:
      return false
  }
}

/**
 * Custom hook for registering keyboard shortcuts
 *
 * This hook provides a declarative way to register keyboard shortcuts with
 * automatic cleanup on unmount and cross-platform modifier key support.
 *
 * @example
 * // Register Cmd+K (Mac) / Ctrl+K (Windows) shortcut
 * useKeyboardShortcut({
 *   key: 'k',
 *   modifiers: ['cmd'],
 *   callback: () => console.log('Command palette triggered'),
 * })
 *
 * @example
 * // Register Shift+? shortcut for help
 * useKeyboardShortcut({
 *   key: '?',
 *   modifiers: ['shift'],
 *   callback: () => setShowHelp(true),
 * })
 */
export function useKeyboardShortcut({
  key,
  modifiers = [],
  callback,
  disabled = false,
}: KeyboardShortcutConfig): void {
  // Memoize the handler to ensure consistent reference for cleanup
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) {
        return
      }

      // Normalize key comparison (case-insensitive)
      const pressedKey = event.key.toLowerCase()
      const targetKey = key.toLowerCase()

      // Check if the pressed key matches
      if (pressedKey !== targetKey) {
        return
      }

      // Check if all required modifiers are pressed
      const allModifiersPressed = modifiers.every((modifier) => isModifierPressed(modifier, event))

      if (!allModifiersPressed) {
        return
      }

      // If we have modifiers defined, ensure no extra modifiers are pressed
      // unless they are in our modifiers list
      if (modifiers.length > 0) {
        const isMac = isMacPlatform()

        // Count expected vs actual modifiers
        const expectedCmd = modifiers.includes('cmd')
        const expectedCtrl = modifiers.includes('ctrl')
        const expectedShift = modifiers.includes('shift')
        const expectedAlt = modifiers.includes('alt')

        // On Mac, cmd maps to metaKey
        // On Windows/Linux, cmd maps to ctrlKey
        if (isMac) {
          // Mac: metaKey is cmd, ctrlKey is ctrl
          if (event.metaKey !== expectedCmd) return
          if (event.ctrlKey !== expectedCtrl) return
        } else {
          // Windows/Linux: ctrlKey is cmd (when cmd modifier is used)
          if (expectedCmd && !event.ctrlKey) return
          if (!expectedCmd && event.ctrlKey && !expectedCtrl) return
          if (event.metaKey) return // Windows rarely uses metaKey
        }

        if (event.shiftKey !== expectedShift) return
        if (event.altKey !== expectedAlt) return
      }

      // Prevent default browser behavior for matched shortcuts
      event.preventDefault()

      // Execute the callback
      callback()
    },
    [key, modifiers, callback, disabled]
  )

  useEffect(() => {
    // Add event listener on mount
    window.addEventListener('keydown', handleKeyDown)

    // Cleanup: remove event listener on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

/**
 * Returns the appropriate modifier key label for the current platform
 *
 * Useful for displaying shortcut hints in the UI.
 *
 * @returns 'Cmd' for Mac, 'Ctrl' for Windows/Linux
 */
export function getPlatformModifierKey(): string {
  return isMacPlatform() ? 'Cmd' : 'Ctrl'
}

/**
 * Returns the appropriate modifier key symbol for the current platform
 *
 * Useful for displaying shortcut hints with symbols.
 *
 * @returns Command symbol for Mac, 'Ctrl' for Windows/Linux
 */
export function getPlatformModifierSymbol(): string {
  return isMacPlatform() ? '\u2318' : 'Ctrl'
}
