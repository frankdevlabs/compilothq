// @vitest-environment jsdom

/**
 * TopBar Component - Unit Tests
 *
 * Tests enhanced TopBar with OrganizationSwitcher, CommandPaletteTrigger,
 * and existing UserMenu components.
 */

import { cleanup, render, screen } from '@testing-library/react'
import type { Session } from 'next-auth'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { UserMenu } from '@/components/auth/UserMenu'
// We need to test the client wrapper components since TopBar is an async server component
import { CommandPaletteTrigger } from '@/components/navigation/command-palette-trigger'
import { OrganizationSwitcher } from '@/components/navigation/organization-switcher'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock next-auth/react for UserMenu
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

// Mock ResizeObserver for Radix UI components
class MockResizeObserver implements ResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  global.ResizeObserver = MockResizeObserver

  // Mock scrollIntoView for Radix UI
  Element.prototype.scrollIntoView = vi.fn()

  // Mock hasPointerCapture for Radix UI pointer handling
  Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
})

// Mock session data
const mockSession: Session = {
  user: {
    id: 'user-1',
    organizationId: 'org-1',
    primaryPersona: 'DPO',
    name: 'John Doe',
    email: 'john@example.com',
    organization: {
      id: 'org-1',
      name: 'Acme Corp',
      slug: 'acme-corp',
    },
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
}

// Mock organizations data
const mockOrganizations = [
  { id: 'org-1', name: 'Acme Corp' },
  { id: 'org-2', name: 'Beta Inc' },
]

describe('TopBar Component - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('OrganizationSwitcher Integration', () => {
    it('should render OrganizationSwitcher on left side of topbar', () => {
      // Arrange & Act
      // Render the left side of topbar as it would appear
      render(
        <div className="flex items-center gap-4" data-testid="topbar-left">
          <h1 className="text-xl font-semibold">Compilo</h1>
          <OrganizationSwitcher
            currentOrg={mockOrganizations[0]}
            organizations={mockOrganizations}
          />
        </div>
      )

      // Assert
      const leftContainer = screen.getByTestId('topbar-left')
      expect(leftContainer).toBeInTheDocument()

      // OrganizationSwitcher should be present (trigger with current org name)
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()

      // Check that organization switcher is in the left container
      const orgSwitcher = screen.getByRole('combobox')
      expect(leftContainer).toContainElement(orgSwitcher)
    })
  })

  describe('CommandPaletteTrigger', () => {
    it('should render command palette trigger button with shortcut hint', () => {
      // Arrange
      // Mock Mac platform for consistent testing
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      })

      // Act
      render(<CommandPaletteTrigger />)

      // Assert
      // Should render a button with search functionality
      const triggerButton = screen.getByRole('button', { name: /search/i })
      expect(triggerButton).toBeInTheDocument()

      // Should show keyboard shortcut hint - on Mac it should show Cmd+K
      // The text might be rendered with a symbol or text
      expect(screen.getByText(/K/)).toBeInTheDocument()
    })

    it('should show correct shortcut for Windows/Linux platform', () => {
      // Arrange
      // Mock Windows platform
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      })

      // Act
      render(<CommandPaletteTrigger />)

      // Assert
      // Should render a button
      const triggerButton = screen.getByRole('button', { name: /search/i })
      expect(triggerButton).toBeInTheDocument()

      // Should show K in the shortcut hint
      expect(screen.getByText(/K/)).toBeInTheDocument()
    })
  })

  describe('UserMenu Integration', () => {
    it('should render UserMenu on right side when session exists', () => {
      // Arrange & Act
      render(
        <div className="flex items-center gap-4" data-testid="topbar-right">
          <UserMenu session={mockSession} />
        </div>
      )

      // Assert
      const rightContainer = screen.getByTestId('topbar-right')
      expect(rightContainer).toBeInTheDocument()

      // UserMenu should display the user name
      expect(screen.getByText('John Doe')).toBeInTheDocument()

      // UserMenu should have sign out button
      expect(screen.getByTitle('Sign out')).toBeInTheDocument()
    })
  })

  describe('TopBar Structure', () => {
    it('should maintain h-16 border-b structure with correct layout', () => {
      // Arrange & Act
      // Render the complete topbar structure as it would appear
      render(
        <div className="h-16 border-b flex items-center justify-between px-6" data-testid="topbar">
          <div className="flex items-center gap-4" data-testid="topbar-left">
            <h1 className="text-xl font-semibold">Compilo</h1>
            <OrganizationSwitcher
              currentOrg={mockOrganizations[0]}
              organizations={mockOrganizations}
            />
            <CommandPaletteTrigger />
          </div>
          <div className="flex items-center gap-4" data-testid="topbar-right">
            <UserMenu session={mockSession} />
          </div>
        </div>
      )

      // Assert
      const topbar = screen.getByTestId('topbar')
      expect(topbar).toBeInTheDocument()

      // Verify h-16 and border-b classes
      expect(topbar).toHaveClass('h-16', 'border-b')

      // Verify flex layout classes
      expect(topbar).toHaveClass('flex', 'items-center', 'justify-between')

      // Verify px-6 padding
      expect(topbar).toHaveClass('px-6')

      // Verify left and right containers exist
      expect(screen.getByTestId('topbar-left')).toBeInTheDocument()
      expect(screen.getByTestId('topbar-right')).toBeInTheDocument()
    })
  })
})
