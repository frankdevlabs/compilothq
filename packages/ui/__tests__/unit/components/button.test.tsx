// @vitest-environment happy-dom

/**
 * Button Component - Unit Tests
 *
 * Tests React component rendering, interactions, and accessibility using happy-dom.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '../../../src/components/button'

describe('Button Component - Unit Tests', () => {
  describe('Rendering', () => {
    it('should render button with correct text', () => {
      // Arrange & Act
      render(<Button>Click me</Button>)

      // Assert
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Click me')
    })

    it('should apply default variant styles', () => {
      // Arrange & Act
      render(<Button>Default Button</Button>)

      // Assert
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('should apply destructive variant styles', () => {
      // Arrange & Act
      render(<Button variant="destructive">Delete</Button>)

      // Assert
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive', 'text-white')
    })

    it('should apply outline variant styles', () => {
      // Arrange & Act
      render(<Button variant="outline">Outline</Button>)

      // Assert
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'bg-background')
    })

    it('should apply size variants correctly', () => {
      // Arrange & Act
      const { rerender } = render(<Button size="sm">Small</Button>)

      // Assert - Small size
      let button = screen.getByRole('button')
      expect(button).toHaveClass('h-8')

      // Act - Change to large size
      rerender(<Button size="lg">Large</Button>)

      // Assert - Large size
      button = screen.getByRole('button')
      expect(button).toHaveClass('h-12')
    })
  })

  describe('User Interactions', () => {
    it('should call onClick handler when clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(<Button onClick={handleClick}>Click me</Button>)

      // Act
      const button = screen.getByRole('button')
      await user.click(button)

      // Assert
      expect(handleClick).toHaveBeenCalledOnce()
    })

    it('should call onClick handler multiple times on multiple clicks', async () => {
      // Arrange
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(<Button onClick={handleClick}>Click me</Button>)

      // Act
      const button = screen.getByRole('button')
      await user.click(button)
      await user.click(button)
      await user.click(button)

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(3)
    })
  })

  describe('Disabled State', () => {
    it('should apply disabled styles when disabled', () => {
      // Arrange & Act
      render(<Button disabled>Disabled Button</Button>)

      // Assert
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('should not call onClick handler when disabled', async () => {
      // Arrange
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(
        <Button disabled onClick={handleClick}>
          Disabled Button
        </Button>
      )

      // Act
      const button = screen.getByRole('button')
      await user.click(button)

      // Assert - onClick should not be called when button is disabled
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Custom className', () => {
    it('should merge custom className with default styles', () => {
      // Arrange & Act
      render(<Button className="custom-class">Custom</Button>)

      // Assert
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
      // Should still have base button classes
      expect(button).toHaveClass('inline-flex', 'items-center')
    })
  })

  describe('asChild prop', () => {
    it('should render as child component when asChild is true', () => {
      // Arrange & Act
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )

      // Assert
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveTextContent('Link Button')
      expect(link).toHaveAttribute('href', '/test')
      // Should still have button styles
      expect(link).toHaveClass('bg-primary')
    })
  })

  describe('Accessibility', () => {
    it('should have data-slot attribute', () => {
      // Arrange & Act
      render(<Button>Accessible Button</Button>)

      // Assert
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-slot', 'button')
    })

    it('should support type attribute', () => {
      // Arrange & Act
      render(<Button type="submit">Submit</Button>)

      // Assert
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should support aria-label attribute', () => {
      // Arrange & Act
      render(<Button aria-label="Close dialog">X</Button>)

      // Assert
      const button = screen.getByRole('button', { name: /close dialog/i })
      expect(button).toBeInTheDocument()
    })
  })
})
