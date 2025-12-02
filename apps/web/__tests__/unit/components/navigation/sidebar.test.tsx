// @vitest-environment jsdom

/**
 * Enhanced Sidebar Component - Unit Tests
 *
 * Tests React component for sidebar navigation with collapsed mode
 * and keyboard navigation functionality.
 */

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Sidebar } from '@/components/navigation/sidebar'

// Mock next/navigation
const mockUsePathname = vi.fn<[], string>().mockReturnValue('/dashboard')
vi.mock('next/navigation', () => ({
  usePathname: (): string => mockUsePathname(),
}))

describe('Enhanced Sidebar Component - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePathname.mockReturnValue('/dashboard')
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('should render in expanded mode by default with visible labels', () => {
    // Arrange & Act
    render(<Sidebar />)

    // Assert - Labels should be visible in expanded mode
    expect(screen.getByText('Dashboard')).toBeVisible()
    expect(screen.getByText('Settings')).toBeVisible()
    expect(screen.getByText('Processing Activities')).toBeVisible()

    // Sidebar should have expanded width class
    const sidebar = screen.getByRole('complementary')
    expect(sidebar).toHaveClass('w-64')
  })

  it('should toggle collapse state when toggle button is clicked', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Sidebar />)

    // Act - Find and click the collapse toggle button
    const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i })
    await user.click(toggleButton)

    // Assert - Sidebar should now be collapsed (narrow width)
    const sidebar = screen.getByRole('complementary')
    expect(sidebar).toHaveClass('w-16')

    // In collapsed mode, labels should have sr-only class (hidden visually)
    // Query by the link's accessible name which uses the sr-only span
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    const labelSpan = dashboardLink.querySelector('span')
    expect(labelSpan).toHaveClass('sr-only')
  })

  it('should show only icons in collapsed mode', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Sidebar />)

    // Act - Collapse the sidebar
    const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i })
    await user.click(toggleButton)

    // Assert - Icons should still be visible
    const sidebar = screen.getByRole('complementary')
    const icons = sidebar.querySelectorAll('svg.h-4.w-4')
    expect(icons.length).toBeGreaterThan(0)

    // Text labels should be visually hidden (sr-only) but present for accessibility
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    const labelSpan = dashboardLink.querySelector('span')
    expect(labelSpan).toHaveClass('sr-only')
  })

  it('should move focus between nav items using Arrow keys', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Sidebar />)

    // Act - Focus on the navigation and use arrow keys
    const navigation = screen.getByRole('navigation')
    const navItems = within(navigation).getAllByRole('link')

    // Focus the first item - getAllByRole guarantees at least one element exists
    const firstItem = navItems.at(0)
    expect(firstItem).toBeDefined()
    firstItem?.focus()
    expect(document.activeElement).toBe(firstItem)

    // Press Arrow Down to move to next item
    await user.keyboard('{ArrowDown}')

    // Assert - Focus should move to next focusable item (link or button)
    expect(document.activeElement?.tagName.toLowerCase()).toMatch(/^(a|button)$/)
    // Verify focus is no longer on the first item
    expect(document.activeElement).not.toBe(firstItem)
  })

  it('should activate focused item with Enter or Space key', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Sidebar />)

    // Components section is expanded by default, so first collapse it
    const componentsButton = screen.getByRole('button', { name: /components/i })

    // Verify initial state - Components is expanded by default
    expect(screen.getByText('Processors')).toBeInTheDocument()

    // Act - Focus and press Space to collapse
    componentsButton.focus()
    await user.keyboard(' ')

    // Assert - Section should be collapsed (children not visible)
    expect(screen.queryByText('Processors')).not.toBeInTheDocument()

    // Act - Press Space again to expand
    await user.keyboard(' ')

    // Assert - Section should be expanded again
    expect(screen.getByText('Processors')).toBeVisible()
    expect(screen.getByText('Data Categories')).toBeVisible()
  })

  it('should preserve gold accent active states when collapsed', async () => {
    // Arrange
    mockUsePathname.mockReturnValue('/dashboard')
    const user = userEvent.setup()
    render(<Sidebar />)

    // Find the active link
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })

    // Assert - Active state styling should be present in expanded mode
    expect(dashboardLink).toHaveClass('bg-accent-gold/5')
    expect(dashboardLink).toHaveClass('border-l-4')
    expect(dashboardLink).toHaveClass('border-accent-gold')

    // Act - Collapse the sidebar
    const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i })
    await user.click(toggleButton)

    // Assert - Gold accent styling should still be preserved
    expect(dashboardLink).toHaveClass('bg-accent-gold/5')
    expect(dashboardLink).toHaveClass('border-l-4')
    expect(dashboardLink).toHaveClass('border-accent-gold')
  })
})
