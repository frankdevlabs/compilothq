// @vitest-environment jsdom

/**
 * OrganizationSwitcher Component - Unit Tests
 *
 * Tests React component for organization switching dropdown
 * with navigation and checkmark indicator functionality.
 */

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

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

// Mock ResizeObserver for Radix UI components (must be a class)
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

// Mock organizations data
const mockOrganizations = [
  { id: 'org-1', name: 'Acme Corp' },
  { id: 'org-2', name: 'Beta Inc' },
  { id: 'org-3', name: 'Gamma LLC' },
]

const mockCurrentOrg = mockOrganizations[0]

describe('OrganizationSwitcher Component - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('should render current organization name in trigger', () => {
    // Arrange & Act
    render(<OrganizationSwitcher currentOrg={mockCurrentOrg} organizations={mockOrganizations} />)

    // Assert
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('should open dropdown and show organization list when clicked', async () => {
    // Arrange
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<OrganizationSwitcher currentOrg={mockCurrentOrg} organizations={mockOrganizations} />)

    // Act - Click the trigger to open dropdown
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    // Assert - All organizations should be visible in the dropdown (rendered in portal)
    await waitFor(() => {
      // Find the listbox (dropdown content)
      const listbox = screen.getByRole('listbox')
      expect(listbox).toBeInTheDocument()

      // Check organizations are in the dropdown
      expect(within(listbox).getByText('Acme Corp')).toBeInTheDocument()
      expect(within(listbox).getByText('Beta Inc')).toBeInTheDocument()
      expect(within(listbox).getByText('Gamma LLC')).toBeInTheDocument()
    })
  })

  it('should show checkmark on active organization', async () => {
    // Arrange
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<OrganizationSwitcher currentOrg={mockCurrentOrg} organizations={mockOrganizations} />)

    // Act - Click the trigger to open dropdown
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    // Assert - Active organization should have data-state="checked"
    await waitFor(() => {
      const listbox = screen.getByRole('listbox')
      const activeItem = within(listbox).getByRole('option', { name: 'Acme Corp' })
      expect(activeItem).toHaveAttribute('data-state', 'checked')
    })
  })

  it('should navigate to /create-organization when "Create New Organization" is clicked', async () => {
    // Arrange
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<OrganizationSwitcher currentOrg={mockCurrentOrg} organizations={mockOrganizations} />)

    // Act - Open dropdown
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    // Wait for dropdown to open
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    // Find and click the "Create New Organization" option
    const listbox = screen.getByRole('listbox')
    const createOrgOption = within(listbox).getByText('Create New Organization')
    await user.click(createOrgOption)

    // Assert
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/create-organization')
    })
  })

  it('should render separator line between org list and create action', async () => {
    // Arrange
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<OrganizationSwitcher currentOrg={mockCurrentOrg} organizations={mockOrganizations} />)

    // Act - Open dropdown
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    // Assert - Wait for dropdown and verify separator is present
    await waitFor(() => {
      const listbox = screen.getByRole('listbox')
      expect(listbox).toBeInTheDocument()
    })

    // Separator should be rendered in the dropdown portal
    const separator = document.querySelector('[data-slot="select-separator"]')
    expect(separator).toBeInTheDocument()
  })
})
