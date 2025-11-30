// @vitest-environment happy-dom

/**
 * Skeleton Component - Unit Tests
 *
 * Tests React component rendering for skeleton loading states using happy-dom.
 */

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Skeleton, SkeletonCard, SkeletonText } from '../../../src/components/skeleton'

describe('Skeleton Component - Unit Tests', () => {
  describe('Base Skeleton Component', () => {
    it('should render with correct muted styling', () => {
      // Arrange & Act
      render(<Skeleton data-testid="skeleton" />)

      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('bg-muted')
    })

    it('should apply animate-pulse class for loading animation', () => {
      // Arrange & Act
      render(<Skeleton data-testid="skeleton" />)

      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('animate-pulse')
    })

    it('should merge custom className with default styles', () => {
      // Arrange & Act
      render(<Skeleton data-testid="skeleton" className="h-8 w-full" />)

      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('bg-muted', 'animate-pulse', 'h-8', 'w-full')
    })
  })

  describe('SkeletonText Component', () => {
    it('should render multiple paragraph lines with default count of 3', () => {
      // Arrange & Act
      render(<SkeletonText data-testid="skeleton-text" />)

      // Assert
      const container = screen.getByTestId('skeleton-text')
      const lines = container.querySelectorAll('[data-slot="skeleton"]')
      expect(lines).toHaveLength(3)
    })

    it('should render custom number of lines when specified', () => {
      // Arrange & Act
      render(<SkeletonText data-testid="skeleton-text" lines={5} />)

      // Assert
      const container = screen.getByTestId('skeleton-text')
      const lines = container.querySelectorAll('[data-slot="skeleton"]')
      expect(lines).toHaveLength(5)
    })

    it('should render last line shorter (75%) to simulate natural text ending', () => {
      // Arrange & Act
      render(<SkeletonText data-testid="skeleton-text" lines={3} />)

      // Assert
      const container = screen.getByTestId('skeleton-text')
      const lines = container.querySelectorAll('[data-slot="skeleton"]')
      const lastLine = lines[lines.length - 1]
      expect(lastLine).toHaveClass('w-3/4')
    })
  })

  describe('SkeletonCard Component', () => {
    it('should render card placeholder structure with header, content, and action areas', () => {
      // Arrange & Act
      render(<SkeletonCard data-testid="skeleton-card" />)

      // Assert
      const card = screen.getByTestId('skeleton-card')
      expect(card).toBeInTheDocument()

      // Should have header area (title and description)
      const headerArea = card.querySelector('[data-slot="skeleton-card-header"]')
      expect(headerArea).toBeInTheDocument()

      // Should have content area
      const contentArea = card.querySelector('[data-slot="skeleton-card-content"]')
      expect(contentArea).toBeInTheDocument()
    })

    it('should render action area when showActions is true', () => {
      // Arrange & Act
      render(<SkeletonCard data-testid="skeleton-card" showActions />)

      // Assert
      const card = screen.getByTestId('skeleton-card')
      const actionArea = card.querySelector('[data-slot="skeleton-card-actions"]')
      expect(actionArea).toBeInTheDocument()
    })

    it('should apply card structure styling matching Card component proportions', () => {
      // Arrange & Act
      render(<SkeletonCard data-testid="skeleton-card" />)

      // Assert
      const card = screen.getByTestId('skeleton-card')
      // Card should have rounded corners and border like the Card component
      expect(card).toHaveClass('rounded-lg', 'border')
    })
  })
})
