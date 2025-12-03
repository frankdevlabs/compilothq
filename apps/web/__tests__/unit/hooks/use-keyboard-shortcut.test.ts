// @vitest-environment jsdom

/**
 * useKeyboardShortcut Hook - Unit Tests
 *
 * Tests React hook for registering and handling keyboard shortcuts
 * with cross-platform modifier key support.
 */

import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'

describe('useKeyboardShortcut Hook - Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('should register keyboard event listener on mount', () => {
    // Arrange
    const callback = vi.fn()
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

    // Act
    renderHook(() =>
      useKeyboardShortcut({
        key: 'k',
        modifiers: ['cmd'],
        callback,
      })
    )

    // Assert
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should clean up listener on unmount (no memory leaks)', () => {
    // Arrange
    const callback = vi.fn()
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    // Act
    const { unmount } = renderHook(() =>
      useKeyboardShortcut({
        key: 'k',
        modifiers: ['cmd'],
        callback,
      })
    )

    // Verify removeEventListener not called before unmount
    expect(removeEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function))

    // Unmount the hook
    unmount()

    // Assert - removeEventListener should be called with 'keydown' and a function
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should detect Cmd modifier on Mac and Ctrl on Windows/Linux', () => {
    // Arrange
    const callback = vi.fn()

    // Test Mac platform - Cmd+K should trigger
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    })

    renderHook(() =>
      useKeyboardShortcut({
        key: 'k',
        modifiers: ['cmd'],
        callback,
      })
    )

    // Simulate Cmd+K on Mac (metaKey = true)
    const macEvent = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      ctrlKey: false,
      bubbles: true,
    })
    window.dispatchEvent(macEvent)

    expect(callback).toHaveBeenCalledTimes(1)

    // Cleanup and test Windows
    cleanup()
    callback.mockClear()

    // Test Windows platform - Ctrl+K should trigger
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      configurable: true,
    })

    renderHook(() =>
      useKeyboardShortcut({
        key: 'k',
        modifiers: ['cmd'],
        callback,
      })
    )

    // Simulate Ctrl+K on Windows (ctrlKey = true)
    const windowsEvent = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: false,
      ctrlKey: true,
      bubbles: true,
    })
    window.dispatchEvent(windowsEvent)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should fire callback when correct shortcut is pressed', () => {
    // Arrange
    const callback = vi.fn()

    // Ensure we're on a Mac-like platform for consistent testing
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    })

    renderHook(() =>
      useKeyboardShortcut({
        key: 'k',
        modifiers: ['cmd'],
        callback,
      })
    )

    // Act - Press Cmd+K
    const correctEvent = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    })
    window.dispatchEvent(correctEvent)

    // Assert
    expect(callback).toHaveBeenCalledTimes(1)

    // Act - Press wrong key (Cmd+J) - should NOT trigger
    const wrongKeyEvent = new KeyboardEvent('keydown', {
      key: 'j',
      metaKey: true,
      bubbles: true,
    })
    window.dispatchEvent(wrongKeyEvent)

    // Assert - callback should still have been called only once
    expect(callback).toHaveBeenCalledTimes(1)

    // Act - Press right key without modifier - should NOT trigger
    const noModifierEvent = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: false,
      bubbles: true,
    })
    window.dispatchEvent(noModifierEvent)

    // Assert - callback should still have been called only once
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
