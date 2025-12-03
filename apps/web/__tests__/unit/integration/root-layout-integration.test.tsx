// @vitest-environment jsdom

/**
 * Root Layout Integration Tests
 *
 * Tests for the integration of the Toaster component in the root layout,
 * specifically verifying:
 * 1. Toaster renders inside ThemeProvider
 * 2. Toast notifications can be triggered from child components
 */

import { toast, Toaster } from '@compilothq/ui'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@/components/theme-provider'

// Mock window.matchMedia for next-themes compatibility
beforeAll(() => {
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
})

/**
 * Test wrapper that simulates the root layout structure:
 * ThemeProvider > children > Toaster
 */
function RootLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
      <Toaster />
    </ThemeProvider>
  )
}

/**
 * Test component that triggers toast notifications
 */
function ToastTriggerButton({ variant }: { variant: 'success' | 'error' | 'warning' | 'info' }) {
  const handleClick = () => {
    switch (variant) {
      case 'success':
        toast.success('Operation successful!')
        break
      case 'error':
        toast.error('An error occurred!')
        break
      case 'warning':
        toast.warning('Warning message!')
        break
      case 'info':
        toast.info('Information message!')
        break
    }
  }

  return (
    <button onClick={handleClick} data-testid={`trigger-${variant}`}>
      Trigger {variant} toast
    </button>
  )
}

describe('Root Layout Integration Tests', () => {
  beforeEach(() => {
    // Clear any existing toasts before each test
    toast.dismiss()
  })

  afterEach(() => {
    // Clean up toasts and DOM after each test
    toast.dismiss()
    cleanup()
  })

  describe('Toaster Component in ThemeProvider', () => {
    it('should render Toaster component inside ThemeProvider without errors', () => {
      // Arrange & Act
      const { container } = render(
        <RootLayoutWrapper>
          <div data-testid="app-content">Application Content</div>
        </RootLayoutWrapper>
      )

      // Assert
      expect(container).toBeInTheDocument()
      expect(screen.getByTestId('app-content')).toBeInTheDocument()
      // Toaster creates a portal - we verify it mounts without throwing
    })
  })

  describe('Toast Notifications from Child Components', () => {
    it('should allow child components to trigger toast notifications', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <RootLayoutWrapper>
          <ToastTriggerButton variant="success" />
        </RootLayoutWrapper>
      )

      // Act - Click button to trigger toast from child component
      await user.click(screen.getByTestId('trigger-success'))

      // Assert - Toast should be visible
      await waitFor(() => {
        expect(screen.getByText('Operation successful!')).toBeInTheDocument()
      })
    })

    it('should display all four toast variants correctly when triggered from child components', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <RootLayoutWrapper>
          <div>
            <ToastTriggerButton variant="success" />
            <ToastTriggerButton variant="error" />
            <ToastTriggerButton variant="warning" />
            <ToastTriggerButton variant="info" />
          </div>
        </RootLayoutWrapper>
      )

      // Act & Assert - Trigger and verify success variant
      await user.click(screen.getByTestId('trigger-success'))
      await waitFor(() => {
        const toastElements = screen.getAllByText('Operation successful!')
        // Use the first/most recent toast
        const toastElement = toastElements[0]
        expect(toastElement).toBeInTheDocument()
        const toastContainer = toastElement.closest('[data-sonner-toast]')
        expect(toastContainer).toHaveAttribute('data-type', 'success')
      })

      // Clear before next variant to avoid duplicate text issues
      toast.dismiss()
      await waitFor(
        () => {
          expect(screen.queryByText('Operation successful!')).not.toBeInTheDocument()
        },
        { timeout: 2000 }
      )

      // Act & Assert - Trigger and verify error variant
      await user.click(screen.getByTestId('trigger-error'))
      await waitFor(() => {
        const toastElement = screen.getByText('An error occurred!')
        expect(toastElement).toBeInTheDocument()
        const toastContainer = toastElement.closest('[data-sonner-toast]')
        expect(toastContainer).toHaveAttribute('data-type', 'error')
      })

      toast.dismiss()
      await waitFor(
        () => {
          expect(screen.queryByText('An error occurred!')).not.toBeInTheDocument()
        },
        { timeout: 2000 }
      )

      // Act & Assert - Trigger and verify warning variant
      await user.click(screen.getByTestId('trigger-warning'))
      await waitFor(() => {
        const toastElement = screen.getByText('Warning message!')
        expect(toastElement).toBeInTheDocument()
        const toastContainer = toastElement.closest('[data-sonner-toast]')
        expect(toastContainer).toHaveAttribute('data-type', 'warning')
      })

      toast.dismiss()
      await waitFor(
        () => {
          expect(screen.queryByText('Warning message!')).not.toBeInTheDocument()
        },
        { timeout: 2000 }
      )

      // Act & Assert - Trigger and verify info variant
      await user.click(screen.getByTestId('trigger-info'))
      await waitFor(() => {
        const toastElement = screen.getByText('Information message!')
        expect(toastElement).toBeInTheDocument()
        const toastContainer = toastElement.closest('[data-sonner-toast]')
        expect(toastContainer).toHaveAttribute('data-type', 'info')
      })
    })
  })
})
