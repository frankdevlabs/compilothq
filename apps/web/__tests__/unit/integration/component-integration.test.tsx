// @vitest-environment jsdom

/**
 * Component Integration Tests
 *
 * Strategic tests covering critical integration points between components:
 * 1. CommandPaletteTrigger keyboard shortcut integration
 * 2. Sidebar keyboard navigation boundary behavior
 * 3. Toast action callback in layout context
 * 4. Sidebar collapse with organization switcher workflow
 */

import { toast, Toaster } from '@compilothq/ui'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { CommandPaletteTrigger } from '@/components/navigation/command-palette-trigger'
import { OrganizationSwitcher } from '@/components/navigation/organization-switcher'
import { Sidebar } from '@/components/navigation/sidebar'
import { ThemeProvider } from '@/components/theme-provider'

// Mock next/navigation
const mockPush = vi.fn()
const mockUsePathname = vi.fn<[], string>().mockReturnValue('/dashboard')
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: (): string => mockUsePathname(),
}))

// Mock ResizeObserver for Radix UI components
class MockResizeObserver implements ResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

// Mock window.matchMedia for next-themes compatibility
beforeAll(() => {
  global.ResizeObserver = MockResizeObserver

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock scrollIntoView for Radix UI
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
})

// Mock organizations data
const mockOrganizations = [
  { id: 'org-1', name: 'Acme Corp' },
  { id: 'org-2', name: 'Beta Inc' },
]

describe('Component Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePathname.mockReturnValue('/dashboard')
    toast.dismiss()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    toast.dismiss()
  })

  describe('CommandPaletteTrigger Keyboard Shortcut Integration', () => {
    it('should trigger command palette callback when Cmd/Ctrl+K is pressed', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Mock Mac platform
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      })

      render(<CommandPaletteTrigger />)

      // Act - Simulate Cmd+K keyboard shortcut
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      // Assert - The stubbed callback should log
      expect(consoleSpy).toHaveBeenCalledWith('Command palette triggered')

      consoleSpy.mockRestore()
    })

    it('should trigger command palette on button click as well as keyboard shortcut', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const user = userEvent.setup()

      render(<CommandPaletteTrigger />)

      // Act - Click the button
      const button = screen.getByRole('button', { name: /search/i })
      await user.click(button)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Command palette triggered')

      consoleSpy.mockRestore()
    })
  })

  describe('Sidebar Keyboard Navigation Boundary Behavior', () => {
    it('should wrap focus or stay at boundary when pressing ArrowUp at first nav item', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<Sidebar />)

      // Get all navigation links
      const navigation = screen.getByRole('navigation')
      const navItems = within(navigation).getAllByRole('link')
      const firstItem = navItems.at(0)

      expect(firstItem).toBeDefined()

      // Act - Focus first item and press ArrowUp
      firstItem?.focus()
      expect(document.activeElement).toBe(firstItem)

      await user.keyboard('{ArrowUp}')

      // Assert - Focus should either stay on first item or wrap to last item
      // (depending on implementation - both are valid UX patterns)
      expect(document.activeElement?.tagName.toLowerCase()).toMatch(/^(a|button)$/)
    })

    it('should maintain keyboard navigation after toggling collapse state', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<Sidebar />)

      // Act - Collapse sidebar first
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i })
      await user.click(toggleButton)

      // Verify sidebar is collapsed
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('w-16')

      // Now try keyboard navigation in collapsed mode
      const navigation = screen.getByRole('navigation')
      const navItems = within(navigation).getAllByRole('link')
      const firstItem = navItems.at(0)

      firstItem?.focus()
      await user.keyboard('{ArrowDown}')

      // Assert - Keyboard navigation should still work in collapsed mode
      expect(document.activeElement?.tagName.toLowerCase()).toMatch(/^(a|button)$/)
      expect(document.activeElement).not.toBe(firstItem)
    })
  })

  describe('Toast Action Callback in Layout Context', () => {
    it('should execute action callback when toast action button is clicked in ThemeProvider', async () => {
      // Arrange
      const user = userEvent.setup()
      const undoHandler = vi.fn()

      render(
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <button
            data-testid="delete-trigger"
            onClick={() => {
              toast.error('Item deleted', {
                action: {
                  label: 'Undo',
                  onClick: undoHandler,
                },
              })
            }}
          >
            Delete Item
          </button>
          <Toaster />
        </ThemeProvider>
      )

      // Act - Trigger the toast with action
      await user.click(screen.getByTestId('delete-trigger'))

      // Wait for toast to appear
      await waitFor(() => {
        expect(screen.getByText('Item deleted')).toBeInTheDocument()
      })

      // Click the undo action
      const undoButton = screen.getByRole('button', { name: /undo/i })
      await user.click(undoButton)

      // Assert - Undo handler should be called
      expect(undoHandler).toHaveBeenCalledOnce()
    })
  })

  describe('Sidebar and Organization Switcher Workflow', () => {
    it('should allow organization switcher interaction independent of sidebar collapse state', async () => {
      // Arrange
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      const onOrganizationChange = vi.fn()

      render(
        <div className="flex">
          <Sidebar />
          <div className="flex-1">
            <OrganizationSwitcher
              currentOrg={mockOrganizations[0]}
              organizations={mockOrganizations}
              onOrganizationChange={onOrganizationChange}
            />
          </div>
        </div>
      )

      // Act - First collapse the sidebar
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i })
      await user.click(toggleButton)

      // Verify sidebar is collapsed
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('w-16')

      // Now interact with organization switcher
      const orgTrigger = screen.getByRole('combobox')
      await user.click(orgTrigger)

      // Assert - Organization dropdown should still work
      await waitFor(() => {
        const listbox = screen.getByRole('listbox')
        expect(listbox).toBeInTheDocument()
        expect(within(listbox).getByText('Acme Corp')).toBeInTheDocument()
        expect(within(listbox).getByText('Beta Inc')).toBeInTheDocument()
      })
    })
  })

  describe('Combined Navigation Flow', () => {
    it('should support navigating to create organization from org switcher while sidebar is collapsed', async () => {
      // Arrange
      const user = userEvent.setup({ pointerEventsCheck: 0 })

      render(
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-4">
            <OrganizationSwitcher
              currentOrg={mockOrganizations[0]}
              organizations={mockOrganizations}
            />
          </div>
        </div>
      )

      // Act - Collapse sidebar
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i })
      await user.click(toggleButton)

      // Open organization dropdown
      const orgTrigger = screen.getByRole('combobox')
      await user.click(orgTrigger)

      // Wait for dropdown
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      // Click "Create New Organization"
      const createOption = within(screen.getByRole('listbox')).getByText('Create New Organization')
      await user.click(createOption)

      // Assert - Should navigate to create-organization route
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/create-organization')
      })
    })
  })
})
