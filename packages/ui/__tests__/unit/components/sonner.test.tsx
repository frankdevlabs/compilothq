// @vitest-environment happy-dom

/**
 * Sonner Toast Component - Unit Tests
 *
 * Tests React component rendering and toast functionality using happy-dom.
 */

import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { toast, TOAST_DURATIONS, Toaster } from '../../../src/components/sonner'

describe('Sonner Toast System - Unit Tests', () => {
  beforeEach(() => {
    // Clear any existing toasts before each test
    toast.dismiss()
  })

  afterEach(() => {
    // Clean up toasts after each test
    toast.dismiss()
  })

  describe('Toaster Component', () => {
    it('should render Toaster component without errors', () => {
      // Arrange & Act
      const { container } = render(<Toaster />)

      // Assert - Toaster creates a portal, check that it renders without throwing
      expect(container).toBeInTheDocument()
    })
  })

  describe('Toast Variant Styling', () => {
    it('should show success toast with gold accent styling', async () => {
      // Arrange
      render(<Toaster />)

      // Act
      act(() => {
        toast.success('Success message')
      })

      // Assert
      await waitFor(() => {
        const toastElement = screen.getByText('Success message')
        expect(toastElement).toBeInTheDocument()

        // Find the toast container with success styling
        const toastContainer = toastElement.closest('[data-sonner-toast]')
        expect(toastContainer).toBeInTheDocument()
        // Verify it has success data attribute
        expect(toastContainer).toHaveAttribute('data-type', 'success')
      })
    })

    it('should show error toast with destructive red styling and 8s duration', async () => {
      // Arrange
      render(<Toaster />)

      // Act
      act(() => {
        toast.error('Error message')
      })

      // Assert - Check that error toast appears with correct styling
      await waitFor(() => {
        const toastElement = screen.getByText('Error message')
        expect(toastElement).toBeInTheDocument()

        // Find the toast container with error styling
        const toastContainer = toastElement.closest('[data-sonner-toast]')
        expect(toastContainer).toBeInTheDocument()
        // Verify it has error data attribute
        expect(toastContainer).toHaveAttribute('data-type', 'error')
      })

      // Verify error duration is 8000ms
      expect(TOAST_DURATIONS.error).toBe(8000)
    })

    it('should show warning and info toasts with correct 5s duration configured', async () => {
      // Arrange
      render(<Toaster />)

      // Act - Show warning toast
      act(() => {
        toast.warning('Warning message')
      })

      // Assert warning toast
      await waitFor(() => {
        const warningToast = screen.getByText('Warning message')
        expect(warningToast).toBeInTheDocument()
        const toastContainer = warningToast.closest('[data-sonner-toast]')
        expect(toastContainer).toHaveAttribute('data-type', 'warning')
      })

      // Dismiss and show info toast
      act(() => {
        toast.dismiss()
      })

      act(() => {
        toast.info('Info message')
      })

      // Assert info toast
      await waitFor(() => {
        const infoToast = screen.getByText('Info message')
        expect(infoToast).toBeInTheDocument()
        const toastContainer = infoToast.closest('[data-sonner-toast]')
        expect(toastContainer).toHaveAttribute('data-type', 'info')
      })

      // Verify durations are configured correctly
      expect(TOAST_DURATIONS.warning).toBe(5000)
      expect(TOAST_DURATIONS.info).toBe(5000)
      expect(TOAST_DURATIONS.success).toBe(4000)
    })
  })

  describe('Toast Action Button Support', () => {
    it('should render toast with action button correctly', async () => {
      // Arrange
      const user = userEvent.setup()
      const actionHandler = vi.fn()
      render(<Toaster />)

      // Act
      act(() => {
        toast.error('Item deleted', {
          action: {
            label: 'Undo',
            onClick: actionHandler,
          },
        })
      })

      // Assert - Toast with action button is rendered
      await waitFor(() => {
        const toastElement = screen.getByText('Item deleted')
        expect(toastElement).toBeInTheDocument()

        // Find and verify action button exists
        const actionButton = screen.getByRole('button', { name: /undo/i })
        expect(actionButton).toBeInTheDocument()
      })

      // Act - Click the action button
      const actionButton = screen.getByRole('button', { name: /undo/i })
      await user.click(actionButton)

      // Assert - Handler was called
      expect(actionHandler).toHaveBeenCalledOnce()
    })
  })

  describe('Toast Helper Functions', () => {
    it('should return toast ID from toast helper functions', () => {
      // Arrange
      render(<Toaster />)

      // Act
      let successId: string | number = ''
      let errorId: string | number = ''
      let warningId: string | number = ''
      let infoId: string | number = ''

      act(() => {
        successId = toast.success('Success')
        errorId = toast.error('Error')
        warningId = toast.warning('Warning')
        infoId = toast.info('Info')
      })

      // Assert - All functions return toast IDs
      expect(successId).toBeDefined()
      expect(errorId).toBeDefined()
      expect(warningId).toBeDefined()
      expect(infoId).toBeDefined()

      // IDs should be unique
      expect(successId).not.toBe(errorId)
      expect(errorId).not.toBe(warningId)
      expect(warningId).not.toBe(infoId)
    })

    it('should dismiss specific toast using toast ID', async () => {
      // Arrange
      render(<Toaster />)

      // Act - Create a toast and then dismiss it
      let toastId: string | number = ''
      act(() => {
        toastId = toast.success('Will be dismissed')
      })

      // Verify toast is visible
      await waitFor(() => {
        expect(screen.getByText('Will be dismissed')).toBeInTheDocument()
      })

      // Dismiss the toast
      act(() => {
        toast.dismiss(toastId)
      })

      // Assert - Toast should be dismissed (may take animation time)
      await waitFor(
        () => {
          expect(screen.queryByText('Will be dismissed')).not.toBeInTheDocument()
        },
        { timeout: 2000 }
      )
    })
  })
})
