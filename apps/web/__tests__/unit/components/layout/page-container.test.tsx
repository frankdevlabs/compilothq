// @vitest-environment jsdom

/**
 * PageContainer Component - Unit Tests
 *
 * Tests React component for standardized page layout with title, subtitle,
 * breadcrumbs, and actions slots.
 */

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { PageContainer } from '@/components/layout/page-container'

describe('PageContainer Component - Unit Tests', () => {
  afterEach(() => {
    cleanup()
  })

  describe('Title rendering', () => {
    it('should render title as h1 element', () => {
      // Arrange & Act
      render(<PageContainer title="Dashboard">Content</PageContainer>)

      // Assert
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Dashboard')
    })
  })

  describe('Subtitle rendering', () => {
    it('should render subtitle below heading when provided', () => {
      // Arrange & Act
      render(
        <PageContainer title="Dashboard" subtitle="Overview of your activities">
          Content
        </PageContainer>
      )

      // Assert
      const subtitle = screen.getByText('Overview of your activities')
      expect(subtitle).toBeInTheDocument()
      expect(subtitle.tagName.toLowerCase()).toBe('p')
      // Subtitle should have muted text styling
      expect(subtitle).toHaveClass('text-muted-foreground')
    })

    it('should not render subtitle element when not provided', () => {
      // Arrange & Act
      render(<PageContainer title="Dashboard">Content</PageContainer>)

      // Assert - Only the h1 and children content should exist
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
      // No paragraph element for subtitle should exist in header section
      const headerSection = heading.closest('[data-slot="page-header"]')
      expect(headerSection).toBeInTheDocument()
      const subtitleElement = headerSection?.querySelector('[data-slot="subtitle"]')
      expect(subtitleElement).not.toBeInTheDocument()
    })
  })

  describe('Breadcrumbs slot', () => {
    it('should render breadcrumbs slot when provided', () => {
      // Arrange
      const breadcrumbs = (
        <nav aria-label="Breadcrumb" data-testid="breadcrumbs">
          <span>Home</span> / <span>Dashboard</span>
        </nav>
      )

      // Act
      render(
        <PageContainer title="Dashboard" breadcrumbs={breadcrumbs}>
          Content
        </PageContainer>
      )

      // Assert
      const breadcrumbNav = screen.getByTestId('breadcrumbs')
      expect(breadcrumbNav).toBeInTheDocument()
      expect(breadcrumbNav).toHaveAccessibleName('Breadcrumb')
    })
  })

  describe('Actions slot', () => {
    it('should render actions slot right-aligned when provided', () => {
      // Arrange
      const actions = (
        <button type="button" data-testid="action-button">
          Create New
        </button>
      )

      // Act
      render(
        <PageContainer title="Dashboard" actions={actions}>
          Content
        </PageContainer>
      )

      // Assert
      const actionButton = screen.getByTestId('action-button')
      expect(actionButton).toBeInTheDocument()

      // Actions should be in a container that enables right alignment
      const actionsSlot = actionButton.closest('[data-slot="actions"]')
      expect(actionsSlot).toBeInTheDocument()
    })
  })

  describe('Layout styling', () => {
    it('should apply p-6 padding and max-w-7xl constraint', () => {
      // Arrange & Act
      render(
        <PageContainer title="Dashboard" data-testid="page-container">
          Content
        </PageContainer>
      )

      // Assert
      const container = screen.getByTestId('page-container')
      expect(container).toHaveClass('p-6')
      expect(container).toHaveClass('max-w-7xl')
      expect(container).toHaveClass('mx-auto')
    })

    it('should render children below header section', () => {
      // Arrange & Act
      render(
        <PageContainer title="Dashboard">
          <div data-testid="child-content">Main content here</div>
        </PageContainer>
      )

      // Assert
      const childContent = screen.getByTestId('child-content')
      expect(childContent).toBeInTheDocument()
      expect(childContent).toHaveTextContent('Main content here')
    })
  })
})
