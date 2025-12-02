// @vitest-environment happy-dom

/**
 * FormFieldWrapper Component - Unit Tests
 *
 * Tests React component rendering for form field wrapper using happy-dom.
 */

import { render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { FormFieldWrapper } from '../../../src/components/form-field'
import { Input } from '../../../src/components/input'

/**
 * Test wrapper component that provides FormProvider context
 */
function TestFormWrapper({
  children,
  defaultValues = {},
  errors = {},
}: {
  children: React.ReactNode
  defaultValues?: Record<string, unknown>
  errors?: Record<string, { message: string }>
}) {
  const methods = useForm({ defaultValues })

  // Set errors if provided
  React.useEffect(() => {
    Object.entries(errors).forEach(([name, error]) => {
      methods.setError(name, error)
    })
  }, [errors, methods])

  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('FormFieldWrapper Component - Unit Tests', () => {
  describe('Label Rendering', () => {
    it('should render label correctly with provided text', () => {
      // Arrange & Act
      render(
        <TestFormWrapper>
          <FormFieldWrapper label="Email Address" name="email">
            <Input data-testid="email-input" />
          </FormFieldWrapper>
        </TestFormWrapper>
      )

      // Assert
      const label = screen.getByText('Email Address')
      expect(label).toBeInTheDocument()
      expect(label).toHaveAttribute('data-slot', 'form-label')
    })
  })

  describe('Description Rendering', () => {
    it('should render description text when provided', () => {
      // Arrange & Act
      render(
        <TestFormWrapper>
          <FormFieldWrapper label="Email" name="email" description="We will never share your email">
            <Input data-testid="email-input" />
          </FormFieldWrapper>
        </TestFormWrapper>
      )

      // Assert
      const description = screen.getByText('We will never share your email')
      expect(description).toBeInTheDocument()
      expect(description).toHaveAttribute('data-slot', 'form-description')
      expect(description).toHaveClass('text-muted-foreground', 'text-sm')
    })

    it('should not render description when not provided', () => {
      // Arrange & Act
      render(
        <TestFormWrapper>
          <FormFieldWrapper label="Email" name="email">
            <Input data-testid="email-input" />
          </FormFieldWrapper>
        </TestFormWrapper>
      )

      // Assert
      const descriptions = document.querySelectorAll('[data-slot="form-description"]')
      expect(descriptions).toHaveLength(0)
    })
  })

  describe('Error Message Display', () => {
    it('should display error message when form field has error', async () => {
      // Arrange & Act
      render(
        <TestFormWrapper errors={{ email: { message: 'Email is required' } }}>
          <FormFieldWrapper label="Email" name="email">
            <Input data-testid="email-input" />
          </FormFieldWrapper>
        </TestFormWrapper>
      )

      // Assert - wait for error to be set
      await waitFor(() => {
        const errorMessage = screen.getByText('Email is required')
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveAttribute('data-slot', 'form-message')
        expect(errorMessage).toHaveClass('text-destructive', 'text-sm')
      })
    })

    it('should apply error styling to label when field has error', async () => {
      // Arrange & Act
      render(
        <TestFormWrapper errors={{ email: { message: 'Invalid email' } }}>
          <FormFieldWrapper label="Email" name="email">
            <Input data-testid="email-input" />
          </FormFieldWrapper>
        </TestFormWrapper>
      )

      // Assert - wait for error to be set
      await waitFor(() => {
        const label = screen.getByText('Email')
        expect(label).toHaveAttribute('data-error', 'true')
      })
    })
  })

  describe('Accessibility - aria-describedby linking', () => {
    it('should link form control to description via aria-describedby', async () => {
      // Arrange & Act
      render(
        <TestFormWrapper>
          <FormFieldWrapper label="Email" name="email" description="Enter your email address">
            <Input data-testid="email-input" />
          </FormFieldWrapper>
        </TestFormWrapper>
      )

      // Assert
      await waitFor(() => {
        const formControl = document.querySelector('[data-slot="form-control"]')
        const description = document.querySelector('[data-slot="form-description"]')

        expect(formControl).toBeInTheDocument()
        expect(description).toBeInTheDocument()

        // The aria-describedby should include the description id
        const ariaDescribedBy = formControl?.getAttribute('aria-describedby')
        expect(ariaDescribedBy).toContain(description?.id)
      })
    })

    it('should include error message id in aria-describedby when field has error', async () => {
      // Arrange & Act
      render(
        <TestFormWrapper errors={{ email: { message: 'Email is required' } }}>
          <FormFieldWrapper label="Email" name="email" description="Enter your email">
            <Input data-testid="email-input" />
          </FormFieldWrapper>
        </TestFormWrapper>
      )

      // Assert - wait for error to be set
      await waitFor(() => {
        const formControl = document.querySelector('[data-slot="form-control"]')
        const errorMessage = document.querySelector('[data-slot="form-message"]')
        const description = document.querySelector('[data-slot="form-description"]')

        expect(formControl).toBeInTheDocument()
        expect(errorMessage).toBeInTheDocument()

        // The aria-describedby should include both description and error message ids
        const ariaDescribedBy = formControl?.getAttribute('aria-describedby')
        expect(ariaDescribedBy).toContain(description?.id)
        expect(ariaDescribedBy).toContain(errorMessage?.id)
      })
    })

    it('should set aria-invalid to true when field has error', async () => {
      // Arrange & Act
      render(
        <TestFormWrapper errors={{ email: { message: 'Invalid email format' } }}>
          <FormFieldWrapper label="Email" name="email">
            <Input data-testid="email-input" />
          </FormFieldWrapper>
        </TestFormWrapper>
      )

      // Assert - wait for error to be set
      await waitFor(() => {
        const formControl = document.querySelector('[data-slot="form-control"]')
        expect(formControl).toHaveAttribute('aria-invalid', 'true')
      })
    })
  })
})
